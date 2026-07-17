from pydantic import Field
from typing import List, Optional
from models.base import MongoBaseModel

class Product(MongoBaseModel):
    id: str
    name: str
    category: str
    subcategory: str
    price: float
    discount: float = Field(default=0.0)
    availability: bool = Field(default=True)
    preparationTime: int = Field(default=10)
    isVeg: bool = Field(default=True)
    isBestSeller: bool = Field(default=False)
    image: str
    outletIds: List[str] = Field(default_factory=list)
    gstRate: float = Field(default=5.0)
    description: str
