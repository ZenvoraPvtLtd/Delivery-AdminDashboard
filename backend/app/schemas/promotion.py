from pydantic import BaseModel
from typing import Optional

class CouponResponse(BaseModel):
    id: str
    code: str
    discountType: str
    value: float
    minOrderValue: float
    maxDiscount: Optional[float]
    expiryDate: str
    usageCount: int
    usageLimit: int
    targetType: str
    status: str

class CouponCreateRequest(BaseModel):
    code: str
    discountType: str
    value: float
    minOrderValue: float
    maxDiscount: Optional[float] = None
    expiryDate: str
    usageLimit: int = 250
    targetType: str = "All"
    status: str = "Active"

class OfferResponse(BaseModel):
    id: str
    name: str
    details: str
    schedule: str
    status: str
