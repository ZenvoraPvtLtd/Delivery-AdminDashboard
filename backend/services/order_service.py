import logging
from datetime import datetime
from repositories.order_repository import OrderRepository
from repositories.customer_repository import CustomerRepository
from repositories.delivery_repository import DeliveryPartnerRepository
from services.notification_service import NotificationService

logger = logging.getLogger("delivery_admin.order_service")

class OrderService:
    @classmethod
    async def place_order(cls, order_data: dict, comm_settings: dict) -> dict:
        """
        Validate, create order, trigger notifications, and return the saved object.
        """
        order_id = order_data.get("id") or f"order-{int(datetime.now().timestamp())}"
        order_data["id"] = order_id
        order_data["status"] = "Pending"
        order_data["timeline"] = [
            {
                "status": "Pending",
                "timestamp": datetime.now().isoformat(),
                "title": "Order Placed",
                "description": "Order successfully placed by customer."
            }
        ]
        order_data["confirmation_status"] = "Pending"
        order_data["is_deleted"] = False
        order_data["created_at"] = datetime.now()
        order_data["updated_at"] = datetime.now()

        # Save to DB
        saved_order = await OrderRepository.create(order_data)
        logger.info(f"Order #{order_id} created in database.")

        # Trigger Outbox workflow
        try:
            await NotificationService.trigger_confirmation_flow(saved_order, comm_settings)
        except Exception as err:
            logger.error(f"Failed to execute notification workflow for order {order_id}: {err}")

        return saved_order

    @classmethod
    async def confirm_order(cls, order_id: str, source: str, reply_text: str, comm_settings: dict) -> bool:
        """
        Confirm an order via WhatsApp/SMS reply or Admin override.
        """
        order = await OrderRepository.get_by_id(order_id)
        if not order or order.get("confirmation_status") != "Pending":
            return False

        now_str = datetime.now().isoformat()
        update_fields = {
            "confirmation_status": "Confirmed",
            "confirmed_at": now_str,
            "confirmation_source": source,
            "status": "Preparing",
            "updated_at": datetime.now()
        }

        # Save updates
        await OrderRepository.update(order_id, update_fields)
        
        # Append timeline event
        timeline_event = {
            "status": "Confirmed",
            "timestamp": now_str,
            "title": f"Confirmed via {source.capitalize()}",
            "description": f"User replied: \"{reply_text}\"." if reply_text else "Administrative confirmation override."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)

        # Trigger real-time sockets
        from main import sio
        updated_order = await OrderRepository.get_by_id(order_id)
        await sio.emit("order_status", {"status": "Preparing", "timeline": updated_order["timeline"]}, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

        # Start rider delivery simulation
        from services.delivery_service import DeliveryService
        DeliveryService.start_simulation(order_id)

        # Trigger Confirmation Success Template
        try:
            phone = order.get("customerPhone")
            name = order.get("customerName")
            from services.whatsapp_service import WhatsappService
            from services.sms_service import SmsService
            
            if comm_settings.get("enableWhatsapp", True):
                await WhatsappService.send_text_message(
                    phone,
                    f"Woohoo {name}! Your Order #{order_id.split('-')[-1]} is confirmed and heading to the kitchen.",
                    order_id
                )
            if comm_settings.get("enableSms", True):
                await SmsService.send_sms(
                    phone,
                    f"Woohoo {name}! Your Order #{order_id.split('-')[-1]} is confirmed and heading to the kitchen.",
                    order_id
                )
        except Exception as e:
            logger.error(f"Failed to send confirmation success alerts: {e}")

        return True

    @classmethod
    async def cancel_order(cls, order_id: str, source: str, reply_text: str, comm_settings: dict) -> bool:
        """
        Cancel an order due to negative customer reply, admin override, or timeout expiration.
        """
        order = await OrderRepository.get_by_id(order_id)
        if not order or order.get("confirmation_status") != "Pending":
            return False

        now_str = datetime.now().isoformat()
        update_fields = {
            "confirmation_status": "Cancelled",
            "status": "Cancelled",
            "updated_at": datetime.now()
        }

        # Save updates
        await OrderRepository.update(order_id, update_fields)

        # Append timeline event
        timeline_event = {
            "status": "Cancelled",
            "timestamp": now_str,
            "title": f"Cancelled via {source.capitalize()}",
            "description": f"Reason: {reply_text}" if reply_text else "Order confirmation expired or cancelled by admin."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)

        # Trigger real-time sockets
        from main import sio
        updated_order = await OrderRepository.get_by_id(order_id)
        await sio.emit("order_status", {"status": "Cancelled", "timeline": updated_order["timeline"]}, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

        # Trigger Cancellation Template
        try:
            await NotificationService.trigger_cancellation_flow(order, comm_settings)
        except Exception as e:
            logger.error(f"Failed to trigger cancellation notification outbox: {e}")

        return True
