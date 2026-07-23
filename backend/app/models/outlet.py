from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
import uuid

class Outlet(Document):
    outlet_id: str = Field(default_factory=lambda: f"out-{uuid.uuid4().hex[:6]}")
    name: str
    address: str
    manager: str
    phone: str
    status: str = "Open"  # Open, Closed
    revenue: float = 0.0
    orders_count: int = 0
    tax_number: str = "GST-33AABCC1234D"
    hours: str = "08:00 AM - 11:00 PM"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "outlets"
        indexes = ["outlet_id", "status"]
