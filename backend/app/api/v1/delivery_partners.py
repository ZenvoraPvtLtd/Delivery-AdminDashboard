from fastapi import APIRouter, Depends, Query, Request
from typing import Any, List
from app.services.delivery_partner import DeliveryPartnerService, get_delivery_partner_service
from app.schemas.delivery_partner import (
    DeliveryPartnerCreate, DeliveryPartnerResponse, PaginatedPartnerResponse,
    DutyStatusUpdate, LicenseVerifyUpdate, VehicleResponse, DeliveryPartnerDetailResponse
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.post("/", response_model=DeliveryPartnerResponse, summary="Create Partner")
async def create_partner(
    data: DeliveryPartnerCreate,
    request: Request,
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    partner = await service.create_partner(data, get_request_info(request, current_user))
    res = partner.model_dump()
    res["id"] = str(partner.id)
    return res

@router.get("/", response_model=PaginatedPartnerResponse, summary="List Partners")
async def list_partners(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = None,
    status: str = None,
    sort: str = "-created_at",
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * size
    partners, total = await service.list_partners(skip, size, search, status, sort)
    
    data = []
    for p in partners:
        pdict = p.model_dump()
        pdict["id"] = str(p.id)
        data.append(pdict)
        
    return PaginatedPartnerResponse(
        success=True,
        message="Partners retrieved successfully",
        data=data,
        total=total,
        page=page,
        size=size
    )

@router.get("/summary", summary="Get Summary Stats")
async def get_summary(
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_summary()
    return {"success": True, "data": data}

@router.get("/{partner_id}", response_model=DeliveryPartnerDetailResponse, summary="Get Partner Detail")
async def get_partner(
    partner_id: str,
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    partner = await service.get_partner(partner_id)
    res = partner.model_dump()
    res["id"] = str(partner.id)
    return res

@router.get("/{partner_id}/vehicle", response_model=VehicleResponse, summary="Get Partner Vehicle")
async def get_vehicle(
    partner_id: str,
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    vehicle = await service.get_vehicle(partner_id)
    if not vehicle:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vehicle not found")
    res = vehicle.model_dump()
    res["id"] = str(vehicle.id)
    return res

@router.put("/{partner_id}/duty", response_model=DeliveryPartnerResponse, summary="Update Duty Status")
async def update_duty_status(
    partner_id: str,
    data: DutyStatusUpdate,
    request: Request,
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    partner = await service.update_duty_status(partner_id, data, get_request_info(request, current_user))
    res = partner.model_dump()
    res["id"] = str(partner.id)
    return res

@router.put("/{partner_id}/verify-license", response_model=DeliveryPartnerResponse, summary="Verify License")
async def verify_license(
    partner_id: str,
    data: LicenseVerifyUpdate,
    request: Request,
    service: DeliveryPartnerService = Depends(get_delivery_partner_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    partner = await service.verify_license(partner_id, data, get_request_info(request, current_user))
    res = partner.model_dump()
    res["id"] = str(partner.id)
    return res
