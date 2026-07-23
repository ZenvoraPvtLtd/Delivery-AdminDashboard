from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo import IndexModel, ASCENDING, DESCENDING
import uuid

class Order(Document):
    order_id: str = Field(default_factory=lambda: f"order-{uuid.uuid4().hex[:6]}")
    customer_id: str = "cust-1"
    customer_name: str
    customer_phone: str
    outlet_id: str = "out-1"
    outlet_name: str = "Downtown Central Outlet"
    
    items: List[Dict[str, Any]] = []
    subtotal: float = 0.0
    tax: float = 0.0
    delivery_charge: float = 0.0
    packaging_charge: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    
    status: str = "Pending"  # Pending, Preparing, Ready, Out for Delivery, Delivered, Cancelled
    payment_status: str = "Paid"  # Paid, Unpaid, Refunded
    payment_method: str = "UPI"  # UPI, Card, Wallet, Cash
    
    address: str = "32 Wall Street, NY"
    delivery_partner_id: Optional[str] = None
    timeline: List[Dict[str, Any]] = []
    order_type: str = "Delivery"  # Delivery, Takeaway
    
    # Confirmation Desk Fields
    confirmation_status: Optional[str] = "Pending"
    confirmation_source: Optional[str] = None
    confirmation_requested_at: Optional[str] = None
    confirmed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    confirmation_token: Optional[str] = None
    confirmation_expiry: Optional[str] = None
    customer_reply: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
        indexes = [
            "order_id",
            "status",
            "customer_phone",
            "outlet_id",
            IndexModel([("status", ASCENDING), ("created_at", DESCENDING)])
        ]
