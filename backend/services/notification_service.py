import logging
import asyncio
import time
import random
from datetime import datetime, timedelta
from repositories.order_repository import OrderRepository
from repositories.notification_repository import NotificationRepository
from repositories.base_repository import BaseRepository
from database import Database

logger = logging.getLogger("delivery_admin.notification_service")

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

# Messaging Engine Simulator
async def send_provider_message(channel: str, provider: str, customer_phone: str, attempt: int) -> dict:
    logger.info(f"[Notification Engine] Dispatching via {channel.upper()} ({provider}) to {customer_phone} (Retry: {attempt})")
    is_failure = False
    reason = "Simulated delivery success"

    if channel == "whatsapp":
        if customer_phone.endswith("9") or customer_phone.endswith("8"):
            is_failure = True
            reason = "Provider error code 500: Gateway Timeout"
    elif channel == "sms":
        if customer_phone.endswith("8"):
            is_failure = True
            reason = "Carrier error code 30008: Destination unreachable"

    await asyncio.sleep(0.8)
    timestamp = datetime.now().isoformat()

    if is_failure:
        logger.warning(f"[Notification Engine] Message delivery failed on {channel}: {reason}")
        return {
            "success": False,
            "status": "failed",
            "sent_at": timestamp,
            "provider_response": reason
        }
    logger.info(f"[Notification Engine] Message delivered on {channel} successfully.")
    return {
        "success": True,
        "status": "delivered",
        "sent_at": timestamp,
        "delivered_at": timestamp,
        "provider_response": "OK: Message Queued & Delivered"
    }

