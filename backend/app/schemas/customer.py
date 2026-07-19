from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# =====================
# CUSTOMER SCHEMAS
# =====================

class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str
    alternative_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    customer_type: str = "Standard"
    preferred_payment_method: Optional[str] = None
    preferred_outlet: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    alternative_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    customer_type: Optional[str] = None
    preferred_payment_method: Optional[str] = None
    preferred_outlet: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    customer_id: str
    referral_code: str
    status: str
    blocked_status: bool
    wallet_balance: float
    reward_points: int
    total_orders: int
    total_spend: float
    last_order_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PaginatedCustomerResponse(BaseModel):
    success: bool
    message: str
    data: List[CustomerResponse]
    total: int
    page: int
    size: int

# =====================
# ADDRESS SCHEMAS
# =====================

class AddressBase(BaseModel):
    address_type: str = "Home"
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

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    address_line: Optional[str] = None
    landmark: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    default_address: Optional[bool] = None

class AddressResponse(AddressBase):
    id: str
    customer_id: str
    created_at: datetime
    updated_at: datetime

# =====================
# WALLET SCHEMAS
# =====================

class WalletAdjustRequest(BaseModel):
    amount: float # Can be positive (credit) or negative (debit)
    reason: str
    reference_id: Optional[str] = None

class WalletTransactionResponse(BaseModel):
    id: str
    customer_id: str
    transaction_type: str
    amount: float
    balance_after: float
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

# =====================
# NOTES SCHEMAS
# =====================

class NoteCreate(BaseModel):
    internal_notes: str
    customer_remarks: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    customer_id: str
    internal_notes: str
    customer_remarks: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

# =====================
# ACTIVITY LOG SCHEMAS
# =====================

class ActivityLogResponse(BaseModel):
    id: str
    action: str
    module: str
    description: str
    performed_by: str
    ip_address: Optional[str] = None
    created_at: datetime
