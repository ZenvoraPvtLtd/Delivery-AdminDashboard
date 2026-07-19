from fastapi import APIRouter, Depends
from typing import Any
from app.services.dashboard import DashboardService, get_dashboard_service
from app.schemas.dashboard import (
    GenericResponse,
    DashboardOverviewResponse,
    DashboardCardsResponse,
    DashboardChartsResponse,
    SystemStatusResponse
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get(
    "/overview",
    response_model=GenericResponse,
    summary="Get Dashboard Overview",
    description="Returns high-level statistics for the dashboard overview (revenue, queue, inventory, tickets)."
)
async def get_overview(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_overview()
    return GenericResponse(
        success=True,
        message="Overview retrieved successfully",
        data=data
    )

@router.get(
    "/cards",
    response_model=GenericResponse,
    summary="Get Dashboard Cards",
    description="Returns formatted card statistics suitable for UI rendering."
)
async def get_cards(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_cards()
    return GenericResponse(
        success=True,
        message="Cards retrieved successfully",
        data=data
    )

@router.get(
    "/charts",
    response_model=GenericResponse,
    summary="Get Dashboard Charts",
    description="Returns data for revenue charts, top products, and outlet comparisons."
)
async def get_charts(
    timeframe: str = "weekly",
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_charts(timeframe=timeframe)
    return GenericResponse(
        success=True,
        message="Charts retrieved successfully",
        data=data
    )

@router.get(
    "/recent-orders",
    response_model=GenericResponse,
    summary="Get Recent Orders",
    description="Returns the latest orders for the kitchen prep queue tracker."
)
async def get_recent_orders(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_recent_orders()
    return GenericResponse(
        success=True,
        message="Recent orders retrieved successfully",
        data=data
    )

@router.get(
    "/recent-customers",
    response_model=GenericResponse,
    summary="Get Recent Customers",
    description="Returns the latest registered customers."
)
async def get_recent_customers(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Future implementation. Returns empty list so UI doesn't break.
    return GenericResponse(
        success=True,
        message="Recent customers retrieved successfully",
        data=[]
    )

@router.get(
    "/recent-payments",
    response_model=GenericResponse,
    summary="Get Recent Payments",
    description="Returns the latest transactions."
)
async def get_recent_payments(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Future implementation.
    return GenericResponse(
        success=True,
        message="Recent payments retrieved successfully",
        data=[]
    )

@router.get(
    "/recent-activities",
    response_model=GenericResponse,
    summary="Get Recent Activities",
    description="Returns recent audit logs."
)
async def get_recent_activities(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_recent_activities()
    return GenericResponse(
        success=True,
        message="Recent activities retrieved successfully",
        data=data
    )

@router.get(
    "/notifications",
    response_model=GenericResponse,
    summary="Get Notifications",
    description="Returns system and user alerts."
)
async def get_notifications(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Future implementation.
    return GenericResponse(
        success=True,
        message="Notifications retrieved successfully",
        data=[]
    )

@router.get(
    "/system-status",
    response_model=GenericResponse,
    summary="Get System Status",
    description="Returns the operational health of the database and servers."
)
async def get_system_status(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_system_status()
    return GenericResponse(
        success=True,
        message="System status retrieved successfully",
        data=data
    )
