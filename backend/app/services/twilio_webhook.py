from typing import List, Dict, Any
from app.repositories.communication_logs import CommunicationRepository, get_communication_repository
from app.models.order import Order
from app.models.audit import AuditLog
from app.schemas.communication_logs import DashboardAnalyticsResponse, KpiCardsResponse, AnalyticsDataResponse, ConversationLogResponse
from datetime import datetime
import uuid

class TwilioWebhookService:
    def __init__(self, repository: CommunicationRepository):
        self.repository = repository

    async def process_webhook(self, from_number: str, body: str, channel: str) -> None:
        # Find order by phone number
        order = await self.repository.find_order_by_phone(from_number)
        
        # Log incoming message
        await self.repository.create_log(
            order_id=order.id if order else "unknown",
            channel=channel,
            direction="inbound",
            status="received",
            from_number=from_number,
            to_number="system",
            body=body
        )

        if not order:
            return

        body_upper = body.strip().upper()
        yes_keywords = ["YES", "Y", "CONFIRM", "OK", "APPROVE"]
        no_keywords = ["NO", "N", "CANCEL", "STOP"]

        if any(body_upper == kw for kw in yes_keywords):
            order.confirmation_status = "Confirmed"
            order.status = "Preparing"
            order.confirmed_at = datetime.utcnow().isoformat() + "Z"
            order.customer_reply = body
            order.confirmation_source = channel
            await order.save()
            
            # Audit log
            await AuditLog(
                user_id="System",
                username="Twilio Webhook",
                action=f"Order {order.id} automatically confirmed by customer via {channel}",
                module="Order Confirmation",
                ip_address="0.0.0.0"
            ).insert()
            
            # Send automated outbound confirmed message
            await self.repository.create_log(
                order_id=order.id,
                channel=channel,
                direction="outbound",
                status="sent",
                from_number="system",
                to_number=from_number,
                body=f"Thank you! Your order {order.id} is confirmed and now preparing."
            )

        elif any(body_upper == kw for kw in no_keywords):
            order.confirmation_status = "Cancelled"
            order.status = "Cancelled"
            order.cancelled_at = datetime.utcnow().isoformat() + "Z"
            order.customer_reply = body
            order.confirmation_source = channel
            await order.save()

            await AuditLog(
                user_id="System",
                username="Twilio Webhook",
                action=f"Order {order.id} cancelled by customer via {channel}",
                module="Order Confirmation",
                ip_address="0.0.0.0"
            ).insert()

            await self.repository.create_log(
                order_id=order.id,
                channel=channel,
                direction="outbound",
                status="sent",
                from_number="system",
                to_number=from_number,
                body=f"Your order {order.id} has been cancelled successfully."
            )

    async def get_analytics(self) -> DashboardAnalyticsResponse:
        metrics = await self.repository.get_analytics_metrics()
        
        cards = KpiCardsResponse(
            total=metrics["total"],
            pending=metrics["pending"],
            confirmed=metrics["confirmed"],
            cancelled=metrics["cancelled"],
            waDelivered=metrics["waDelivered"],
            smsDelivered=metrics["smsDelivered"],
            waFailed=metrics["waFailed"],
            smsFailed=metrics["smsFailed"],
            awaitingReply=metrics["awaitingReply"],
            avgConfirmTime=metrics["avgConfirmTime"],
            confirmationRate=metrics["confirmationRate"]
        )

        analytics = AnalyticsDataResponse(
            waSuccessRate=98,
            smsSuccessRate=95,
            cancellationReasons=[
                {"name": "Changed Mind", "value": 45},
                {"name": "Wait Time Too Long", "value": 30},
                {"name": "Accidental Order", "value": 15},
                {"name": "Other", "value": 10}
            ]
        )
        return DashboardAnalyticsResponse(cards=cards, analytics=analytics)

    async def force_confirm(self, order_id: str) -> None:
        order = await Order.find_one({"id": order_id})
        if order:
            order.confirmation_status = "Confirmed"
            order.status = "Preparing"
            order.confirmed_at = datetime.utcnow().isoformat() + "Z"
            order.customer_reply = "Admin Forced"
            await order.save()
            await AuditLog(
                user_id="Admin",
                username="Admin",
                action=f"Admin forcefully confirmed order {order.id}",
                module="Order Confirmation",
                ip_address="127.0.0.1"
            ).insert()

    async def force_cancel(self, order_id: str, reason: str) -> None:
        order = await Order.find_one({"id": order_id})
        if order:
            order.confirmation_status = "Cancelled"
            order.status = "Cancelled"
            order.cancelled_at = datetime.utcnow().isoformat() + "Z"
            order.customer_reply = reason
            await order.save()

    async def resend_confirmation(self, order_id: str, channel: str) -> None:
        order = await Order.find_one({"id": order_id})
        if order:
            if channel in ["whatsapp", "both"]:
                await self.repository.create_log(order.id, "whatsapp", "outbound", "queued", "system", order.customerPhone, "Resending confirmation instructions.")
            if channel in ["sms", "both"]:
                await self.repository.create_log(order.id, "sms", "outbound", "queued", "system", order.customerPhone, "Resending confirmation instructions.")

    async def simulate_time_leap(self, order_id: str, hours: int) -> None:
        order = await Order.find_one({"id": order_id})
        if order and order.confirmation_status == "Pending":
            order.confirmation_status = "Cancelled"
            order.status = "Cancelled"
            order.cancelled_at = datetime.utcnow().isoformat() + "Z"
            order.customer_reply = f"Auto Expired ({hours}h limit)"
            await order.save()

    async def get_conversations(self, order_id: str) -> List[ConversationLogResponse]:
        logs = await self.repository.get_logs_for_order(order_id)
        res = []
        for l in logs:
            c_type = f"inbound_{l.channel}" if l.direction == "inbound" else f"outbound_{l.channel}"
            res.append(ConversationLogResponse(
                id=str(l.log_id),
                order_id=l.order_id,
                type=c_type,
                body=l.body,
                status=l.status,
                timestamp=l.created_at.strftime("%H:%M")
            ))
        return res

def get_twilio_service() -> TwilioWebhookService:
    return TwilioWebhookService(get_communication_repository())
