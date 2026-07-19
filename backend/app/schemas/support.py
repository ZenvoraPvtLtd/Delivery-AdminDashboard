from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.support import TicketMessage

class ReviewResponse(BaseModel):
    id: str
    customer: str
    dish: str
    rating: int
    comment: str
    date: str
    status: str

class TicketResponse(BaseModel):
    id: str
    customerName: str
    customerPhone: str
    issueType: str
    priority: str
    status: str
    createdAt: datetime
    messages: List[TicketMessage]

class TicketReplyRequest(BaseModel):
    text: str
    sender: str = "support"

class ToggleReviewStatusRequest(BaseModel):
    status: str
