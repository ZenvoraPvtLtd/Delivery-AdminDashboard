import os
import logging
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Form, Header
from fastapi.responses import PlainTextResponse
from twilio.request_validator import RequestValidator
from repositories.order_repository import OrderRepository
from repositories.base_repository import BaseRepository
from services.confirmation_service import ConfirmationService
from database import Database

logger = logging.getLogger("delivery_admin.twilio_webhook")
router = APIRouter(prefix="/webhooks/twilio", tags=["Twilio Webhooks"])

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    # Strip whatsapp: prefix if present, then get digits
    p = phone.replace("whatsapp:", "").strip()
    digits = "".join(c for c in p if c.isdigit())
    # Return last 10 digits
    return digits[-10:]

async def save_conversation(chat: dict):
    if Database.is_mock:
        from repositories.base_repository import load_local_db, save_local_db
        db = load_local_db()
        db.setdefault("conversations", []).append(chat)
        save_local_db(db)
    else:
        await Database.db.conversations.insert_one(chat)

@router.post("", response_class=PlainTextResponse)
async def twilio_incoming_callback(
    request: Request,
    message_sid: str = Form(..., alias="MessageSid"),
    from_number: str = Form(..., alias="From"),
    body: str = Form(..., alias="Body"),
    to_number: str = Form(..., alias="To"),
    x_twilio_signature: str = Header(None, alias="X-Twilio-Signature")
):
    """
    Unified Twilio Webhook receiving incoming SMS and WhatsApp customer replies.
    """
    logger.info(f"[Twilio Webhook] Received webhook event: From={from_number}, Body=\"{body}\"")

    # 1. Twilio Request Signature Security Validation
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "mock-token")
    if auth_token != "mock-token" and x_twilio_signature:
        validator = RequestValidator(auth_token)
        form_params = dict(await request.form())
        url = str(request.url)
        if not validator.validate(url, form_params, x_twilio_signature):
            logger.error(f"[Twilio Webhook] Security signature verification failed for X-Twilio-Signature: {x_twilio_signature}")
            raise HTTPException(status_code=403, detail="Invalid signature validation")
        logger.info("[Twilio Webhook] Signature verified successfully.")

    # Determine channel
    channel = "whatsapp" if "whatsapp" in from_number.lower() else "sms"
    norm_phone = normalize_phone(from_number)
    clean_body = body.strip().upper()

    # Find active order awaiting confirmation matching this customer phone
    pending_orders = await OrderRepository.get_all({"confirmation_status": "Pending"})
    matching_order = None
    
    for order in pending_orders:
        if normalize_phone(order.get("customerPhone")) == norm_phone:
            matching_order = order
            break

    if not matching_order:
        logger.warning(f"[Twilio Webhook] No pending order found for phone: {from_number} (Normalized: {norm_phone})")
        conv_id = f"conv-{int(datetime.now().timestamp())}"
        unmatched_chat = {
            "id": conv_id,
            "order_id": "unknown",
            "customer_number": from_number,
            "message": body,
            "direction": "incoming",
            "provider": "twilio",
            "timestamp": datetime.now().isoformat(),
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await save_conversation(unmatched_chat)
        
        from main import sio
        await sio.emit("new_chat", unmatched_chat)
        return "<Response></Response>"

    order_id = matching_order["id"]

    # Log chat conversation log
    conv_id = f"conv-{int(datetime.now().timestamp())}"
    chat_msg = {
        "id": conv_id,
        "order_id": order_id,
        "customer_number": matching_order["customerPhone"],
        "message": body,
        "direction": "incoming",
        "provider": channel,
        "timestamp": datetime.now().isoformat(),
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    await save_conversation(chat_msg)

    # Save customer reply body to order document
    await OrderRepository.update(order_id, {
        "customer_reply": body,
        "confirmation_response": body,
        "updated_at": datetime.now()
    })

    # Broadcast conversation via socket
    from main import sio
    await sio.emit("new_chat", chat_msg)

    # Parse reply and transition status
    is_yes = any(k in clean_body for k in ["YES", "Y", "OK", "CONFIRM", "CONFI"])
    is_no = any(k in clean_body for k in ["NO", "N", "CANCEL", "REJECT"])

    if is_yes:
        logger.info(f"[Twilio Webhook] Confirmed reply YES matched for order: {order_id}")
        await ConfirmationService.confirm_order(order_id, channel, body, message_sid)
    elif is_no:
        logger.info(f"[Twilio Webhook] Cancelled reply NO matched for order: {order_id}")
        await ConfirmationService.cancel_order(order_id, channel, body, message_sid)
    else:
        logger.warning(f"[Twilio Webhook] Unrecognized reply body for order {order_id}: \"{body}\"")
        timeline_event = {
            "status": "Awaiting Clarification",
            "timestamp": datetime.now().isoformat(),
            "title": "Unrecognized Message Received",
            "description": f"Customer replied: \"{body}\". Expected YES or NO."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)
        
        updated_order = await OrderRepository.get_by_id(order_id)
        if "_id" in updated_order:
            updated_order["_id"] = str(updated_order["_id"])
        await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

    return "<Response></Response>"
