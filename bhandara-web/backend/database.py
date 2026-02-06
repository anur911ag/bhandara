import math
import os
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import quote_plus

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


def _encode_mongo_uri(uri: str) -> str:
    """URL-encode username and password in a MongoDB URI so special chars don't break parsing."""
    # Find scheme (mongodb:// or mongodb+srv://)
    scheme_end = uri.find("://")
    if scheme_end == -1:
        return uri
    scheme = uri[: scheme_end + 3]
    rest = uri[scheme_end + 3 :]

    # Find the last @ which separates credentials from host
    at_idx = rest.rfind("@")
    if at_idx == -1:
        return uri  # no credentials in the URI

    userinfo = rest[:at_idx]
    hostinfo = rest[at_idx + 1 :]

    # Split userinfo into user:password on the first colon
    colon_idx = userinfo.find(":")
    if colon_idx == -1:
        return f"{scheme}{quote_plus(userinfo)}@{hostinfo}"

    user = userinfo[:colon_idx]
    password = userinfo[colon_idx + 1 :]
    return f"{scheme}{quote_plus(user)}:{quote_plus(password)}@{hostinfo}"


MONGO_URI = _encode_mongo_uri(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
DB_NAME = os.getenv("MONGO_DB_NAME", "bhandara")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    # Create index on location for geo queries and on is_active for filtering
    await db.camps.create_index("is_active")
    await db.camps.create_index("id", unique=True)


async def close_db():
    global client
    if client:
        client.close()


def _collection():
    return db["camps"]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    EARTH_RADIUS_KM = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _camp_status(camp: dict, now: datetime) -> str | None:
    """Return 'active', 'upcoming', or None (expired).

    Recurring camps repeat daily — they are never expired.
    Their stored date is ignored; only start_time/end_time matter.
    """
    today_str = now.strftime("%Y-%m-%d")
    now_time_str = now.strftime("%H:%M")
    start = camp.get("start_time", "00:00")
    end = camp.get("end_time")
    recurring = camp.get("is_recurring", False)

    if recurring:
        if end and now_time_str > end:
            return "upcoming"  # done for today, runs again tomorrow
        if now_time_str >= start:
            return "active"
        return "upcoming"

    camp_date = camp.get("date", "")

    if camp_date < today_str:
        return None  # expired
    if camp_date > today_str:
        return "upcoming"

    # camp_date == today
    if end and now_time_str > end:
        return None  # ended today
    if now_time_str >= start:
        return "active"
    return "upcoming"


def _clean_doc(doc: dict) -> dict:
    """Remove MongoDB _id from the document before returning."""
    doc.pop("_id", None)
    return doc


async def get_all_camps() -> list[dict]:
    cursor = _collection().find({}, {"_id": 0})
    return await cursor.to_list(length=None)


async def get_camp_by_id(camp_id: str) -> dict | None:
    doc = await _collection().find_one({"id": camp_id}, {"_id": 0})
    return doc


async def add_camp(camp: dict) -> dict:
    camp["id"] = uuid.uuid4().hex[:12]
    camp["created_at"] = datetime.now(timezone.utc).isoformat()
    if camp.get("is_recurring") and not camp.get("date"):
        camp["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await _collection().insert_one(camp)
    return _clean_doc(camp)


async def query_camps(
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 50,
    city: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[dict], int]:
    now = datetime.now(timezone.utc)

    # Build MongoDB query filter
    query_filter: dict = {"is_active": {"$ne": False}}
    if city and city.strip():
        query_filter["address"] = {"$regex": city.strip(), "$options": "i"}

    cursor = _collection().find(query_filter, {"_id": 0})
    camps = await cursor.to_list(length=None)

    # Filter: only active/upcoming, skip expired
    filtered = []
    for c in camps:
        status = _camp_status(c, now)
        if status is None:
            continue
        c["_status"] = status
        filtered.append(c)

    # Geo filter
    if lat is not None and lng is not None:
        with_dist = []
        for c in filtered:
            dist = haversine_km(lat, lng, c["latitude"], c["longitude"])
            if dist <= radius_km:
                c["_dist"] = dist
                with_dist.append(c)
        filtered = with_dist

    # Sort: active first, then upcoming; within each group by date+time+distance
    def sort_key(c: dict) -> tuple:
        status_order = 0 if c.get("_status") == "active" else 1
        dist = c.get("_dist", 99999)
        sort_date = (
            datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if c.get("is_recurring")
            else c.get("date", "")
        )
        return (status_order, sort_date, c.get("start_time", ""), dist)

    filtered.sort(key=sort_key)

    total = len(filtered)
    start_idx = (page - 1) * limit
    page_items = filtered[start_idx : start_idx + limit]

    # Clean internal keys
    for c in page_items:
        c.pop("_status", None)
        c.pop("_dist", None)

    return page_items, total
