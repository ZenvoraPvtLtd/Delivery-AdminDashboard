import os
import asyncio
import logging
from datetime import datetime
from twilio.rest import Client
from repositories.notification_repository import NotificationRepository

logger = logging.getLogger("delivery_admin.twilio_whatsapp")

def _send_twilio_whatsapp_sync(account_sid: str, auth_token: str, from_number: str, to_number: str, text: str) -> str:
    """
    Synchronous execution wrapper for Twilio SDK client. Run in executor.
    """
    client = Client(account_sid, auth_token)
    # Ensure WhatsApp numbers are prefix-formatted
    formatted_to = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
    formatted_from = f"whatsapp:{from_number}" if not from_number.startswith("whatsapp:") else from_number

    message = client.messages.create(
        body=text,
        from_=formatted_from,
        to=formatted_to
    )
    return message.sid

class TwilioWhatsappService:
    @classmethod
    def get_credentials(cls):
        return {
            "sid": os.getenv("TWILIO_ACCOUNT_SID", "mock-sid"),
            "token": os.getenv("TWILIO_AUTH_TOKEN", "mock-token"),
            "phone": os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")
        }

    @classmethod
    async def send_whatsapp_message(cls, to_phone: str, body: str, order_id: str) -> dict:
        """
        Asynchronously send a WhatsApp message using Twilio API.
        """
        creds = cls.get_credentials()
        logger.info(f"[Twilio WhatsApp] Queuing outbound message to {to_phone}: {body}")

        # Check Sandbox Mock Fallback
        if creds["sid"] == "mock-sid" or creds["token"] == "mock-token":
            mock_sid = f"WH{int(datetime.now().timestamp())}mock{os.urandom(8).hex()}"
            logger.info(f"[Twilio WhatsApp] MOCK MODE enabled. Message SID: {mock_sid}")
            
            # Log to DB
            wa_log = {
                "id": f"wa-log-{int(datetime.now().timestamp())}",
                "order_id": order_id,
                "phone": to_phone,
                "text": body,
                "status": "delivered",
                "sent_at": datetime.now()
            }
            await NotificationRepository.log_whatsapp(wa_log)
            
            return {"success": True, "sid": mock_sid, "status": "delivered", "response": "Mock Delivery"}

        try:
            # Delegate blocking SDK invocation to asyncio thread pool executor
            sid = await asyncio.to_thread(
                _send_twilio_whatsapp_sync,
                creds["sid"],
                creds["token"],
                creds["phone"],
                to_phone,
                body
            )
            
            logger.info(f"[Twilio WhatsApp] Sent message successfully. Twilio SID: {sid}")
            
            # Log to DB
            wa_log = {
                "id": f"wa-log-{int(datetime.now().timestamp())}",
                "order_id": order_id,
                "phone": to_phone,
                "text": body,
                "status": "delivered",
                "sent_at": datetime.now()
            }
            await NotificationRepository.log_whatsapp(wa_log)
            
            return {"success": True, "sid": sid, "status": "delivered", "response": "OK"}
        except Exception as e:
            logger.error(f"[Twilio WhatsApp] API Error sending message to {to_phone}: {e}")
            return {"success": False, "sid": None, "status": "failed", "response": str(e)}

    @classmethod
    async def send_order_confirmation(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> dict:
        body = (
            f"Hello {customer_name},\n"
            f"Thank you for your order.\n"
            f"Order ID: {order_id.split('-')[-1]}\n"
            f"Amount: ₹{amount:.2f}\n\n"
            f"Reply YES to confirm your order.\n"
            f"Reply NO to cancel your order."
        )
        return await cls.send_whatsapp_message(to_phone, body, order_id)

    @classmethod
    async def send_order_cancelled(cls, to_phone: str, customer_name: str, order_id: str) -> dict:
        body = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[-1]} has been cancelled successfully as requested. Refund initiated if prepaid."
        return await cls.send_whatsapp_message(to_phone, body, order_id)

    @classmethod
    async def send_delivery_update(cls, to_phone: str, customer_name: str, order_id: str, status: str) -> dict:
        body = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[-1]} status is now: {status}."
        return await cls.send_whatsapp_message(to_phone, body, order_id)
