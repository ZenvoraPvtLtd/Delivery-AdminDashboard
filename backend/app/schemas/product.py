from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProductCreate(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    price: float = Field(alias="selling_price")
    discount: float = 0.0
    availability: bool = True
    preparation_time: int = 10
    is_veg: bool = True
    is_best_seller: bool = False
    image: Optional[str] = None
    outlet_ids: List[str] = []
    gst_rate: float = Field(alias="gst", default=5.0)
    description: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    product_id: str
    sku: str
    name: str
    category: str
    subcategory: Optional[str] = None
    price: float = 0.0
    discount: float = 0.0
    availability: bool = True
    preparationTime: int = 10
    isVeg: bool = True
    isBestSeller: bool = False
    image: Optional[str] = None
    outletIds: List[str] = []
    gstRate: float = 5.0
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PaginatedProductResponse(BaseModel):
    success: bool
    message: str
    data: List[ProductResponse]
    total: int
    page: int
    size: int
    
class ToggleAvailabilityRequest(BaseModel):
    availability: bool
