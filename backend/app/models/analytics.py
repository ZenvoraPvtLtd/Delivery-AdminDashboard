from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class ReportTemplate(Document):
    template_id: str = Field(default_factory=lambda: f"TPL-{uuid.uuid4().hex[:8].upper()}")
    name: str
    description: Optional[str] = None
    report_type: str # Sales, Customers, Inventory
    columns: List[str] = []
    default_filters: Dict[str, Any] = {}
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "report_templates"

class ScheduledReport(Document):
    schedule_id: str = Field(default_factory=lambda: f"SCH-{uuid.uuid4().hex[:8].upper()}")
    report_type: str
    format: str # PDF, CSV, Excel
    frequency: str # Daily, Weekly, Monthly
    recipients: List[str] = []
    status: str = "Active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "scheduled_reports"

class ReportExport(Document):
    export_id: str = Field(default_factory=lambda: f"EXP-{uuid.uuid4().hex[:8].upper()}")
    report_type: str
    format: str
    status: str = "Completed" # Pending, Processing, Completed, Failed
    file_url: Optional[str] = None
    requested_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "report_exports"

class AnalyticsSnapshot(Document):
    snapshot_id: str = Field(default_factory=lambda: f"SNAP-{uuid.uuid4().hex[:8].upper()}")
    snapshot_type: str # KPI, DeliveryPerformance, Cohort
    data: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "analytics_snapshots"
        indexes = ["snapshot_type", "generated_at"]

class DashboardWidget(Document):
    widget_id: str = Field(default_factory=lambda: f"WID-{uuid.uuid4().hex[:8].upper()}")
    name: str
    type: str # BarChart, LineChart, MetricCard
    data_source: str
    position: int
    is_active: bool = True

    class Settings:
        name = "dashboard_widgets"
