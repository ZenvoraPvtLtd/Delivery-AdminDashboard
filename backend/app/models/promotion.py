from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
import uuid

class Coupon(Document):
    coupon_id: str = Field(default_factory=lambda: f"CPN-{uuid.uuid4().hex[:8].upper()}")
    code: str
    discount_type: str = "Percentage" # Percentage, Flat
    value: float
    min_order_value: float = 0.0
    max_discount: Optional[float] = None
    expiry_date: str
    usage_count: int = 0
    usage_limit: int = 100
    target_type: str = "All" # All, Outlet-wise, Customer-wise
    status: str = "Active" # Active, Paused, Expired
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "coupons"
        indexes = ["code", "status"]

class Offer(Document):
    offer_id: str = Field(default_factory=lambda: f"OFF-{uuid.uuid4().hex[:8].upper()}")
    name: str
    details: str
    schedule: str
    status: str = "Active" # Active, Paused
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "offers"
        indexes = ["status"]

class CustomerReward(Document):
    customer_id: str
    reward_points: int = 0
    lifetime_points: int = 0
    tier: str = "Silver" # Silver, Gold, Platinum
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "customer_rewards"
        indexes = ["customer_id", "tier"]

class ReferralProgram(Document):
    customer_id: str
    referral_code: str
    referrals_count: int = 0
    total_earnings: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "referral_programs"
        indexes = ["referral_code", "customer_id"]

class GiftVoucher(Document):
    voucher_code: str = Field(default_factory=lambda: f"GV-{uuid.uuid4().hex[:10].upper()}")
    value: float
    status: str = "Active" # Active, Redeemed, Expired
    expiry_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "gift_vouchers"
        indexes = ["voucher_code", "status"]
