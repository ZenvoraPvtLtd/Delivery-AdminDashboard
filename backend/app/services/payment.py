from typing import List, Optional, Tuple, Dict, Any
from app.repositories.payment import PaymentRepository, get_payment_repository
from app.models.payment import Payment, Wallet, WalletTransaction, Refund, Settlement
from app.schemas.payment import PaymentProcessRequest, WalletTransactionRequest, RefundRequest
from fastapi import HTTPException
from datetime import datetime

class PaymentService:
    def __init__(self, repository: PaymentRepository):
        self.repository = repository

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        metrics = await self.repository.get_dashboard_metrics()
        recent_payments = await self.repository.list_payments(0, 10)
        
        recent_list = []
        for p in recent_payments:
            pdict = {
                "id": str(p.id),
                "transaction_id": p.transaction_id,
                "order_id": p.order_id,
                "customer_name": p.customer_name or p.customer_id,
                "payment_gateway": p.payment_gateway,
                "type": "Credit" if p.payment_status in ["Captured", "Settled"] else "Debit",
                "amount": p.final_amount,
                "payment_status": p.payment_status,
                "date": p.created_at.strftime("%Y-%m-%d"),
                "created_at": p.created_at,
                "updated_at": p.updated_at
            }
            recent_list.append(pdict)

        return {
            "gross_collections": metrics["gross_collections"],
            "refund_settlements_amount": metrics["refund_settlements_amount"],
            "refund_cases": metrics["refund_cases"],
            "settlement_status": "Completed",
            "gateway_breakdown": metrics["gateway_breakdown"],
            "recent_transactions": recent_list
        }

    async def process_payment(self, data: PaymentProcessRequest, request_info: dict) -> Payment:
        # Mock payment processing
        payment = Payment(
            order_id=data.order_id,
            customer_id=data.customer_id,
            amount=data.amount,
            final_amount=data.amount,
            payment_method=data.payment_method,
            payment_gateway=data.payment_gateway,
            payment_status="Captured",
            created_by=request_info.get("performed_by", "System")
        )
        return await self.repository.create_payment(payment)

    async def get_wallet(self, customer_id: str) -> Wallet:
        wallet = await self.repository.get_wallet(customer_id)
        if not wallet:
            wallet = Wallet(customer_id=customer_id)
            wallet = await self.repository.create_wallet(wallet)
        return wallet

    async def credit_wallet(self, customer_id: str, data: WalletTransactionRequest, request_info: dict) -> Wallet:
        wallet = await self.get_wallet(customer_id)
        wallet.wallet_balance += data.amount
        wallet.lifetime_credits += data.amount
        wallet.last_transaction = datetime.utcnow()
        await self.repository.update_wallet(wallet)
        
        tx = WalletTransaction(
            wallet_id=str(wallet.id),
            customer_id=customer_id,
            transaction_type="Credit",
            amount=data.amount,
            reason=data.reason,
            created_by=request_info.get("performed_by", "System")
        )
        await self.repository.create_wallet_transaction(tx)
        return wallet

    async def debit_wallet(self, customer_id: str, data: WalletTransactionRequest, request_info: dict) -> Wallet:
        wallet = await self.get_wallet(customer_id)
        if wallet.wallet_balance < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
            
        wallet.wallet_balance -= data.amount
        wallet.lifetime_debits += data.amount
        wallet.last_transaction = datetime.utcnow()
        await self.repository.update_wallet(wallet)
        
        tx = WalletTransaction(
            wallet_id=str(wallet.id),
            customer_id=customer_id,
            transaction_type="Debit",
            amount=data.amount,
            reason=data.reason,
            created_by=request_info.get("performed_by", "System")
        )
        await self.repository.create_wallet_transaction(tx)
        return wallet

    async def process_refund(self, data: RefundRequest, request_info: dict) -> Refund:
        payment = await self.repository.get_payment(data.payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        refund = Refund(
            order_id=payment.order_id,
            payment_id=payment.payment_id,
            customer_id=payment.customer_id,
            refund_amount=data.amount,
            refund_method="Original Payment Source",
            refund_reason=data.reason,
            refund_status="Approved",
            processed_by=request_info.get("performed_by", "System"),
            processed_at=datetime.utcnow()
        )
        await self.repository.create_refund(refund)
        
        payment.refund_status = "Refunded"
        payment.refund_amount += data.amount
        await payment.save()
        
        return refund

def get_payment_service() -> PaymentService:
    return PaymentService(get_payment_repository())
