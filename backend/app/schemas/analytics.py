from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class HighlightStatsResponse(BaseModel):
    aov: str
    aovTrend: str
    avgPrepTime: str
    avgPrepTrend: str
    avgDeliveryTime: str
    avgDeliveryTrend: str
    repeatCustomerRate: str
    repeatCustomerTrend: str

class DeliveryPerformancePoint(BaseModel):
    hour: str
    prepTime: int
    deliveryTime: int

class CustomerCohortPoint(BaseModel):
    name: str
    newCust: int
    repeatCust: int

class AnalyticsDashboardResponse(BaseModel):
    stats: HighlightStatsResponse
    deliveryPerformance: List[DeliveryPerformancePoint]
    repeatCustomersData: List[CustomerCohortPoint]

class ExportRequest(BaseModel):
    reportType: str
    format: str

class ExportResponse(BaseModel):
    status: str
    message: str
    export_id: str
