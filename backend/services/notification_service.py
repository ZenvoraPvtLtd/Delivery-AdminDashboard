import logging
import asyncio
import time
import random
from datetime import datetime, timedelta
from repositories.order_repository import OrderRepository
from repositories.notification_repository import NotificationRepository
from repositories.base_repository import BaseRepository
from database import Database
from services.whatsapp_service import TwilioWhatsappService
from services.sms_service import TwilioSmsService

logger = logging.getLogger("delivery_admin.notification_service")

# Helper functions to abstract database access and support local JSON fallback
async def get_db_settings() -> dict:
    if Database.is_mock:
        from repositories.base_repository import load_local_db
        db_data = load_local_db()
        return db_data.get("communicationSettings", {})
    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    return settings_doc if settings_doc else {}

async def insert_conversation(msg: dict):
    if Database.is_mock:
        from repositories.base_repository import load_local_db, save_local_db
        db_data = load_local_db()
        db_data.setdefault("conversations", []).append(msg)
        save_local_db(db_data)
    else:
        await Database.db.conversations.insert_one(msg)

async def insert_notification(notif: dict):
    if Database.is_mock:
        from repositories.base_repository import load_local_db, save_local_db
        db_data = load_local_db()
        db_data.setdefault("notifications", []).append(notif)
        save_local_db(db_data)
    else:
        await Database.db.notifications.insert_one(notif)

async def count_reminders(order_id: str) -> int:
    if Database.is_mock:
        from repositories.base_repository import load_local_db
        db_data = load_local_db()
        return len([
            n for n in db_data.get("notifications", [])
            if n.get("order_id") == order_id and n.get("type") == "reminder" and n.get("status") != "failed"
        ])
    return await Database.db.notifications.count_documents({
        "order_id": order_id,
        "type": "reminder",
        "status": {"$ne": "failed"},
        "is_deleted": False
    })

# Helper to compile templates
def compile_template(template: str, vars: dict) -> str:
    compiled = template
    mapping = {
        "CustomerName": vars.get("customerName", "Customer"),
        "OrderID": vars.get("orderId", ""),
        "Items": vars.get("items", ""),
        "Amount": vars.get("amount", "0.00"),
        "Address": vars.get("address", ""),
        "CompanyName": vars.get("companyName", "Delivo Cafe"),
        "SupportNumber": vars.get("supportNumber", "+1 555-0100")
    }
    for key, val in mapping.items():
        compiled = compiled.replace(f"{{{{{key}}}}}", str(val))
        compiled = compiled.replace(f"{{{{ {key} }}}}", str(val))
    return compiled

