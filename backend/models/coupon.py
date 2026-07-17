from pydantic import Field
from typing import Optional
from models.base import MongoBaseModel

class Coupon(MongoBaseModel):
    id: str
    code: str
    discountType: str  # Flat, Percentage
    value: float
    minOrderValue: float = Field(default=0.0)
    maxDiscount: Optional[float] = None
    expiryDate: str
    usageCount: int = Field(default=0)
    usageLimit: int = Field(default=100)
    targetType: str = Field(default="All")  # All, Outlet-wise, Customer-wise
    status: str = Field(default="Active")  # Active, Expired, Suspended
