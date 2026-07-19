from typing import Dict, Any
from app.repositories.analytics import AnalyticsRepository, get_analytics_repository
from app.models.analytics import ReportExport
from app.schemas.analytics import AnalyticsDashboardResponse, ExportRequest, ExportResponse

class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository):
        self.repository = repository

    async def get_dashboard_data(self) -> AnalyticsDashboardResponse:
        raw_data = await self.repository.get_dashboard_aggregations()
        return AnalyticsDashboardResponse(**raw_data)

    async def export_report(self, req: ExportRequest, requested_by: str) -> ExportResponse:
        export = ReportExport(
            report_type=req.reportType,
            format=req.format,
            requested_by=requested_by
        )
        export = await self.repository.log_export(export)
        
        return ExportResponse(
            status="Completed",
            message=f"Report {req.reportType} compiled successfully.",
            export_id=export.export_id
        )

def get_analytics_service() -> AnalyticsService:
    return AnalyticsService(get_analytics_repository())
