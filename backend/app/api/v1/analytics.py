from fastapi import APIRouter, Depends, Request
from typing import Any
from app.services.analytics import AnalyticsService, get_analytics_service
from app.schemas.analytics import AnalyticsDashboardResponse, ExportRequest, ExportResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/dashboard", response_model=AnalyticsDashboardResponse, summary="Get Analytics Dashboard Data")
async def get_dashboard_data(
    service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_dashboard_data()

@router.post("/export", response_model=ExportResponse, summary="Export Report")
async def export_report(
    data: ExportRequest,
    service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.export_report(data, current_user.email)
