import base64
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware

from database import connect_db, close_db, get_camp_by_id, add_camp, query_camps
from models import CampResponse, CampListResponse

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024  # 2MB


@asynccontextmanager
async def lifespan(application: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="Bhandara - Free Food Camp Finder", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def camp_to_response(doc: dict) -> CampResponse:
    return CampResponse(
        id=doc["id"],
        title=doc["title"],
        description=doc.get("description"),
        address=doc["address"],
        latitude=doc["latitude"],
        longitude=doc["longitude"],
        date=doc["date"],
        start_time=doc["start_time"],
        end_time=doc.get("end_time"),
        organizer_name=doc.get("organizer_name"),
        organizer_phone=doc.get("organizer_phone"),
        image_url=doc.get("image_url"),
        source=doc.get("source", "user"),
        is_active=doc.get("is_active", True),
        is_recurring=doc.get("is_recurring", False),
        created_at=doc.get("created_at", ""),
    )


@app.get("/api/camps", response_model=CampListResponse)
async def list_camps(
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(50, ge=1, le=500),
    city: Optional[str] = Query(None, max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    camps, total = await query_camps(
        lat=lat, lng=lng, radius_km=radius_km, city=city, page=page, limit=limit
    )
    return CampListResponse(
        camps=[camp_to_response(c) for c in camps],
        total=total,
    )


@app.get("/api/camps/{camp_id}", response_model=CampResponse)
async def get_camp(camp_id: str):
    doc = await get_camp_by_id(camp_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Camp not found")
    return camp_to_response(doc)


@app.post("/api/camps", response_model=CampResponse, status_code=201)
async def create_camp(
    title: str = Form(...),
    address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    date: str = Form(...),
    start_time: str = Form(...),
    end_time: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    organizer_name: Optional[str] = Form(None),
    organizer_phone: Optional[str] = Form(None),
    is_recurring: bool = Form(False),
    image: Optional[UploadFile] = File(None),
):
    image_url = None
    if image and image.filename:
        content = await image.read()
        if len(content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Image must be under 2MB")
        content_type = image.content_type or "image/jpeg"
        b64 = base64.b64encode(content).decode("utf-8")
        image_url = f"data:{content_type};base64,{b64}"

    doc = {
        "title": title.strip(),
        "description": description.strip() if description else None,
        "address": address.strip(),
        "latitude": latitude,
        "longitude": longitude,
        "date": date,
        "start_time": start_time,
        "end_time": end_time,
        "organizer_name": organizer_name.strip() if organizer_name else None,
        "organizer_phone": organizer_phone.strip() if organizer_phone else None,
        "image_url": image_url,
        "source": "user",
        "is_active": True,
        "is_recurring": is_recurring,
    }

    saved = await add_camp(doc)
    return camp_to_response(saved)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
