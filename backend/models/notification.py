from pydantic import Field
from typing import Optional
from models.base import MongoBaseModel
from datetime import datetime

class NotificationLog(MongoBaseModel):
    id: str
    order_id: str
    customer_id: Optional[str] = None
    type: str  # confirmation, cancellation, success, reminder
    provider: str  # meta, twilio, msg91, etc.
    status: str = Field(default="pending")  # sent, delivered, read, failed, pending
    retry_count: int = Field(default=0)
    sent_at: datetime = Field(default_factory=datetime.now)
    delivered_at: Optional[datetime] = None
    provider_response: Optional[str] = None

class SmsLog(MongoBaseModel):
    id: str
    order_id: str
    phone: str
    provider: str
    text: str
    status: str
    sent_at: datetime = Field(default_factory=datetime.now)

class WhatsappLog(MongoBaseModel):
    id: str
    order_id: str
    phone: str
    text: str
    status: str
    sent_at: datetime = Field(default_factory=datetime.now)