class NotificationService:
    @classmethod
    async def create_log(cls, order_id: str, customer_id: str, msg_type: str, provider: str, status: str, response: str = "") -> dict:
        log_id = f"notif-{int(datetime.now().timestamp())}-{order_id.split('-')[-1]}"
        log_entry = {
            "id": log_id,
            "order_id": order_id,
            "customer_id": customer_id,
            "type": msg_type,
            "provider": provider,
            "status": status,
            "retry_count": 0,
            "sent_at": datetime.now().isoformat(),
            "delivered_at": datetime.now().isoformat() if status in ["delivered", "read"] else None,
            "provider_response": response,
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await NotificationRepository.create(log_entry)
        return log_entry

    @classmethod
    async def trigger_cancellation_flow(cls, order: dict, settings: dict) -> bool:
        phone = order.get("customerPhone")
        name = order.get("customerName")
        order_id = order.get("id")
        customer_id = order.get("customerId", "")

        from services.whatsapp_service import WhatsappService
        from services.sms_service import SmsService

        # 1. WhatsApp Cancellation
        if settings.get("enableWhatsapp", True):
            whatsapp_provider = settings.get("whatsappProvider", "meta")
            success = await WhatsappService.send_order_cancelled(phone, name, order_id)
            await cls.create_log(order_id, customer_id, "cancellation", whatsapp_provider, "delivered" if success else "failed")

        # 2. SMS Cancellation
        if settings.get("enableSms", True):
            sms_provider = settings.get("smsProvider", "twilio")
            success = await SmsService.send_order_cancelled(phone, name, order_id)
            await cls.create_log(order_id, customer_id, "cancellation", sms_provider, "delivered" if success else "failed")

        return True

    @classmethod
    async def queue_notification(cls, order_id: str, type: str, custom_data: dict = None):
        if custom_data is None:
            custom_data = {}
        
        order = await OrderRepository.get_by_id(order_id)
        if not order:
            logger.error(f"[Notification Queue] Order not found: {order_id}")
            return

        settings_doc = await Database.db.settings.find_one({"is_deleted": False})
        settings = settings_doc if settings_doc else {}
        if not settings:
            # Fallback to default
            settings = {
                "enableWhatsapp": True,
                "enableSms": True,
                "whatsappProvider": "meta",
                "smsProvider": "twilio",
                "retryCount": 3,
                "templates": {
                    "confirmation": "Hello {{CustomerName}}, please confirm your Delivo Order #{{OrderID}} of {{Items}} totaling ${{Amount}}. Reply YES to Confirm or NO to Cancel.",
                    "cancellation": "Hello {{CustomerName}}, your Delivo Order #{{OrderID}} has been cancelled successfully.",
                    "success": "Woohoo {{CustomerName}}! Your Order #{{OrderID}} is confirmed.",
                    "reminder": "Urgent {{CustomerName}}: Your Order #{{OrderID}} is awaiting confirmation."
                }
            }

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
        provider = settings.get("whatsappProvider", "meta") if current_channel == "whatsapp" else settings.get("smsProvider", "twilio")
        status = "failed"
        response_data = None
        attempt = 0
        max_retries = settings.get("retryCount", 3)

        from main import sio

        if current_channel == "whatsapp":
            while attempt <= max_retries:
                notif_id = f"notif-{int(time.time() * 1000)}-{random.randint(0, 999)}"
                new_notif = {
                    "id": notif_id,
                    "order_id": order_id,
                    "provider": provider,
                    "type": type,
                    "status": "sent",
                    "message": message_text,
                    "sent_at": datetime.now().isoformat(),
                    "delivered_at": None,
                    "read_at": None,
                    "reply_at": None,
                    "retry_count": attempt,
                    "provider_response": "Sending...",
                    "is_deleted": False,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await NotificationRepository.create(new_notif)
                await sio.emit("new_notification", new_notif)

                response_data = await send_provider_message("whatsapp", provider, customer_phone, attempt)

                # Update notification
                update_fields = {
                    "status": response_data["status"],
                    "delivered_at": response_data.get("delivered_at"),
                    "provider_response": response_data["provider_response"],
                    "updated_at": datetime.now()
                }
                if response_data["success"]:
                    update_fields["read_at"] = (datetime.now() + timedelta(seconds=1.5)).isoformat()
                
                await NotificationRepository.update(notif_id, update_fields)
                
                # Emit updated notification
                updated_notif = await NotificationRepository.get_by_id(notif_id)
                await sio.emit("new_notification", updated_notif)

                # Log conversation
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
                await Database.db.conversations.insert_one(out_message)
                await sio.emit("new_chat", out_message)

                # Timeline update
                timeline_event = {
                    "status": "WhatsApp Sent",
                    "timestamp": datetime.now().isoformat(),
                    "title": f"WhatsApp Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                    "description": "Message delivered successfully to customer's WhatsApp." if response_data["success"] else f"Delivery failed: {response_data['provider_response']}"
                }
                await OrderRepository.add_timeline_event(order_id, timeline_event)
                
                updated_order = await OrderRepository.get_by_id(order_id)
                await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
                await sio.emit("order_confirmation_updated", updated_order)

                if response_data["success"]:
                    status = "delivered"
                    break
                attempt += 1

            if status == "failed" and settings.get("enableSms", True):
                logger.warning("[Notification Engine] WhatsApp failed. Cascading fallback to SMS...")
                current_channel = "sms"
                provider = settings.get("smsProvider", "twilio")
                attempt = 0

        if current_channel == "sms":
            while attempt <= max_retries:
                notif_id = f"notif-{int(time.time() * 1000)}-{random.randint(0, 999)}"
                sms_text = f"Your Order #{order_id.split('-')[1] if '-' in order_id else order_id} is waiting for confirmation. Reply YES to Confirm, Reply NO to Cancel."
                new_notif = {
                    "id": notif_id,
                    "order_id": order_id,
                    "provider": provider,
                    "type": type,
                    "status": "sent",
                    "message": sms_text,
                    "sent_at": datetime.now().isoformat(),
                    "delivered_at": None,
                    "read_at": None,
                    "reply_at": None,
                    "retry_count": attempt,
                    "provider_response": "Sending...",
                    "is_deleted": False,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await NotificationRepository.create(new_notif)
                await sio.emit("new_notification", new_notif)

                response_data = await send_provider_message("sms", provider, customer_phone, attempt)

                update_fields = {
                    "status": response_data["status"],
                    "delivered_at": response_data.get("delivered_at"),
                    "provider_response": response_data["provider_response"],
                    "updated_at": datetime.now()
                }
                await NotificationRepository.update(notif_id, update_fields)
                
                updated_notif = await NotificationRepository.get_by_id(notif_id)
                await sio.emit("new_notification", updated_notif)

                # Log conversation
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
                await Database.db.conversations.insert_one(out_message)
                await sio.emit("new_chat", out_message)

                # Timeline
                timeline_event = {
                    "status": "SMS Sent",
                    "timestamp": datetime.now().isoformat(),
                    "title": f"SMS Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                    "description": "SMS delivered successfully to customer's mobile number." if response_data["success"] else f"SMS Delivery failed: {response_data['provider_response']}"
                }
                await OrderRepository.add_timeline_event(order_id, timeline_event)
                
                updated_order = await OrderRepository.get_by_id(order_id)
                await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
                await sio.emit("order_confirmation_updated", updated_order)

                if response_data["success"]:
                    status = "delivered"
                    break
                attempt += 1

        if status == "failed":
            logger.critical(f"[Notification Engine] Critical: WhatsApp and SMS both failed for Order #{order_id}")
            alert_notif = {
                "id": f"alert-{int(time.time() * 1000)}",
                "title": "Confirmation Delivery Failure",
                "description": f"Unable to reach {customer_name} ({customer_phone}) for Order #{order_id.split('-')[1] if '-' in order_id else order_id}. All channels failed.",
                "type": "system",
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "is_deleted": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await NotificationRepository.get_collection().database.notifications.insert_one(alert_notif)
            
            timeline_event = {
                "status": "Delivery Failed",
                "timestamp": datetime.now().isoformat(),
                "title": "Communication Channels Blocked",
                "description": "Both WhatsApp and SMS carriers rejected delivery attempts. Admin intervention required."
            }
            await OrderRepository.add_timeline_event(order_id, timeline_event)
            
            updated_order = await OrderRepository.get_by_id(order_id)
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
        settings_doc = await Database.db.settings.find_one({"is_deleted": False})
        settings = settings_doc if settings_doc else {}
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
            reminder_count = await Database.db.notifications.count_documents({
                "order_id": order["id"],
                "type": "reminder",
                "status": {"$ne": "failed"},
                "is_deleted": False
            })

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
                await Database.db.notifications.insert_one(alert_notif)

                await sio.emit("new_notification", alert_notif)
                updated_order = await OrderRepository.get_by_id(order["id"])
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
