from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class Category(Document):
    name: str
    slug: str
    parent_category: Optional[str] = None
    image: Optional[str] = None
    status: str = "Active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "categories"

class Brand(Document):
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "brands"

class Product(Document):
    product_id: str = Field(default_factory=lambda: f"PRD-{uuid.uuid4().hex[:8].upper()}")
    sku: str
    barcode: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    
    unit: str = "pcs"
    mrp: float
    selling_price: float
    cost_price: Optional[float] = None
    gst: float = 0.0
    discount: float = 0.0
    
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    
    images: List[str] = []
    
    status: str = "Active"
    visibility: bool = True
    
    stock_quantity: int = 0
    minimum_stock: int = 5
    maximum_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    
    supplier: Optional[str] = None
    tags: List[str] = []
    
    featured_product: bool = False
    best_seller: bool = False
    trending: bool = False
    
    # frontend specifics
    is_veg: bool = True
    preparation_time: int = 10
    outlet_ids: List[str] = []
    
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"
        indexes = ["product_id", "sku", "category", "status"]
