from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.outlet import Outlet
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

class OutletCreateRequest(BaseModel):
    name: str
    address: str
    manager: str
    phone: str
    status: str = "Open"
    hours: str = "08:00 AM - 11:00 PM"
    tax_number: str = "GST-33AABCC1234D"

@router.get("", summary="Get Outlets List")
async def get_outlets(current_user: User = Depends(get_current_user)) -> Any:
    outlets = await Outlet.find_all().to_list()
    res = []
    for o in outlets:
        res.append({
            "id": o.outlet_id,
            "name": o.name,
            "address": o.address,
            "manager": o.manager,
            "phone": o.phone,
            "status": o.status,
            "revenue": o.revenue,
            "ordersCount": o.orders_count,
            "taxNumber": o.tax_number,
            "hours": o.hours
        })
    return res

@router.post("", summary="Create New Outlet")
async def create_outlet(data: OutletCreateRequest, current_user: User = Depends(get_current_user)) -> Any:
    new_outlet = Outlet(
        name=data.name,
        address=data.address,
        manager=data.manager,
        phone=data.phone,
        status=data.status,
        hours=data.hours,
        tax_number=data.tax_number
    )
    await new_outlet.insert()
    return {
        "id": new_outlet.outlet_id,
        "name": new_outlet.name,
        "address": new_outlet.address,
        "manager": new_outlet.manager,
        "phone": new_outlet.phone,
        "status": new_outlet.status,
        "revenue": new_outlet.revenue,
        "ordersCount": new_outlet.orders_count,
        "taxNumber": new_outlet.tax_number,
        "hours": new_outlet.hours
    }

@router.put("/{outlet_id}", summary="Update Outlet")
async def update_outlet(outlet_id: str, data: OutletCreateRequest, current_user: User = Depends(get_current_user)) -> Any:
    outlet = await Outlet.find_one({"outlet_id": outlet_id})
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")
        
    outlet.name = data.name
    outlet.address = data.address
    outlet.manager = data.manager
    outlet.phone = data.phone
    outlet.status = data.status
    outlet.hours = data.hours
    outlet.tax_number = data.tax_number
    outlet.updated_at = datetime.now(timezone.utc)
    await outlet.save()
    
    return {
        "id": outlet.outlet_id,
        "name": outlet.name,
        "address": outlet.address,
        "manager": outlet.manager,
        "phone": outlet.phone,
        "status": outlet.status,
        "revenue": outlet.revenue,
        "ordersCount": outlet.orders_count,
        "taxNumber": outlet.tax_number,
        "hours": outlet.hours
    }
