from fastapi import APIRouter, Depends
from typing import Any, List
from app.services.twilio_webhook import TwilioWebhookService, get_twilio_service
from app.schemas.communication_logs import (
    DashboardAnalyticsResponse, ConversationLogResponse, 
    OrderActionRequest, ResendRequest, TimeLeapRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/analytics/order-confirmation", response_model=DashboardAnalyticsResponse)
async def get_analytics(
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_analytics()

@router.post("/orders/confirm")
async def force_confirm(
    req: OrderActionRequest,
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    await service.force_confirm(req.orderId)
    return {"status": "ok"}

@router.post("/orders/cancel")
async def force_cancel(
    req: OrderActionRequest,
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    await service.force_cancel(req.orderId, req.reason or "Admin Cancelled")
    return {"status": "ok"}

@router.post("/orders/resend")
async def resend_confirmation(
    req: ResendRequest,
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    await service.resend_confirmation(req.orderId, req.channel)
    return {"status": "ok"}

@router.post("/orders/simulate-time-leap")
async def simulate_time_leap(
    req: TimeLeapRequest,
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    await service.simulate_time_leap(req.orderId, req.hours)
    return {"status": "ok"}

@router.get("/orders/conversations/{order_id}", response_model=List[ConversationLogResponse])
async def get_conversations(
    order_id: str,
    service: TwilioWebhookService = Depends(get_twilio_service),
    # current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_conversations(order_id)
