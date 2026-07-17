import logging
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from services.order_service import OrderService
from repositories.order_repository import OrderRepository
from repositories.base_repository import BaseRepository
import json

logger = logging.getLogger("delivery_admin.webhook_whatsapp")
router = APIRouter(prefix="/api/webhook/whatsapp", tags=["Webhooks"])

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    # strip whitespace, dashes, plus sign, and leading 1 (if US number)
    p = "".join(c for c in phone if c.isdigit())
    if len(p) == 11 and p.startswith("1"):
        p = p[1:]
    return p

@router.get("")
async def verify_webhook(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """
    Handle Meta WhatsApp Webhook Verification handshake.
    """
    verify_token = "whsec_ZenvoraSecretToken2026"
    if mode == "subscribe" and token == verify_token:
        logger.info("[WhatsApp Webhook] Handshake verified successfully.")
        return PlainTextResponse(content=challenge)
    logger.warning("[WhatsApp Webhook] Handshake verification failed.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("")
async def incoming_webhook(request: Request):
    """
    Receive customer WhatsApp reply events, parses YES/NO replies, and triggers order confirmations.
    """
    payload = await request.json()
    logger.info(f"[WhatsApp Webhook] Incoming message event: {json.dumps(payload)}")

    # Extract message fields
    sender_phone = None
    message_text = ""

    try:
        if "entry" in payload:
            entry = payload["entry"][0]
            if "changes" in entry:
                change = entry["changes"][0]
                value = change["value"]
                if "messages" in value:
                    msg = value["messages"][0]
                    sender_phone = msg.get("from")
                    if msg.get("type") == "text":
                        message_text = msg["text"].get("body", "")
                    elif msg.get("type") == "button":
                        message_text = msg["button"].get("text", "")
                    elif msg.get("type") == "interactive":
                        inter = msg["interactive"]
                        if inter.get("type") == "button_reply":
                            message_text = inter["button_reply"].get("title", "")
    except Exception as e:
        logger.error(f"[WhatsApp Webhook] Error parsing Meta cloud API payload: {e}")

    # Fallback to local simulator payload support (Direct From/Body payload)
    if not sender_phone:
        sender_phone = payload.get("From")
        message_text = payload.get("Body", "")

    if not sender_phone or not message_text:
        return JSONResponse({"status": "ignored", "reason": "No sender or message content found."})

    norm_sender = normalize_phone(sender_phone)
    logger.info(f"[WhatsApp Webhook] Processing message from: {norm_sender} -> \"{message_text}\"")

    # Fetch active settings
    settings_docs = await BaseRepository.get_collection().database.settings.find_one({"is_deleted": False})
    comm_settings = settings_docs or {}

    # Match order by normalized customerPhone
    db_orders = await OrderRepository.get_all({"confirmation_status": "Pending"})
    matching_order = None
    for order in db_orders:
        if normalize_phone(order.get("customerPhone")) == norm_sender:
            matching_order = order
            break

    if not matching_order:
        logger.warning(f"[WhatsApp Webhook] No pending confirmation order found for phone: {norm_sender}")
        return JSONResponse({"status": "not_matched"})

    order_id = matching_order["id"]
    clean_text = message_text.strip().upper()

    # Log incoming chat record
    from datetime import datetime
    chat_msg = {
        "id": f"chat-{int(datetime.now().timestamp())}",
        "order_id": order_id,
        "direction": "incoming",
        "message": message_text,
        "provider": "whatsapp",
        "timestamp": datetime.now().isoformat(),
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    await BaseRepository.get_collection().database.conversations.insert_one(chat_msg)

    # Broadcast message to Socket.IO chat rooms
    from main import sio
    await sio.emit("new_chat", chat_msg)

    # Process keyword checks
    if any(k in clean_text for k in ["YES", "CONFIRM", "OK"]):
        success = await OrderService.confirm_order(order_id, "whatsapp", message_text, comm_settings)
        return JSONResponse({"status": "confirmed", "order_id": order_id, "success": success})
    elif any(k in clean_text for k in ["NO", "CANCEL", "REJECT"]):
        success = await OrderService.cancel_order(order_id, "whatsapp", message_text, comm_settings)
        return JSONResponse({"status": "cancelled", "order_id": order_id, "success": success})

    return JSONResponse({"status": "unread", "reason": "No YES/NO confirmation keyword matched."})
