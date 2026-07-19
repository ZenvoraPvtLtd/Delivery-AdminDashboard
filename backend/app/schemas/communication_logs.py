from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class OrderActionRequest(BaseModel):
    orderId: str
    reason: Optional[str] = None

class WebhookRequest(BaseModel):
    From: str
    Body: str

class ResendRequest(BaseModel):
    orderId: str
    channel: str

class TimeLeapRequest(BaseModel):
    orderId: str
    hours: int

class KpiCardsResponse(BaseModel):
    total: int
    pending: int
    confirmed: int
    cancelled: int
    waDelivered: int
    smsDelivered: int
    waFailed: int
    smsFailed: int
    awaitingReply: int
    avgConfirmTime: int
    confirmationRate: int

class AnalyticsDataResponse(BaseModel):
    waSuccessRate: int
    smsSuccessRate: int
    cancellationReasons: List[Dict[str, Any]]

class DashboardAnalyticsResponse(BaseModel):
    cards: KpiCardsResponse
    analytics: AnalyticsDataResponse

class ConversationLogResponse(BaseModel):
    id: str
    order_id: str
    type: str # 'outbound_wa', 'outbound_sms', 'inbound_wa', 'inbound_sms'
    body: str
    status: str
    timestamp: str
