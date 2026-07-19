from fastapi import APIRouter, Depends, Query, Request
from typing import Any
from app.services.payment import PaymentService, get_payment_service
from app.schemas.payment import (
    PaymentProcessRequest, WalletTransactionRequest, RefundRequest,
    DashboardSummaryResponse, WalletBalanceResponse, PaymentResponse
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get Payments Summary")
async def get_summary(
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_dashboard_summary()

@router.post("/process", summary="Process Payment")
async def process_payment(
    data: PaymentProcessRequest,
    request: Request,
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    payment = await service.process_payment(data, get_request_info(request, current_user))
    res = payment.model_dump()
    res["id"] = str(payment.id)
    return res

@router.post("/refund", summary="Initiate Refund")
async def initiate_refund(
    data: RefundRequest,
    request: Request,
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    refund = await service.process_refund(data, get_request_info(request, current_user))
    return {"success": True, "message": "Refund processed successfully", "refund_id": refund.refund_id}

@router.get("/wallet/{customer_id}", response_model=WalletBalanceResponse, summary="Get Wallet Balance")
async def get_wallet(
    customer_id: str,
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    wallet = await service.get_wallet(customer_id)
    return {
        "customer_id": wallet.customer_id,
        "wallet_balance": wallet.wallet_balance,
        "lifetime_credits": wallet.lifetime_credits,
        "lifetime_debits": wallet.lifetime_debits
    }

@router.post("/wallet/{customer_id}/credit", summary="Credit Wallet")
async def credit_wallet(
    customer_id: str,
    data: WalletTransactionRequest,
    request: Request,
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    wallet = await service.credit_wallet(customer_id, data, get_request_info(request, current_user))
    return {"success": True, "wallet_balance": wallet.wallet_balance}

@router.post("/wallet/{customer_id}/debit", summary="Debit Wallet")
async def debit_wallet(
    customer_id: str,
    data: WalletTransactionRequest,
    request: Request,
    service: PaymentService = Depends(get_payment_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    wallet = await service.debit_wallet(customer_id, data, get_request_info(request, current_user))
    return {"success": True, "wallet_balance": wallet.wallet_balance}
