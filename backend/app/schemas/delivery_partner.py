from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class DeliveryPartnerCreate(BaseModel):
    full_name: str
    mobile_number: str
    vehicle_type: str = "Bike"
    vehicle_number: str
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class DeliveryPartnerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class DeliveryPartnerResponse(BaseModel):
    id: str
    partner_id: str
    full_name: str
    mobile_number: str
    email: Optional[str] = None
    status: str
    verification_status: str
    license_verified: bool
    rating: float
    total_earnings: float
    wallet_balance: float
    created_at: datetime
    updated_at: datetime
    
class DeliveryPartnerDetailResponse(DeliveryPartnerResponse):
    assigned_orders: List[str]
    current_active_order: Optional[str] = None
    completed_deliveries: int
    cancelled_deliveries: int
    pending_deliveries: int

class PaginatedPartnerResponse(BaseModel):
    success: bool
    message: str
    data: List[DeliveryPartnerResponse]
    total: int
    page: int
    size: int

class VehicleResponse(BaseModel):
    id: str
    partner_id: str
    vehicle_type: str
    vehicle_number: str
    verification_status: str
    created_at: datetime

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None

class DutyStatusUpdate(BaseModel):
    status: str # Available, Offline

class LicenseVerifyUpdate(BaseModel):
    verified: bool

class EarningsResponse(BaseModel):
    id: str
    amount: float
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime
