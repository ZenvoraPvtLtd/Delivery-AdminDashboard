from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PaymentResponse(BaseModel):
    id: str
    txId: str = Field(alias="transaction_id")
    orderId: str = Field(alias="order_id")
    customer: str = Field(alias="customer_name")
    gateway: str = Field(alias="payment_gateway")
    type: str = "Credit"
    amount: float
    status: str = Field(alias="payment_status")
    date: str
    created_at: datetime
    updated_at: datetime
    
class PaymentProcessRequest(BaseModel):
    order_id: str
    customer_id: str
    amount: float
    payment_method: str
    payment_gateway: str

class WalletBalanceResponse(BaseModel):
    customer_id: str
    wallet_balance: float
    lifetime_credits: float
    lifetime_debits: float

class WalletTransactionRequest(BaseModel):
    amount: float
    reason: str

class RefundRequest(BaseModel):
    payment_id: str
    amount: float
    reason: str

class DashboardSummaryResponse(BaseModel):
    gross_collections: float
    refund_settlements_amount: float
    refund_cases: int
    settlement_status: str
    gateway_breakdown: List[Dict[str, Any]]
    recent_transactions: List[PaymentResponse]
