"""
Seed script to populate MongoDB with sample camps.
Run: python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone

from database import connect_db, close_db, get_all_camps, add_camp

SAMPLE_CAMPS = [
    {
        "title": "Gurudwara Bangla Sahib Langar",
        "description": "Daily free langar serving dal, roti, rice and kheer. Open for everyone.",
        "address": "Ashoka Road, Connaught Place, New Delhi",
        "latitude": 28.6264,
        "longitude": 77.2090,
        "organizer_name": "Gurudwara Bangla Sahib",
        "source": "verified",
        "is_recurring": True,
    },
    {
        "title": "Shiv Bhandara - Karol Bagh",
        "description": "Free bhandara with poori, sabzi, halwa and chai.",
        "address": "Hanuman Mandir, Karol Bagh, New Delhi",
        "latitude": 28.6519,
        "longitude": 77.1903,
        "organizer_name": "Ram Sewa Samiti",
        "organizer_phone": "+91-9876543210",
        "source": "user",
        "is_recurring": False,
    },
    {
        "title": "Akshaya Patra Food Distribution",
        "description": "Free nutritious meals distributed to all. Part of mid-day meal programme.",
        "address": "Sector 29, Noida, Uttar Pradesh",
        "latitude": 28.5790,
        "longitude": 77.3490,
        "organizer_name": "Akshaya Patra Foundation",
        "source": "cron",
        "is_recurring": True,
    },
    {
        "title": "Sai Baba Bhandara",
        "description": "Weekly free food distribution every Thursday. Rice, dal, sabzi and sweet.",
        "address": "Sai Baba Mandir, Lodhi Road, New Delhi",
        "latitude": 28.5917,
        "longitude": 77.2272,
        "organizer_name": "Sai Sewa Trust",
        "source": "verified",
        "is_recurring": False,
    },
    {
        "title": "ISKCON Free Prasadam",
        "description": "Free vegetarian prasadam daily. Delicious sattvic food.",
        "address": "ISKCON Temple, East of Kailash, New Delhi",
        "latitude": 28.5506,
        "longitude": 77.2519,
        "organizer_name": "ISKCON Delhi",
        "source": "cron",
        "is_recurring": True,
    },
    {
        "title": "Jama Masjid Area Community Kitchen",
        "description": "Free meals for the community. Open to everyone.",
        "address": "Jama Masjid, Old Delhi",
        "latitude": 28.6507,
        "longitude": 77.2334,
        "organizer_name": "Community Volunteers",
        "source": "user",
        "is_recurring": False,
    },
]


async def seed():
    await connect_db()

    existing = await get_all_camps()
    if len(existing) > 0:
        print(f"Database already has {len(existing)} camps. Skipping seed.")
        await close_db()
        return

    now = datetime.now(timezone.utc)
    for i, camp_data in enumerate(SAMPLE_CAMPS):
        is_recurring = camp_data.get("is_recurring", False)
        day_offset = 0 if is_recurring else (i % 5)
        camp = {
            **camp_data,
            "date": (now + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
            "start_time": f"{8 + (i % 4) * 3:02d}:00",
            "end_time": f"{11 + (i % 4) * 3:02d}:00",
            "image_url": None,
            "is_active": True,
        }
        await add_camp(camp)

    print(f"Seeded {len(SAMPLE_CAMPS)} camps into MongoDB")
    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
