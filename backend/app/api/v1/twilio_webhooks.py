from fastapi import APIRouter, Depends, Request
from typing import Any
from app.services.twilio_webhook import TwilioWebhookService, get_twilio_service
from app.schemas.communication_logs import WebhookRequest
from app.core.limiter import limiter

router = APIRouter()

@router.post("/whatsapp")
@limiter.limit("60/minute")
async def receive_whatsapp_webhook(
    request: Request,
    req: WebhookRequest,
    service: TwilioWebhookService = Depends(get_twilio_service)
) -> Any:
    # In production, Twilio POSTs form data, but for our simulator we accept JSON
    await service.process_webhook(req.From, req.Body, "whatsapp")
    return {"status": "ok"}

@router.post("/sms")
@limiter.limit("60/minute")
async def receive_sms_webhook(
    request: Request,
    req: WebhookRequest,
    service: TwilioWebhookService = Depends(get_twilio_service)
) -> Any:
    await service.process_webhook(req.From, req.Body, "sms")
    return {"status": "ok"}
