from pydantic import Field
from typing import List, Optional
from datetime import datetime
from models.base import MongoBaseModel

class OrderItem(MongoBaseModel):
    productId: str
    name: str
    quantity: int
    price: float
    isVeg: bool = Field(default=True)

class TimelineEvent(MongoBaseModel):
    status: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    title: str
    description: str

class Order(MongoBaseModel):
    id: str
    customerId: str
    customerName: str
    customerPhone: str
    outletId: str
    outletName: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    deliveryCharge: float = Field(default=0.0)
    packagingCharge: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    total: float
    status: str = Field(default="Pending")  # Pending, Accepted, Preparing, Ready, Picked Up, Out for Delivery, Delivered, Cancelled
    paymentStatus: str = Field(default="Pending")  # Pending, Paid, Failed, Refunded
    paymentMethod: str = Field(default="Cash")
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    deliveryPartnerId: Optional[str] = None
    address: str
    orderType: str = Field(default="Delivery")  # Delivery, Takeaway, Dine-in
    timeline: List[TimelineEvent] = Field(default_factory=list)
    confirmation_status: str = Field(default="Pending")  # Pending, Confirmed, Cancelled
    confirmed_at: Optional[str] = None
    confirmation_source: Optional[str] = None  # whatsapp, sms, admin
