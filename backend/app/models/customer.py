from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class Customer(Document):
    customer_id: str = Field(default_factory=lambda: f"CUST-{uuid.uuid4().hex[:8].upper()}")
    customer_code: str = ""
    full_name: str
    email: str
    mobile_number: str
    alternative_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    profile_photo: Optional[str] = None
    referral_code: str = Field(default_factory=lambda: uuid.uuid4().hex[:6].upper())
    referred_by: Optional[str] = None
    customer_type: str = "Standard" # Standard, Premium, VIP
    status: str = "Active" # Active, Inactive, Blocked
    blocked_status: bool = False
    
    # Financial & Loyalty
    wallet_balance: float = 0.0
    reward_points: int = 0
    
    # Order Analytics
    total_orders: int = 0
    completed_orders: int = 0
    cancelled_orders: int = 0
    pending_orders: int = 0
    total_spend: float = 0.0
    average_order_value: float = 0.0
    last_order_date: Optional[datetime] = None
    
    # Preferences
    preferred_payment_method: Optional[str] = None
    preferred_outlet: Optional[str] = None
    favorite_items: List[str] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customers"
        indexes = [
            "customer_id",
            "email",
            "mobile_number",
            "referral_code",
            "status",
            "created_at"
        ]

class CustomerAddress(Document):
    customer_id: str
    address_type: str = "Home" # Home, Office, Other
    address_line: str
    landmark: Optional[str] = None
    area: Optional[str] = None
    city: str
    state: str
    country: str = "USA"
    postal_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    default_address: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_addresses"
        indexes = ["customer_id", "default_address"]

class CustomerWalletTransaction(Document):
    customer_id: str
    transaction_type: str # Credit, Debit
    amount: float
    balance_after: float
    reason: str
    reference_id: Optional[str] = None # E.g., Order ID or Refund ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_wallets"
        indexes = ["customer_id", "transaction_type", "created_at"]

class CustomerNote(Document):
    customer_id: str
    internal_notes: str
    customer_remarks: Optional[str] = None
    created_by: str # User/Admin who created it
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_notes"
        indexes = ["customer_id", "created_at"]

class CustomerActivityLog(Document):
    customer_id: str
    action: str
    module: str = "Customers"
    description: str
    performed_by: str # user_id or email
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_activity_logs"
        indexes = ["customer_id", "action", "created_at"]
