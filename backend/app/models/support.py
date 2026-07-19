from beanie import Document
from pydantic import Field, BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class Review(Document):
    review_id: str = Field(default_factory=lambda: f"REV-{uuid.uuid4().hex[:8].upper()}")
    customer_id: str
    customer_name: str
    order_id: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    delivery_partner_id: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: str
    images: List[str] = []
    videos: List[str] = []
    visibility: str = "Visible" # Visible, Hidden
    moderation_status: str = "Pending" # Pending, Approved, Rejected
    helpful_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"
        indexes = ["customer_id", "product_id", "rating", "visibility"]

class Complaint(Document):
    complaint_id: str = Field(default_factory=lambda: f"CMP-{uuid.uuid4().hex[:8].upper()}")
    customer_id: str
    order_id: Optional[str] = None
    category: str
    sub_category: Optional[str] = None
    priority: str = "Medium" # Low, Medium, High, Critical
    severity: str = "Moderate"
    status: str = "Open"
    description: str
    attachments: List[str] = []
    assigned_agent: Optional[str] = None
    resolution: Optional[str] = None
    closed_by: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "complaints"
        indexes = ["customer_id", "status", "priority"]

class TicketMessage(BaseModel):
    sender: str # customer, support, system
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SupportTicket(Document):
    ticket_number: str = Field(default_factory=lambda: f"TKT-{uuid.uuid4().hex[:8].upper()}")
    customer_name: str
    customer_phone: Optional[str] = None
    order_id: Optional[str] = None
    source: str = "Web"
    issue_type: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: str = "Medium" # Low, Medium, High, Critical
    status: str = "Open" # Open, Assigned, In Progress, Waiting For Customer, Resolved, Closed
    assigned_to: Optional[str] = None
    department: Optional[str] = None
    internal_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    resolution_notes: Optional[str] = None
    sla_due_date: Optional[datetime] = None
    first_response_time: Optional[datetime] = None
    resolution_time: Optional[datetime] = None
    
    messages: List[TicketMessage] = []
    
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "support_tickets"
        indexes = ["ticket_number", "customer_name", "status", "priority"]

class SLAPolicy(Document):
    name: str
    priority: str
    first_response_target_hours: int
    resolution_target_hours: int
    escalation_path: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "sla_policies"
