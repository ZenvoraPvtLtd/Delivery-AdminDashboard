import logging
from datetime import datetime
from repositories.order_repository import OrderRepository
from repositories.base_repository import BaseRepository
from database import Database

logger = logging.getLogger("delivery_admin.confirmation_service")

class ConfirmationService:
    @classmethod
    async def confirm_order(cls, order_id: str, channel: str, reply_text: str, message_id: str) -> bool:
        """
        Transition order to Confirmed status. Prevent multiple confirmations.
        """
        order = await OrderRepository.get_by_id(order_id)
        if not order:
            logger.warning(f"[Confirmation] Order {order_id} not found.")
            return False

        # Prevent duplicate confirmations/cancellations
        if order.get("confirmation_status") in ["Confirmed", "Cancelled"]:
            logger.warning(f"[Confirmation] Order {order_id} is already in state: {order.get('confirmation_status')}")
            return False

        now_str = datetime.now().isoformat()
        
        # Specific Twilio Spec requirement database properties
        update_data = {
            "confirmation_status": "Confirmed",
            "confirmation_channel": channel,
            "confirmation_message_id": message_id,
            "confirmation_time": now_str,
            "confirmation_response": reply_text,
            "status": "Preparing",
            "updated_at": datetime.now()
        }

        # Save order fields
        await OrderRepository.update(order_id, update_data)

        # Log timeline event
        timeline_event = {
            "status": "Confirmed",
            "timestamp": now_str,
            "title": f"Order Confirmed via {channel.upper()}",
            "description": f"Customer reply: \"{reply_text}\"."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)

        logger.info(f"[Confirmation] Order {order_id} successfully confirmed via {channel}.")

        # Broadcast update to websocket
        from main import sio
        updated_order = await OrderRepository.get_by_id(order_id)
        
        # Stringify ObjectId just in case
        if "_id" in updated_order:
            updated_order["_id"] = str(updated_order["_id"])

        await sio.emit("order_status", {"status": "Preparing", "timeline": updated_order["timeline"]}, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

        # Trigger Rider Delivery Sim
        from services.delivery_service import DeliveryService
        DeliveryService.start_simulation(order_id)

        # Trigger success notification template via services
        try:
            from services.whatsapp_service import TwilioWhatsappService
            from services.sms_service import TwilioSmsService
            
            # Fetch communication settings
            settings_doc = await Database.db.settings.find_one({"is_deleted": False})
            settings = settings_doc if settings_doc else {}

            phone = order.get("customerPhone")
            name = order.get("customerName")
            msg_text = f"Woohoo {name}! Your Order #{order_id.split('-')[-1]} is confirmed and heading to the kitchen. Tracker link will be sent soon."

            if settings.get("enableWhatsapp", True):
                await TwilioWhatsappService.send_whatsapp_message(phone, msg_text, order_id)
            if settings.get("enableSms", True):
                await TwilioSmsService.send_sms(phone, msg_text, order_id)
        except Exception as e:
            logger.error(f"[Confirmation] Failed to send success template: {e}")

        return True

    @classmethod
    async def cancel_order(cls, order_id: str, channel: str, reply_text: str, message_id: str) -> bool:
        """
        Transition order to Cancelled status.
        """
        order = await OrderRepository.get_by_id(order_id)
        if not order:
            logger.warning(f"[Confirmation] Order {order_id} not found.")
            return False

        if order.get("confirmation_status") in ["Confirmed", "Cancelled"]:
            logger.warning(f"[Confirmation] Order {order_id} is already in state: {order.get('confirmation_status')}")
            return False

        now_str = datetime.now().isoformat()
        
        # Specific Twilio Spec requirement database properties
        update_data = {
            "confirmation_status": "Cancelled",
            "confirmation_channel": channel,
            "confirmation_message_id": message_id,
            "confirmation_time": now_str,
            "confirmation_response": reply_text,
            "status": "Cancelled",
            "updated_at": datetime.now()
        }

        # Save updates
        await OrderRepository.update(order_id, update_data)

        # Timeline event log
        timeline_event = {
            "status": "Cancelled",
            "timestamp": now_str,
            "title": f"Order Cancelled via {channel.upper()}",
            "description": f"Customer reply: \"{reply_text}\"."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)

        logger.info(f"[Confirmation] Order {order_id} successfully cancelled via {channel}.")

        # Broadcast update to websocket
        from main import sio
        updated_order = await OrderRepository.get_by_id(order_id)
        
        if "_id" in updated_order:
            updated_order["_id"] = str(updated_order["_id"])

        await sio.emit("order_status", {"status": "Cancelled", "timeline": updated_order["timeline"]}, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

        # Trigger Cancellation Alerts template
        try:
            from services.whatsapp_service import TwilioWhatsappService
            from services.sms_service import TwilioSmsService
            
            # Fetch communication settings
            settings_doc = await Database.db.settings.find_one({"is_deleted": False})
            settings = settings_doc if settings_doc else {}

            phone = order.get("customerPhone")
            name = order.get("customerName")
            msg_text = f"Hello {name}, your Delivo Order #{order_id.split('-')[-1]} has been cancelled successfully as requested. Refund initiated."

            if settings.get("enableWhatsapp", True):
                await TwilioWhatsappService.send_whatsapp_message(phone, msg_text, order_id)
            if settings.get("enableSms", True):
                await TwilioSmsService.send_sms(phone, msg_text, order_id)
        except Exception as e:
            logger.error(f"[Confirmation] Failed to send cancellation template: {e}")

        return True
