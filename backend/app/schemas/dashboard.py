from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class StatTrend(BaseModel):
    value: str
    type: str  # "up", "down", "neutral", "info"

class StatCard(BaseModel):
    title: str
    value: str
    trend: str
    trendType: str
    isPulse: bool = False

class DashboardOverviewResponse(BaseModel):
    total_revenue: float
    active_dispatch_queue: int
    low_inventory_items: int
    open_tickets: int

class DashboardCardsResponse(BaseModel):
    cards: List[StatCard]

class ChartDataPoint(BaseModel):
    label: str
    sales: float
    orders: int

class DashboardChartsResponse(BaseModel):
    revenue_chart: List[ChartDataPoint]
    top_products: List[Dict[str, Any]]
    outlet_performance: List[Dict[str, Any]]

class RecentOrder(BaseModel):
    id: str
    customer_name: str
    outlet_name: str
    items_summary: str
    status: str
    total: float
    created_at: datetime

class RecentActivity(BaseModel):
    id: str
    action: str
    module: str
    timestamp: datetime
    user: str

class SystemStatusResponse(BaseModel):
    status: str
    database: str
    server_time: datetime
    uptime: str

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    pagination: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
