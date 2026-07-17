import os
import logging
import httpx
from datetime import datetime
from repositories.notification_repository import NotificationRepository

logger = logging.getLogger("delivery_admin.whatsapp")

class WhatsappService:
    @classmethod
    def get_credentials(cls):
        return {
            "token": os.getenv("WHATSAPP_ACCESS_TOKEN", "mock-access-token"),
            "phone_id": os.getenv("WHATSAPP_PHONE_NUMBER_ID", "mock-phone-id"),
            "verify_token": os.getenv("WHATSAPP_VERIFY_TOKEN", "mock-verify-token")
        }

    @classmethod
    async def send_text_message(cls, to_phone: str, message_text: str, order_id: str) -> bool:
        creds = cls.get_credentials()
        logger.info(f"[WhatsApp] Outbox message to {to_phone}: {message_text}")

        # Log log-entry to db
        wa_log = {
            "id": f"wa-log-{int(datetime.now().timestamp())}",
            "order_id": order_id,
            "phone": to_phone,
            "text": message_text,
            "status": "delivered",
            "sent_at": datetime.now()
        }
        await NotificationRepository.log_whatsapp(wa_log)

        # Mock API request if no real credentials
        if creds["token"] == "mock-access-token" or creds["phone_id"] == "mock-phone-id":
            logger.info("[WhatsApp] Running in Sandbox Mock Mode (no Meta tokens found).")
            return True

        url = f"https://graph.facebook.com/v18.0/{creds['phone_id']}/messages"
        headers = {
            "Authorization": f"Bearer {creds['token']}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"body": message_text}
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                if response.status_code in [200, 201]:
                    logger.info(f"[WhatsApp] HTTP request sent successfully: {response.json()}")
                    return True
                else:
                    logger.error(f"[WhatsApp] HTTP error {response.status_code}: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"[WhatsApp] Failed to invoke API: {e}")
            return False

    @classmethod
    async def send_template_message(cls, to_phone: str, template_name: str, components: list, order_id: str) -> bool:
        creds = cls.get_credentials()
        logger.info(f"[WhatsApp] Outbox template '{template_name}' to {to_phone}")
        
        # Log to db
        wa_log = {
            "id": f"wa-log-{int(datetime.now().timestamp())}",
            "order_id": order_id,
            "phone": to_phone,
            "text": f"Template: {template_name}",
            "status": "delivered",
            "sent_at": datetime.now()
        }
        await NotificationRepository.log_whatsapp(wa_log)

        if creds["token"] == "mock-access-token":
            return True

        url = f"https://graph.facebook.com/v18.0/{creds['phone_id']}/messages"
        headers = {
            "Authorization": f"Bearer {creds['token']}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en_US"},
                "components": components
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"[WhatsApp] Template send failed: {e}")
            return False

    @classmethod
    async def send_order_confirmation(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> bool:
        msg = f"Hello {customer_name}, please confirm your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} totaling ₹{amount:.2f}. Reply YES to Confirm or NO to Cancel."
        return await cls.send_text_message(to_phone, msg, order_id)

    @classmethod
    async def send_order_cancelled(cls, to_phone: str, customer_name: str, order_id: str) -> bool:
        msg = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} has been cancelled successfully. Refund initiated."
        return await cls.send_text_message(to_phone, msg, order_id)

    @classmethod
    async def send_delivery_update(cls, to_phone: str, customer_name: str, order_id: str, status: str) -> bool:
        msg = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} is now: {status}."
        return await cls.send_text_message(to_phone, msg, order_id)
