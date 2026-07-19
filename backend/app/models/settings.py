from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class BusinessSetting(Document):
    setting_id: str = "default_business"
    delivery_fee: str = "2.99"
    packaging_fee: str = "1.50"
    business_hours: str = "08:00 AM - 11:00 PM"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "business_settings"

class ApiConfiguration(Document):
    setting_id: str = "default_apis"
    google_maps_enabled: bool = True
    razorpay_enabled: bool = True
    twilio_enabled: bool = False
    smtp_enabled: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "api_configurations"

class DatabaseBackup(Document):
    backup_id: str
    size: str
    status: str = "Completed"
    date: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "system_backups"
