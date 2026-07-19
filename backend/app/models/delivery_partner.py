from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class DeliveryPartner(Document):
    partner_id: str = Field(default_factory=lambda: f"DP-{uuid.uuid4().hex[:8].upper()}")
    partner_code: str = ""
    full_name: str
    profile_photo: Optional[str] = None
    email: Optional[str] = None
    mobile_number: str
    emergency_contact: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    status: str = "Offline" # Offline, Available, On Delivery, Suspended, Blocked
    verification_status: str = "Pending" # Pending, Verified, Rejected
    license_verified: bool = False
    
    rating: float = 5.0
    
    completed_deliveries: int = 0
    cancelled_deliveries: int = 0
    pending_deliveries: int = 0
    
    assigned_orders: List[str] = []
    current_active_order: Optional[str] = None
    
    joining_date: datetime = Field(default_factory=datetime.utcnow)
    last_active_time: Optional[datetime] = None
    
    total_earnings: float = 0.0
    wallet_balance: float = 0.0
    
    bank_details: Optional[dict] = None
    upi_details: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "delivery_partners"
        indexes = ["partner_id", "mobile_number", "status", "created_at"]

class DeliveryPartnerVehicle(Document):
    partner_id: str
    vehicle_type: str = "Bike" # Bike, Scooter, E-Bike
    vehicle_number: str
    rc_number: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    driving_license_number: Optional[str] = None
    driving_license_expiry: Optional[datetime] = None
    pollution_certificate: Optional[str] = None
    
    vehicle_photo: Optional[str] = None
    rc_photo: Optional[str] = None
    insurance_photo: Optional[str] = None
    license_photo: Optional[str] = None
    
    verification_status: str = "Pending" # Pending, Verified, Rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "delivery_partner_vehicles"
        indexes = ["partner_id", "vehicle_number"]

class DeliveryPartnerLocation(Document):
    partner_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    updated_time: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "delivery_partner_locations"
        indexes = ["partner_id", "updated_time"]

class DeliveryPartnerEarning(Document):
    partner_id: str
    amount: float
    transaction_type: str # Delivery Fee, Tip, Bonus, Penalty, Settlement
    order_id: Optional[str] = None
    description: Optional[str] = None
    status: str = "Pending" # Pending, Paid
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "delivery_partner_earnings"
        indexes = ["partner_id", "created_at", "status"]

class DeliveryPartnerActivityLog(Document):
    partner_id: str
    action: str
    description: str
    performed_by: str
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "delivery_partner_activity_logs"
        indexes = ["partner_id", "created_at"]
