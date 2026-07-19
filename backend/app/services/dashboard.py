from typing import List, Dict, Any
from datetime import datetime, timezone
from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardCardsResponse,
    StatCard,
    DashboardChartsResponse,
    ChartDataPoint,
    RecentOrder,
    RecentActivity,
    SystemStatusResponse
)

class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    async def get_overview(self) -> DashboardOverviewResponse:
        total_revenue = await self.repository.get_total_revenue()
        active_queue = await self.repository.get_active_dispatch_queue()
        low_inventory = await self.repository.get_low_inventory_count()
        open_tickets = await self.repository.get_open_tickets_count()

        return DashboardOverviewResponse(
            total_revenue=total_revenue,
            active_dispatch_queue=active_queue,
            low_inventory_items=low_inventory,
            open_tickets=open_tickets
        )

    async def get_cards(self) -> DashboardCardsResponse:
        total_revenue = await self.repository.get_total_revenue()
        active_queue = await self.repository.get_active_dispatch_queue()
        low_inventory = await self.repository.get_low_inventory_count()
        open_tickets = await self.repository.get_open_tickets_count()

        cards = [
            StatCard(
                title="Total Revenue (Gross)",
                value=f"${total_revenue:,.2f}",
                trend="+0% from last week",
                trendType="neutral",
                isPulse=False
            ),
            StatCard(
                title="Active Dispatch Queue",
                value=str(active_queue),
                trend=f"{active_queue} pending confirmation",
                trendType="info",
                isPulse=active_queue > 0
            ),
            StatCard(
                title="Low Inventory Items",
                value=str(low_inventory),
                trend="Reorder purchase orders due" if low_inventory > 0 else "Stock healthy",
                trendType="down" if low_inventory > 0 else "up",
                isPulse=False
            ),
            StatCard(
                title="Open Tickets",
                value=str(open_tickets),
                trend=f"{open_tickets} high priority",
                trendType="neutral",
                isPulse=False
            )
        ]
        return DashboardCardsResponse(cards=cards)

    async def get_charts(self, timeframe: str = "weekly") -> DashboardChartsResponse:
        raw_chart_data = await self.repository.get_chart_data(timeframe)
        
        revenue_chart = []
        for row in raw_chart_data:
            revenue_chart.append(ChartDataPoint(
                label=row["_id"],
                sales=row.get("sales", 0.0),
                orders=row.get("orders", 0)
            ))
            
        # If DB returns no chart data, we just return empty array
        return DashboardChartsResponse(
            revenue_chart=revenue_chart,
            top_products=[],
            outlet_performance=[]
        )

    async def get_recent_orders(self) -> List[RecentOrder]:
        raw_orders = await self.repository.get_recent_orders()
        orders = []
        for o in raw_orders:
            # Safely handle missing keys in unstructured motor data
            orders.append(RecentOrder(
                id=str(o.get("_id", "unknown")),
                customer_name=o.get("customerName", "Unknown"),
                outlet_name=o.get("outletName", "Unknown"),
                items_summary=f"{len(o.get('items', []))} items",
                status=o.get("status", "Pending"),
                total=o.get("total", 0.0),
                created_at=o.get("created_at", datetime.now(timezone.utc))
            ))
        return orders

    async def get_recent_activities(self) -> List[RecentActivity]:
        logs = await self.repository.get_recent_activities()
        activities = []
        for log in logs:
            activities.append(RecentActivity(
                id=str(log.id),
                action=log.action,
                module=log.module,
                timestamp=log.timestamp,
                user=log.user_id or "System"
            ))
        return activities

    async def get_system_status(self) -> SystemStatusResponse:
        # Check if database is alive
        db = self.repository._get_db()
        db_status = "Offline"
        try:
            await db.command("ping")
            db_status = "Online"
        except Exception:
            pass

        return SystemStatusResponse(
            status="Operational" if db_status == "Online" else "Degraded",
            database=db_status,
            server_time=datetime.now(timezone.utc),
            uptime="100%"
        )

# Dependency injection helper
def get_dashboard_service() -> DashboardService:
    repo = DashboardRepository()
    return DashboardService(repo)
