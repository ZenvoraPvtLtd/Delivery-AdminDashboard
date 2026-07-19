from typing import List, Optional
from app.repositories.promotion import PromotionRepository, get_promotion_repository
from app.models.promotion import Coupon, Offer
from app.schemas.promotion import CouponResponse, CouponCreateRequest, OfferResponse
from fastapi import HTTPException
import asyncio

class PromotionService:
    def __init__(self, repository: PromotionRepository):
        self.repository = repository

    async def get_coupons(self) -> List[CouponResponse]:
        coupons = await self.repository.get_coupons()
        
        return [
            CouponResponse(
                id=c.coupon_id,
                code=c.code,
                discountType=c.discount_type,
                value=c.value,
                minOrderValue=c.min_order_value,
                maxDiscount=c.max_discount,
                expiryDate=c.expiry_date,
                usageCount=c.usage_count,
                usageLimit=c.usage_limit,
                targetType=c.target_type,
                status=c.status
            ) for c in coupons
        ]
        
    async def create_coupon(self, req: CouponCreateRequest, request_info: dict) -> CouponResponse:
        c = Coupon(
            code=req.code,
            discount_type=req.discountType,
            value=req.value,
            min_order_value=req.minOrderValue,
            max_discount=req.maxDiscount,
            expiry_date=req.expiryDate,
            usage_limit=req.usageLimit,
            target_type=req.targetType,
            status=req.status
        )
        c = await self.repository.create_coupon(c)
        
        return CouponResponse(
            id=c.coupon_id,
            code=c.code,
            discountType=c.discount_type,
            value=c.value,
            minOrderValue=c.min_order_value,
            maxDiscount=c.max_discount,
            expiryDate=c.expiry_date,
            usageCount=c.usage_count,
            usageLimit=c.usage_limit,
            targetType=c.target_type,
            status=c.status
        )
        
    async def toggle_coupon_status(self, coupon_id: str, request_info: dict) -> CouponResponse:
        c = await self.repository.get_coupon(coupon_id)
        if not c:
            raise HTTPException(status_code=404, detail="Coupon not found")
            
        c.status = "Paused" if c.status == "Active" else "Active"
        c = await self.repository.update_coupon(c)
        
        return CouponResponse(
            id=c.coupon_id,
            code=c.code,
            discountType=c.discount_type,
            value=c.value,
            minOrderValue=c.min_order_value,
            maxDiscount=c.max_discount,
            expiryDate=c.expiry_date,
            usageCount=c.usage_count,
            usageLimit=c.usage_limit,
            targetType=c.target_type,
            status=c.status
        )

    async def get_offers(self) -> List[OfferResponse]:
        offers = await self.repository.get_offers()
        if not offers:
            # Seed dummy offers if none exist
            o1 = Offer(name="Happy Hour Beverage BOGO", details="Buy 1 Get 1 Free on all beverages", schedule="Daily 4:00 PM - 7:00 PM")
            o2 = Offer(name="Weekend Family Combo Pack", details="Flat $8.00 off on ordering 3+ combo products", schedule="Friday to Sunday")
            o3 = Offer(name="Monsoon Special Flash Sale", details="Flat 15% discount on fast foods categories", schedule="July 1 - July 31", status="Paused")
            await self.repository.create_offer(o1)
            await self.repository.create_offer(o2)
            await self.repository.create_offer(o3)
            offers = [o1, o2, o3]
            
        return [
            OfferResponse(
                id=o.offer_id,
                name=o.name,
                details=o.details,
                schedule=o.schedule,
                status=o.status
            ) for o in offers
        ]
        
    async def toggle_offer_status(self, offer_id: str, request_info: dict) -> OfferResponse:
        o = await self.repository.get_offer(offer_id)
        if not o:
            raise HTTPException(status_code=404, detail="Offer not found")
            
        o.status = "Paused" if o.status == "Active" else "Active"
        o = await self.repository.update_offer(o)
        
        return OfferResponse(
            id=o.offer_id,
            name=o.name,
            details=o.details,
            schedule=o.schedule,
            status=o.status
        )

def get_promotion_service() -> PromotionService:
    return PromotionService(get_promotion_repository())
