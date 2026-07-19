from typing import List, Optional
from app.models.promotion import Coupon, Offer, CustomerReward, ReferralProgram, GiftVoucher

class PromotionRepository:
    
    # Coupons
    async def get_coupons(self) -> List[Coupon]:
        return await Coupon.find_all().to_list()
        
    async def get_coupon(self, coupon_id: str) -> Optional[Coupon]:
        return await Coupon.find_one({"coupon_id": coupon_id})
        
    async def create_coupon(self, coupon: Coupon) -> Coupon:
        return await coupon.insert()

    async def update_coupon(self, coupon: Coupon) -> Coupon:
        return await coupon.save()
        
    # Offers
    async def get_offers(self) -> List[Offer]:
        return await Offer.find_all().to_list()

    async def get_offer(self, offer_id: str) -> Optional[Offer]:
        return await Offer.find_one({"offer_id": offer_id})
        
    async def create_offer(self, offer: Offer) -> Offer:
        return await offer.insert()
        
    async def update_offer(self, offer: Offer) -> Offer:
        return await offer.save()
        
def get_promotion_repository() -> PromotionRepository:
    return PromotionRepository()
