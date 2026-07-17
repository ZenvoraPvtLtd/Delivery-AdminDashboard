from pydantic import Field
from typing import Optional
from models.base import MongoBaseModel
from datetime import datetime

class PaymentLog(MongoBaseModel):
    id: str
    order_id: str
    amount: float
    method: str  # UPI, Card, Cash, Razorpay, Wallet
    status: str = Field(default="Completed")  # Completed, Pending, Failed, Refunded
    transaction_id: Optional[str] = None
    refund_details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.now)
