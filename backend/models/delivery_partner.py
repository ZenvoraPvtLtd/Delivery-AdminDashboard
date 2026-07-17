from pydantic import Field
from typing import Optional
from models.base import MongoBaseModel

class DeliveryPartner(MongoBaseModel):
    id: str
    name: str
    phone: str
    vehicleType: str  # Bike, Scooter, E-Bike
    vehicleNumber: str
    licenseVerified: bool = Field(default=True)
    insuranceExpiry: str
    status: str = Field(default="Available")  # Available, On Delivery, Offline
    rating: float = Field(default=5.0)
    earnings: float = Field(default=0.0)
    assignedOrderId: Optional[str] = None
    latitude: float
    longitude: float
    avatar: str
