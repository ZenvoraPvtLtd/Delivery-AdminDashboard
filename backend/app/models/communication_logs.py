from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class CommunicationLog(Document):
    log_id: str
    order_id: str
    channel: str # whatsapp, sms
    direction: str # outbound, inbound
    status: str # queued, sent, delivered, failed, received
    from_number: str
    to_number: str
    body: str
    message_sid: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "communication_logs"

class ConversationThread(Document):
    order_id: str
    customer_phone: str
    status: str = "active" # active, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversation_threads"
