from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo import IndexModel, ASCENDING, DESCENDING

class Order(Document):
    id: str
    customerName: str
    customerPhone: str
    amount: float
    status: str
    items: List[Dict[str, Any]] = []
    
    confirmation_status: str = "Pending"
    confirmation_requested_at: Optional[str] = None
    confirmed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    customer_reply: Optional[str] = None
    confirmation_source: Optional[str] = None
    
    createdAt: str

    class Settings:
        name = "orders"
        indexes = [
            "status",
            "customerPhone",
            IndexModel([("status", ASCENDING), ("createdAt", DESCENDING)])
        ]
