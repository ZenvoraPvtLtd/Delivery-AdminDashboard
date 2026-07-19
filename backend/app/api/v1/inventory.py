from fastapi import APIRouter, Depends, Query, Request
from typing import Any, List
from app.services.inventory import InventoryService, get_inventory_service
from app.schemas.inventory import (
    PaginatedInventoryResponse, StockAdjustRequest, PurchaseOrderCreate, PurchaseOrderResponse,
    OrderDeductionRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.get("/", response_model=PaginatedInventoryResponse, summary="List Inventory")
async def list_inventory(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = None,
    category: str = None,
    service: InventoryService = Depends(get_inventory_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * size
    items, total = await service.list_items(skip, size, search, category)
    
    data = []
    for i in items:
        idict = i.model_dump()
        idict["id"] = str(i.id)
        idict["current_stock"] = i.current_stock
        idict["min_stock_alert"] = i.min_stock_alert
        idict["expiry_date"] = i.expiry_date
        data.append(idict)
        
    return PaginatedInventoryResponse(
        success=True,
        message="Inventory retrieved successfully",
        data=data,
        total=total,
        page=page,
        size=size
    )

@router.post("/{item_id}/adjust", summary="Adjust Stock")
async def adjust_stock(
    item_id: str,
    data: StockAdjustRequest,
    request: Request,
    service: InventoryService = Depends(get_inventory_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    item = await service.adjust_stock(item_id, data, get_request_info(request, current_user))
    return {"success": True, "message": "Stock adjusted successfully", "current_stock": item.current_stock}

@router.post("/purchase-orders", response_model=PurchaseOrderResponse, summary="Issue Purchase Order")
async def issue_purchase_order(
    data: PurchaseOrderCreate,
    request: Request,
    service: InventoryService = Depends(get_inventory_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    po = await service.issue_purchase_order(data, get_request_info(request, current_user))
    res = po.model_dump()
    res["id"] = str(po.id)
    return res

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse], summary="List Purchase Orders")
async def list_purchase_orders(
    service: InventoryService = Depends(get_inventory_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    pos = await service.list_purchase_orders()
    data = []
    for po in pos:
        pdict = po.model_dump()
        pdict["id"] = str(po.id)
        data.append(pdict)
    return data

@router.post("/deduct-for-order", summary="Deduct Stock For Order")
async def deduct_for_order(
    data: OrderDeductionRequest,
    request: Request,
    service: InventoryService = Depends(get_inventory_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Internal use: deducts inventory items based on a confirmed order."""
    return await service.deduct_for_order(data, get_request_info(request, current_user))
