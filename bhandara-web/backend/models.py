from pydantic import BaseModel, Field
from typing import Optional


class CampResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    date: str
    start_time: str
    end_time: Optional[str] = None
    organizer_name: Optional[str] = None
    organizer_phone: Optional[str] = None
    image_url: Optional[str] = None
    source: str = "user"
    is_active: bool = True
    is_recurring: bool = False
    created_at: str


class CampListResponse(BaseModel):
    camps: list[CampResponse]
    total: int
