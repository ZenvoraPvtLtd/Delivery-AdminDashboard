from fastapi import APIRouter, Depends, Request
from typing import Any, List
from app.services.promotion import PromotionService, get_promotion_service
from app.schemas.promotion import (
    CouponResponse, CouponCreateRequest, OfferResponse
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.get("/coupons", response_model=List[CouponResponse], summary="List Coupons")
async def list_coupons(
    service: PromotionService = Depends(get_promotion_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_coupons()

@router.post("/coupons", response_model=CouponResponse, summary="Create Coupon")
async def create_coupon(
    data: CouponCreateRequest,
    request: Request,
    service: PromotionService = Depends(get_promotion_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.create_coupon(data, get_request_info(request, current_user))

@router.put("/coupons/{coupon_id}/status", response_model=CouponResponse, summary="Toggle Coupon Status")
async def toggle_coupon_status(
    coupon_id: str,
    request: Request,
    service: PromotionService = Depends(get_promotion_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_coupon_status(coupon_id, get_request_info(request, current_user))

@router.get("/offers", response_model=List[OfferResponse], summary="List Offers")
async def list_offers(
    service: PromotionService = Depends(get_promotion_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_offers()

@router.put("/offers/{offer_id}/status", response_model=OfferResponse, summary="Toggle Offer Status")
async def toggle_offer_status(
    offer_id: str,
    request: Request,
    service: PromotionService = Depends(get_promotion_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_offer_status(offer_id, get_request_info(request, current_user))
