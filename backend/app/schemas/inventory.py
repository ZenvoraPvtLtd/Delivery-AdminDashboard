from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    stock: float = Field(alias="current_stock")
    minStockAlert: float = Field(alias="min_stock_alert")
    supplier: str
    expiryDate: Optional[str] = Field(alias="expiry_date")
    created_at: datetime
    updated_at: datetime

class PaginatedInventoryResponse(BaseModel):
    success: bool
    message: str
    data: List[InventoryItemResponse]
    total: int
    page: int
    size: int

class StockAdjustRequest(BaseModel):
    amount: float

class PurchaseOrderCreate(BaseModel):
    item: str
    qty: float
    supplier: str

class PurchaseOrderResponse(BaseModel):
    id: str
    item: str = Field(alias="item_name")
    qty: float = Field(alias="quantity")
    unit: str
    supplier: str = Field(alias="supplier_name")
    status: str
    date: str

class OrderDeductionRequest(BaseModel):
    order_id: str
    items: List[dict] # {"item_id": str, "quantity": float}
