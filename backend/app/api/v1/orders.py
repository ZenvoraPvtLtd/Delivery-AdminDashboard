from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.order import Order
from app.models.delivery_partner import DeliveryPartner
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str
    updatedBy: Optional[str] = "Admin"

class RiderAssignment(BaseModel):
    orderId: str
    riderId: str
    updatedBy: Optional[str] = "Admin"

class RefundRequest(BaseModel):
    orderId: str
    reason: str
    updatedBy: Optional[str] = "Admin"

@router.get("", summary="Get All Orders")
async def get_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    outlet_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    query = {}
    if status and status != "All":
        query["status"] = status
    if payment_status and payment_status != "All":
        query["payment_status"] = payment_status
    if outlet_id and outlet_id != "all":
        query["outlet_id"] = outlet_id

    orders = await Order.find(query).sort("-created_at").to_list()
    
    # Simple search filter in python if search param provided
    if search:
        s = search.lower()
        orders = [
            o for o in orders 
            if s in o.order_id.lower() or s in o.customer_name.lower() or s in o.customer_phone
        ]

    # Map to frontend expected format
    res = []
    for o in orders:
        res.append({
            "id": o.order_id,
            "customerId": o.customer_id,
            "customerName": o.customer_name,
            "customerPhone": o.customer_phone,
            "outletId": o.outlet_id,
            "outletName": o.outlet_name,
            "items": o.items,
            "subtotal": o.subtotal,
            "tax": o.tax,
            "deliveryCharge": o.delivery_charge,
            "packagingCharge": o.packaging_charge,
            "discount": o.discount,
            "total": o.total,
            "status": o.status,
            "paymentStatus": o.payment_status,
            "paymentMethod": o.payment_method,
            "createdAt": o.created_at.isoformat() if isinstance(o.created_at, datetime) else str(o.created_at),
            "address": o.address,
            "deliveryPartnerId": o.delivery_partner_id,
            "timeline": o.timeline,
            "orderType": o.order_type,
            "confirmation_status": o.confirmation_status,
            "customer_reply": o.customer_reply
        })
    return res

@router.get("/{order_id}", summary="Get Order Details")
async def get_order(order_id: str, current_user: User = Depends(get_current_user)) -> Any:
    order = await Order.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", summary="Update Order Status")
async def update_status(order_id: str, data: OrderStatusUpdate, current_user: User = Depends(get_current_user)) -> Any:
    order = await Order.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = data.status
    if data.status == "Delivered":
        order.payment_status = "Paid"
    elif data.status == "Cancelled":
        order.payment_status = "Refunded"
        
    order.timeline.append({
        "status": data.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "title": f"Status Updated to {data.status}",
        "description": f"Status changed by {data.updatedBy}."
    })
    order.updated_at = datetime.now(timezone.utc)
    await order.save()
    return {"message": "Order status updated successfully"}

@router.post("/assign-rider", summary="Assign Rider to Order")
async def assign_rider(data: RiderAssignment, current_user: User = Depends(get_current_user)) -> Any:
    order = await Order.find_one({"order_id": data.orderId})
    rider = await DeliveryPartner.find_one({"partner_id": data.riderId})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.delivery_partner_id = data.riderId
    order.status = "Out for Delivery"
    order.timeline.append({
        "status": "Out for Delivery",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "title": "Assigned to Rider",
        "description": f"Assigned to {rider.full_name if rider else data.riderId} by {data.updatedBy}."
    })
    await order.save()

    if rider:
        rider.status = "On Delivery"
        rider.current_active_order = data.orderId
        await rider.save()

    return {"message": "Rider assigned successfully"}

@router.post("/refund", summary="Refund Order")
async def refund_order(data: RefundRequest, current_user: User = Depends(get_current_user)) -> Any:
    order = await Order.find_one({"order_id": data.orderId})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.payment_status = "Refunded"
    order.status = "Cancelled"
    order.timeline.append({
        "status": "Cancelled",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "title": "Refund Approved",
        "description": f"Refund processed by {data.updatedBy}. Reason: {data.reason}."
    })
    await order.save()
    return {"message": "Order refunded successfully"}
