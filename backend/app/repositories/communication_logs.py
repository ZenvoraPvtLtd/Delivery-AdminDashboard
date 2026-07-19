from typing import List, Optional
from app.models.communication_logs import CommunicationLog, ConversationThread
from app.models.order import Order
from app.models.customer import Customer
import uuid
from datetime import datetime

class CommunicationRepository:
    
    async def create_log(self, order_id: str, channel: str, direction: str, status: str, from_number: str, to_number: str, body: str) -> CommunicationLog:
        log = CommunicationLog(
            log_id=f"LOG-{uuid.uuid4().hex[:6].upper()}",
            order_id=order_id,
            channel=channel,
            direction=direction,
            status=status,
            from_number=from_number,
            to_number=to_number,
            body=body
        )
        return await log.insert()

    async def get_logs_for_order(self, order_id: str) -> List[CommunicationLog]:
        return await CommunicationLog.find({"order_id": order_id}).sort("created_at").to_list()

    async def find_order_by_phone(self, phone: str) -> Optional[Order]:
        # We find the most recent pending order for this phone
        orders = await Order.find({"customerPhone": phone, "confirmation_status": "Pending"}).sort("-createdAt").to_list()
        if orders:
            return orders[0]
        return None

    async def get_analytics_metrics(self) -> dict:
        total_orders = await Order.find({"confirmation_requested_at": {"$ne": None}}).count()
        pending = await Order.find({"confirmation_status": "Pending"}).count()
        confirmed = await Order.find({"confirmation_status": "Confirmed"}).count()
        cancelled = await Order.find({"confirmation_status": "Cancelled"}).count()

        wa_delivered = await CommunicationLog.find({"channel": "whatsapp", "status": "delivered"}).count()
        sms_delivered = await CommunicationLog.find({"channel": "sms", "status": "delivered"}).count()
        wa_failed = await CommunicationLog.find({"channel": "whatsapp", "status": "failed"}).count()
        sms_failed = await CommunicationLog.find({"channel": "sms", "status": "failed"}).count()

        return {
            "total": total_orders,
            "pending": pending,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "waDelivered": wa_delivered,
            "smsDelivered": sms_delivered,
            "waFailed": wa_failed,
            "smsFailed": sms_failed,
            "awaitingReply": pending,
            "avgConfirmTime": 12, # mock minutes
            "confirmationRate": int((confirmed / total_orders * 100) if total_orders > 0 else 100)
        }

def get_communication_repository() -> CommunicationRepository:
    return CommunicationRepository()
