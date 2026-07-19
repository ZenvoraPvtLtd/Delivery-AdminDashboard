from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class Supplier(Document):
    supplier_id: str = Field(default_factory=lambda: f"SUP-{uuid.uuid4().hex[:8].upper()}")
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    status: str = "Active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "suppliers"

class InventoryItem(Document):
    item_id: str = Field(default_factory=lambda: f"INV-{uuid.uuid4().hex[:8].upper()}")
    name: str
    category: str
    unit: str
    
    current_stock: float = 0.0
    reserved_stock: float = 0.0
    available_stock: float = 0.0
    damaged_stock: float = 0.0
    returned_stock: float = 0.0
    
    min_stock_alert: float = 10.0
    maximum_stock: Optional[float] = None
    
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "inventory"
        indexes = ["item_id", "category"]

class InventoryTransaction(Document):
    transaction_id: str = Field(default_factory=lambda: f"TRX-{uuid.uuid4().hex[:8].upper()}")
    item_id: str
    transaction_type: str # Stock In, Stock Out, Adjustment, Reserved, Restored
    quantity: float
    reference_id: Optional[str] = None # Order ID or PO ID
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "inventory_transactions"
        indexes = ["item_id", "transaction_type"]

class PurchaseOrder(Document):
    po_id: str = Field(default_factory=lambda: f"po-{datetime.utcnow().timestamp()}")
    item_name: str
    quantity: float
    unit: str
    supplier_name: str
    status: str = "Sent"
    date: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "purchase_orders"
