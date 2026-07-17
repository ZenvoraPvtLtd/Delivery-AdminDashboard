import os
import asyncio
import logging
from datetime import datetime
from twilio.rest import Client
from repositories.notification_repository import NotificationRepository

logger = logging.getLogger("delivery_admin.twilio_sms")

def _send_twilio_sms_sync(account_sid: str, auth_token: str, from_number: str, to_number: str, text: str) -> str:
    """
    Synchronous execution wrapper for Twilio SMS client. Run in executor.
    """
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=text,
        from_=from_number,
        to=to_number
    )
    return message.sid

class TwilioSmsService:
    @classmethod
    def get_credentials(cls):
        return {
            "sid": os.getenv("TWILIO_ACCOUNT_SID", "mock-sid"),
            "token": os.getenv("TWILIO_AUTH_TOKEN", "mock-token"),
            "phone": os.getenv("TWILIO_SMS_NUMBER", "+15005550006")
        }

    @classmethod
    async def send_sms(cls, to_phone: str, text: str, order_id: str) -> dict:
        """
        Asynchronously send an SMS using Twilio API.
        """
        creds = cls.get_credentials()
        logger.info(f"[Twilio SMS] Queuing outbound SMS to {to_phone}: {text}")

        # Check Sandbox Mock Fallback
        if creds["sid"] == "mock-sid" or creds["token"] == "mock-token":
            mock_sid = f"SM{int(datetime.now().timestamp())}mock{os.urandom(8).hex()}"
            logger.info(f"[Twilio SMS] MOCK MODE enabled. Message SID: {mock_sid}")
            
            # Log to DB
            sms_log = {
                "id": f"sms-log-{int(datetime.now().timestamp())}",
                "order_id": order_id,
                "phone": to_phone,
                "provider": "twilio",
                "text": text,
                "status": "delivered",
                "sent_at": datetime.now()
            }
            await NotificationRepository.log_sms(sms_log)
            
            return {"success": True, "sid": mock_sid, "status": "delivered", "response": "Mock Delivery"}

        try:
            # Delegate blocking SDK invocation to asyncio thread pool executor
            sid = await asyncio.to_thread(
                _send_twilio_sms_sync,
                creds["sid"],
                creds["token"],
                creds["phone"],
                to_phone,
                text
            )
            
            logger.info(f"[Twilio SMS] Sent SMS successfully. Twilio SID: {sid}")
            
            # Log to DB
            sms_log = {
                "id": f"sms-log-{int(datetime.now().timestamp())}",
                "order_id": order_id,
                "phone": to_phone,
                "provider": "twilio",
                "text": text,
                "status": "delivered",
                "sent_at": datetime.now()
            }
            await NotificationRepository.log_sms(sms_log)
            
            return {"success": True, "sid": sid, "status": "delivered", "response": "OK"}
        except Exception as e:
            logger.error(f"[Twilio SMS] API Error sending SMS to {to_phone}: {e}")
            return {"success": False, "sid": None, "status": "failed", "response": str(e)}

    @classmethod
    async def send_order_confirmation(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> dict:
        text = f"Your Order #{order_id.split('-')[-1]} Amount ₹{amount:.2f} Reply YES to Confirm Reply NO to Cancel"
        return await cls.send_sms(to_phone, text, order_id)

    @classmethod
    async def send_order_cancelled(cls, to_phone: str, customer_name: str, order_id: str) -> dict:
        text = f"Your Order #{order_id.split('-')[-1]} has been cancelled successfully as requested."
        return await cls.send_sms(to_phone, text, order_id)

    @classmethod
    async def send_delivery_update(cls, to_phone: str, customer_name: str, order_id: str, status: str) -> dict:
        text = f"Your Order #{order_id.split('-')[-1]} status is now: {status}."
        return await cls.send_sms(to_phone, text, order_id)

    @classmethod
    async def send_payment_success(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> dict:
        text = f"Hi {customer_name}, we've received payment of ₹{amount:.2f} for Order #{order_id.split('-')[-1]}."
        return await cls.send_sms(to_phone, text, order_id)
