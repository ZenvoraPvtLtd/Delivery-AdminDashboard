from typing import List, Optional, Tuple, Dict, Any
from app.models.payment import Payment, Wallet, WalletTransaction, Refund, Settlement
from beanie.operators import RegEx

class PaymentRepository:
    
    async def create_payment(self, payment: Payment) -> Payment:
        return await payment.insert()

    async def get_payment(self, payment_id: str) -> Optional[Payment]:
        return await Payment.find_one({"payment_id": payment_id})

    async def list_payments(self, skip: int = 0, limit: int = 50) -> List[Payment]:
        return await Payment.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        
    async def get_wallet(self, customer_id: str) -> Optional[Wallet]:
        return await Wallet.find_one({"customer_id": customer_id})
        
    async def create_wallet(self, wallet: Wallet) -> Wallet:
        return await wallet.insert()

    async def update_wallet(self, wallet: Wallet) -> Wallet:
        return await wallet.save()

    async def create_wallet_transaction(self, tx: WalletTransaction) -> WalletTransaction:
        return await tx.insert()

    async def create_refund(self, refund: Refund) -> Refund:
        return await refund.insert()

    async def create_settlement(self, settlement: Settlement) -> Settlement:
        return await settlement.insert()

    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        # Aggregate Payments for gateway breakdowns
        payments = await Payment.find_all().to_list()
        
        gross = 0
        upi_collections = 0
        card_collections = 0
        wallet_collections = 0
        cod_collections = 0
        
        for p in payments:
            if p.payment_status in ["Captured", "Settled"]:
                gross += p.final_amount
                if p.payment_gateway == "UPI":
                    upi_collections += p.final_amount
                elif p.payment_gateway in ["Credit Card", "Debit Card", "Stripe"]:
                    card_collections += p.final_amount
                elif p.payment_gateway == "Wallet":
                    wallet_collections += p.final_amount
                elif p.payment_gateway == "Cash On Delivery":
                    cod_collections += p.final_amount

        # Refunds
        refunds = await Refund.find_all().to_list()
        refund_amount = sum(r.refund_amount for r in refunds)
        refund_cases = len(refunds)

        gateway_breakdown = [
            {"name": "UPI Collections", "value": upi_collections, "color": "#047857"},
            {"name": "Credit Cards", "value": card_collections, "color": "#0D9488"},
            {"name": "Store Wallet", "value": wallet_collections, "color": "#10B981"},
            {"name": "Cash On Delivery", "value": cod_collections, "color": "#F59E0B"}
        ]
        
        return {
            "gross_collections": gross,
            "refund_settlements_amount": refund_amount,
            "refund_cases": refund_cases,
            "gateway_breakdown": gateway_breakdown
        }

def get_payment_repository() -> PaymentRepository:
    return PaymentRepository()
