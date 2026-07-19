from fastapi import APIRouter, Depends, Query, Request
from typing import Any
from app.services.product import ProductService, get_product_service
from app.schemas.product import (
    ProductCreate, ProductResponse, PaginatedProductResponse,
    ToggleAvailabilityRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.post("/", response_model=ProductResponse, summary="Create Product")
async def create_product(
    data: ProductCreate,
    request: Request,
    service: ProductService = Depends(get_product_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    product = await service.create_product(data, get_request_info(request, current_user))
    res = product.model_dump()
    res["id"] = str(product.id)
    return res

@router.get("/", response_model=PaginatedProductResponse, summary="List Products")
async def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = None,
    category: str = None,
    veg_filter: str = None,
    menu_schedule: str = None,
    sort: str = "-created_at",
    service: ProductService = Depends(get_product_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * size
    products, total = await service.list_products(skip, size, search, category, veg_filter, menu_schedule, sort)
    
    data = []
    for p in products:
        pdict = p.model_dump()
        pdict["id"] = str(p.id)
        pdict["preparationTime"] = p.preparation_time
        pdict["isVeg"] = p.is_veg
        pdict["isBestSeller"] = p.best_seller
        pdict["outletIds"] = p.outlet_ids
        pdict["gstRate"] = p.gst
        # Use first image for response
        pdict["image"] = p.images[0] if p.images else None
        data.append(pdict)
        
    return PaginatedProductResponse(
        success=True,
        message="Products retrieved successfully",
        data=data,
        total=total,
        page=page,
        size=size
    )

@router.put("/{product_id}", response_model=ProductResponse, summary="Update Product")
async def update_product(
    product_id: str,
    data: ProductCreate,
    request: Request,
    service: ProductService = Depends(get_product_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    product = await service.update_product(product_id, data, get_request_info(request, current_user))
    res = product.model_dump()
    res["id"] = str(product.id)
    return res

@router.put("/{product_id}/availability", response_model=ProductResponse, summary="Toggle Availability")
async def toggle_availability(
    product_id: str,
    data: ToggleAvailabilityRequest,
    request: Request,
    service: ProductService = Depends(get_product_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    product = await service.toggle_availability(product_id, data.availability, get_request_info(request, current_user))
    res = product.model_dump()
    res["id"] = str(product.id)
    return res

@router.delete("/{product_id}", summary="Delete Product")
async def delete_product(
    product_id: str,
    request: Request,
    service: ProductService = Depends(get_product_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    await service.delete_product(product_id, get_request_info(request, current_user))
    return {"success": True, "message": "Product deleted successfully"}
