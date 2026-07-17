import os
import logging
import httpx
from datetime import datetime
from repositories.notification_repository import NotificationRepository

logger = logging.getLogger("delivery_admin.sms")

class SmsService:
    @classmethod
    def get_twilio_credentials(cls):
        return {
            "sid": os.getenv("TWILIO_ACCOUNT_SID", "mock-sid"),
            "token": os.getenv("TWILIO_AUTH_TOKEN", "mock-token"),
            "phone": os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")
        }

    @classmethod
    def get_msg91_credentials(cls):
        return {
            "key": os.getenv("MSG91_AUTH_KEY", "mock-key"),
            "sender": os.getenv("MSG91_SENDER_ID", "DELIVO")
        }

    @classmethod
    async def send_sms(cls, to_phone: str, text: str, order_id: str, provider: str = "twilio") -> bool:
        logger.info(f"[SMS] [{provider.upper()}] Outbox message to {to_phone}: {text}")

        # Log log-entry to database
        sms_log = {
            "id": f"sms-log-{int(datetime.now().timestamp())}",
            "order_id": order_id,
            "phone": to_phone,
            "provider": provider,
            "text": text,
            "status": "delivered",
            "sent_at": datetime.now()
        }
        await NotificationRepository.log_sms(sms_log)

        # Handle Mock Mode
        if provider == "twilio":
            creds = cls.get_twilio_credentials()
            if creds["sid"] == "mock-sid":
                logger.info("[SMS] Running in Twilio Sandbox Mock Mode.")
                return True
                
            url = f"https://api.twilio.com/2010-04-01/Accounts/{creds['sid']}/Messages.json"
            auth = (creds["sid"], creds["token"])
            payload = {
                "To": to_phone,
                "From": creds["phone"],
                "Body": text
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, data=payload, auth=auth, timeout=10.0)
                    return response.status_code in [200, 201]
            except Exception as e:
                logger.error(f"[SMS] Twilio HTTP request failed: {e}")
                return False
        else:
            creds = cls.get_msg91_credentials()
            if creds["key"] == "mock-key":
                logger.info("[SMS] Running in MSG91 Sandbox Mock Mode.")
                return True

            url = "https://api.msg91.com/api/v5/flow/"
            headers = {
                "authkey": creds["key"],
                "content-type": "application/json"
            }
            payload = {
                "flow_id": "mock-flow-id",
                "sender": creds["sender"],
                "recipients": [{"mobiles": to_phone, "message": text}]
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                    return response.status_code == 200
            except Exception as e:
                logger.error(f"[SMS] MSG91 HTTP request failed: {e}")
                return False

    @classmethod
    async def send_order_confirmation(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> bool:
        msg = f"Hello {customer_name}, please confirm your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} totaling ₹{amount:.2f}. Reply YES to Confirm or NO to Cancel."
        return await cls.send_sms(to_phone, msg, order_id)

    @classmethod
    async def send_order_cancelled(cls, to_phone: str, customer_name: str, order_id: str) -> bool:
        msg = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} has been cancelled successfully."
        return await cls.send_sms(to_phone, msg, order_id)

    @classmethod
    async def send_delivery_update(cls, to_phone: str, customer_name: str, order_id: str, status: str) -> bool:
        msg = f"Hello {customer_name}, your Delivo Order #{order_id.split('-')[1] if '-' in order_id else order_id} is now: {status}."
        return await cls.send_sms(to_phone, msg, order_id)

    @classmethod
    async def send_payment_success(cls, to_phone: str, customer_name: str, order_id: str, amount: float) -> bool:
        msg = f"Hi {customer_name}, we've received payment of ₹{amount:.2f} for Order #{order_id.split('-')[1] if '-' in order_id else order_id}. Thank you!"
        return await cls.send_sms(to_phone, msg, order_id)