class NotificationService:
    @classmethod
    async def create_twilio_log(cls, order_id: str, customer_id: str, msg_type: str, provider: str, status: str, text: str, sid: str, response: str, channel: str) -> dict:
        """
        Record a notification log following the exact Twilio Notification spec fields.
        """
        log_id = f"notif-{int(datetime.now().timestamp())}-{order_id.split('-')[-1]}"
        log_entry = {
            "notification_id": log_id,
            "id": log_id, # for compatibility with frontend mapping
            "customer_id": customer_id,
            "order_id": order_id,
            "type": msg_type,
            "sms": text if channel == "sms" else "",
            "whatsapp": text if channel == "whatsapp" else "",
            "provider": provider,
            "provider_message_sid": sid,
            "status": status,
            "response": response,
            "retry_count": 0,
            "sent_at": datetime.now().isoformat(),
            "delivered_at": datetime.now().isoformat() if status == "delivered" else None,
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        # Save to database (base repo redirects to local JSON or MongoDB automatically)
        await NotificationRepository.create(log_entry)
        return log_entry

    @classmethod
    async def trigger_cancellation_flow(cls, order: dict, settings: dict) -> bool:
        phone = order.get("customerPhone")
        name = order.get("customerName")
        order_id = order.get("id")
        customer_id = order.get("customerId", "")

        # 1. WhatsApp Cancellation
        if settings.get("enableWhatsapp", True):
            res = await TwilioWhatsappService.send_order_cancelled(phone, name, order_id)
            await cls.create_twilio_log(order_id, customer_id, "cancellation", "twilio", res["status"], f"Order #{order_id.split('-')[-1]} cancelled", res["sid"], res["response"], "whatsapp")

        # 2. SMS Cancellation
        if settings.get("enableSms", True):
            res = await TwilioSmsService.send_order_cancelled(phone, name, order_id)
            await cls.create_twilio_log(order_id, customer_id, "cancellation", "twilio", res["status"], f"Order #{order_id.split('-')[-1]} cancelled", res["sid"], res["response"], "sms")

        return True

    @classmethod
    async def trigger_delivery_update_flow(cls, order: dict, settings: dict, status: str) -> bool:
        phone = order.get("customerPhone")
        name = order.get("customerName")
        order_id = order.get("id")
        customer_id = order.get("customerId", "")

        # 1. WhatsApp status update
        if settings.get("enableWhatsapp", True):
            res = await TwilioWhatsappService.send_delivery_update(phone, name, order_id, status)
            await cls.create_twilio_log(order_id, customer_id, "delivery_update", "twilio", res["status"], f"Status: {status}", res["sid"], res["response"], "whatsapp")

        # 2. SMS status update
        if settings.get("enableSms", True):
            res = await TwilioSmsService.send_delivery_update(phone, name, order_id, status)
            await cls.create_twilio_log(order_id, customer_id, "delivery_update", "twilio", res["status"], f"Status: {status}", res["sid"], res["response"], "sms")

        return True

    @classmethod
    async def queue_notification(cls, order_id: str, type: str, custom_data: dict = None):
        """
        Sends notifications (WhatsApp, fallback to SMS) and records status into database.
        """
        if custom_data is None:
            custom_data = {}
        
        order = await OrderRepository.get_by_id(order_id)
        if not order:
            logger.error(f"[Notification Queue] Order not found: {order_id}")
            return

        settings = await get_db_settings()

        customer_phone = order["customerPhone"]
        customer_name = order["customerName"]
        customer_id = order.get("customerId", "")

        items_string = ", ".join([f"{it['quantity']}x {it['name']}" for it in order["items"]])
        template_vars = {
            "customerName": customer_name,
            "orderId": order["id"].split("-")[1] if "-" in order["id"] else order["id"],
            "items": items_string,
            "amount": f"{order['total']:.2f}",
            "address": order["address"],
            **custom_data
        }

        templates = settings.get("templates", {})
        template_text = templates.get(type, "")
        message_text = compile_template(template_text, template_vars)

        current_channel = "whatsapp" if settings.get("enableWhatsapp", True) else "sms"
        status = "failed"
        attempt = 0
        max_retries = settings.get("retryCount", 3)

        from main import sio

        if current_channel == "whatsapp":
            while attempt <= max_retries:
                # 1. WhatsApp confirmation dispatch
                res = await TwilioWhatsappService.send_order_confirmation(customer_phone, customer_name, order_id, order["total"])
                
                # Create/save logs
                new_notif = await cls.create_twilio_log(
                    order_id, customer_id, type, "twilio", res["status"], 
                    message_text, res["sid"], res["response"], "whatsapp"
                )
                await sio.emit("new_notification", new_notif)

                # Log conversation record
                conv_id = f"conv-{int(time.time() * 1000)}-{random.randint(0, 999)}"
                out_message = {
                    "id": conv_id,
                    "order_id": order_id,
                    "customer_number": customer_phone,
                    "message": message_text,
                    "direction": "outgoing",
                    "provider": "whatsapp",
                    "timestamp": datetime.now().isoformat(),
                    "is_deleted": False,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await insert_conversation(out_message)
                await sio.emit("new_chat", out_message)

                # Timeline update
                timeline_event = {
                    "status": "WhatsApp Sent",
                    "timestamp": datetime.now().isoformat(),
                    "title": f"WhatsApp Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                    "description": "WhatsApp confirmation message dispatched successfully." if res["success"] else f"WhatsApp dispatch failed: {res['response']}"
                }
                await OrderRepository.add_timeline_event(order_id, timeline_event)
                
                # Specific twilio schema parameters addition to Order
                await OrderRepository.update(order_id, {
                    "whatsapp_status": res["status"],
                    "notification_status": res["status"],
                    "confirmation_message_id": res["sid"]
                })
                
                updated_order = await OrderRepository.get_by_id(order_id)
                if "_id" in updated_order:
                    updated_order["_id"] = str(updated_order["_id"])

                await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
                await sio.emit("order_confirmation_updated", updated_order)

                if res["success"]:
                    status = "delivered"
                    break
                attempt += 1

            if status == "failed" and settings.get("enableSms", True):
                logger.warning("[Notification Engine] WhatsApp failed. Cascading fallback to SMS...")
                current_channel = "sms"
                attempt = 0

        if current_channel == "sms":
            sms_text = f"Your Order #{order_id.split('-')[-1]} Amount ₹{order['total']:.2f} Reply YES to Confirm Reply NO to Cancel"
            while attempt <= max_retries:
                # 2. SMS confirmation dispatch
                res = await TwilioSmsService.send_order_confirmation(customer_phone, customer_name, order_id, order["total"])
                
                new_notif = await cls.create_twilio_log(
                    order_id, customer_id, type, "twilio", res["status"], 
                    sms_text, res["sid"], res["response"], "sms"
                )
                await sio.emit("new_notification", new_notif)

                # Log conversation record
                conv_id = f"conv-{int(time.time() * 1000)}-{random.randint(0, 999)}"
                out_message = {
                    "id": conv_id,
                    "order_id": order_id,
                    "customer_number": customer_phone,
                    "message": sms_text,
                    "direction": "outgoing",
                    "provider": "sms",
                    "timestamp": datetime.now().isoformat(),
                    "is_deleted": False,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await insert_conversation(out_message)
                await sio.emit("new_chat", out_message)

                # Timeline
                timeline_event = {
                    "status": "SMS Sent",
                    "timestamp": datetime.now().isoformat(),
                    "title": f"SMS Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                    "description": "SMS confirmation message dispatched successfully to customer's mobile." if res["success"] else f"SMS dispatch failed: {res['response']}"
                }
                await OrderRepository.add_timeline_event(order_id, timeline_event)
                
                # Specific twilio schema parameters addition to Order
                await OrderRepository.update(order_id, {
                    "sms_status": res["status"],
                    "notification_status": res["status"],
                    "confirmation_message_id": res["sid"]
                })
                
                updated_order = await OrderRepository.get_by_id(order_id)
                if "_id" in updated_order:
                    updated_order["_id"] = str(updated_order["_id"])

                await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
                await sio.emit("order_confirmation_updated", updated_order)

                if res["success"]:
                    status = "delivered"
                    break
                attempt += 1

        if status == "failed":
            logger.critical(f"[Notification Engine] Twilio fallback warning: WhatsApp and SMS both failed for Order #{order_id}")
            alert_notif = {
                "id": f"alert-{int(time.time() * 1000)}",
                "title": "Confirmation Delivery Failure",
                "description": f"Unable to reach {customer_name} ({customer_phone}) for Order #{order_id.split('-')[-1]}. Twilio dispatch failed.",
                "type": "system",
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "is_deleted": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await insert_notification(alert_notif)
            
            timeline_event = {
                "status": "Delivery Failed",
                "timestamp": datetime.now().isoformat(),
                "title": "Communication Channels Blocked",
                "description": "Twilio WhatsApp and SMS carriers rejected delivery attempts. Admin intervention required."
            }
            await OrderRepository.add_timeline_event(order_id, timeline_event)
            
            updated_order = await OrderRepository.get_by_id(order_id)
            if "_id" in updated_order:
                updated_order["_id"] = str(updated_order["_id"])

            await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
            await sio.emit("order_confirmation_updated", updated_order)
            await sio.emit("new_notification", alert_notif)

    @classmethod
    async def run_schedule_check(cls):
        """
        Check all pending confirmations, send reminder notifications, or expire old entries.
        """
        orders = await OrderRepository.get_pending_confirmations()
        if not orders:
            return

        now = datetime.now()
        settings = await get_db_settings()
        expiry_hours = settings.get("confirmationExpiry", 24)

        from main import sio

        for order in orders:
            req_at_str = order.get("confirmation_requested_at")
            if not req_at_str:
                continue

            try:
                requested_at = datetime.fromisoformat(req_at_str)
            except ValueError:
                continue

            elapsed_hours = (now - requested_at).total_seconds() / 3600.0

            # Count reminders
            reminder_count = await count_reminders(order["id"])

            # Check Expiry
            if elapsed_hours >= expiry_hours:
                logger.info(f"[Scheduler] Order {order['id']} expired after {elapsed_hours:.2f} hours")
                
                await OrderRepository.update(order["id"], {
                    "confirmation_status": "Expired",
                    "status": "Cancelled",
                    "cancelled_at": now.isoformat(),
                    "updated_at": datetime.now()
                })

                event = {
                    "status": "Confirmation Expired",
                    "timestamp": now.isoformat(),
                    "title": "Confirmation Expired",
                    "description": f"Customer failed to confirm order within {expiry_hours} hours."
                }
                await OrderRepository.add_timeline_event(order["id"], event)

                alert_notif = {
                    "id": f"alert-{int(time.time() * 1000)}",
                    "title": "Order Confirmation Expired",
                    "description": f"Order #{order['id'].split('-')[1]} confirmation expired after {expiry_hours} hours. Status changed to Cancelled.",
                    "type": "system",
                    "timestamp": now.isoformat(),
                    "read": False,
                    "is_deleted": False,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await insert_notification(alert_notif)

                await sio.emit("new_notification", alert_notif)
                updated_order = await OrderRepository.get_by_id(order["id"])
                if "_id" in updated_order:
                    updated_order["_id"] = str(updated_order["_id"])
                await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order["id"])
                await sio.emit("order_confirmation_updated", updated_order)
                continue

            # Check Reminder 2 (at 6 hours)
            if elapsed_hours >= 6 and reminder_count < 2:
                logger.info(f"[Scheduler] Dispatching Reminder 2 for Order {order['id']}")
                asyncio.create_task(cls.queue_notification(order["id"], "reminder", {"messageLabel": "Second Reminder"}))

            # Check Reminder 1 (at 2 hours)
            elif elapsed_hours >= 2 and reminder_count < 1:
                logger.info(f"[Scheduler] Dispatching Reminder 1 for Order {order['id']}")
                asyncio.create_task(cls.queue_notification(order["id"], "reminder", {"messageLabel": "First Reminder"}))
