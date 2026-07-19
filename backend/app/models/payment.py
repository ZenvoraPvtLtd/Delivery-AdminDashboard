from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class Payment(Document):
    payment_id: str = Field(default_factory=lambda: f"PAY-{uuid.uuid4().hex[:8].upper()}")
    transaction_id: str = Field(default_factory=lambda: f"TXN-{uuid.uuid4().hex[:8].upper()}")
    gateway_transaction_id: Optional[str] = None
    
    order_id: str
    customer_id: str
    customer_name: Optional[str] = None
    
    amount: float
    tax: float = 0.0
    discount: float = 0.0
    coupon_discount: float = 0.0
    delivery_charges: float = 0.0
    packing_charges: float = 0.0
    wallet_amount_used: float = 0.0
    final_amount: float
    currency: str = "USD"
    
    payment_method: str # UPI, Credit Card, Wallet, Cash On Delivery
    payment_gateway: str # Razorpay, Stripe, PhonePe
    payment_status: str = "Pending" # Pending, Authorized, Captured, Failed, Cancelled, Refunded
    payment_source: str = "Web"
    
    gateway_response: Optional[Dict[str, Any]] = None
    gateway_metadata: Optional[Dict[str, Any]] = None
    failure_reason: Optional[str] = None
    
    refund_status: Optional[str] = None
    refund_amount: float = 0.0
    refund_reason: Optional[str] = None
    
    settlement_status: str = "Pending"
    
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "payments"
        indexes = ["transaction_id", "order_id", "customer_id", "payment_status", "payment_gateway"]

class Wallet(Document):
    customer_id: str
    wallet_balance: float = 0.0
    lifetime_credits: float = 0.0
    lifetime_debits: float = 0.0
    reward_balance: float = 0.0
    referral_balance: float = 0.0
    last_transaction: Optional[datetime] = None
    status: str = "Active"

    class Settings:
        name = "wallets"
        indexes = ["customer_id"]

class WalletTransaction(Document):
    transaction_id: str = Field(default_factory=lambda: f"WTXN-{uuid.uuid4().hex[:8].upper()}")
    wallet_id: str
    customer_id: str
    transaction_type: str # Credit, Debit, Refund, Cashback, Reward, Referral
    amount: float
    reason: str
    reference_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "wallet_transactions"
        indexes = ["wallet_id", "customer_id"]

class Refund(Document):
    refund_id: str = Field(default_factory=lambda: f"REF-{uuid.uuid4().hex[:8].upper()}")
    order_id: str
    payment_id: str
    customer_id: str
    refund_amount: float
    refund_method: str
    refund_reason: str
    refund_status: str = "Pending"
    approved_by: Optional[str] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "refunds"
        indexes = ["order_id", "payment_id"]

class Settlement(Document):
    settlement_id: str = Field(default_factory=lambda: f"SETL-{uuid.uuid4().hex[:8].upper()}")
    gateway: str
    settlement_amount: float
    settlement_date: str
    status: str = "Pending"
    reference_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "settlements"
