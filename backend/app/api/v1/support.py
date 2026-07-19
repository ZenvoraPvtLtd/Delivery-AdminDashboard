from fastapi import APIRouter, Depends, Request
from typing import Any, List
from app.services.support import SupportService, get_support_service
from app.schemas.support import (
    ReviewResponse, TicketResponse, TicketReplyRequest, ToggleReviewStatusRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

@router.get("/reviews", response_model=List[ReviewResponse], summary="List Reviews")
async def list_reviews(
    service: SupportService = Depends(get_support_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_reviews()

@router.put("/reviews/{review_id}/status", response_model=ReviewResponse, summary="Toggle Review Status")
async def toggle_review_status(
    review_id: str,
    data: ToggleReviewStatusRequest,
    request: Request,
    service: SupportService = Depends(get_support_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_review_status(review_id, data.status, get_request_info(request, current_user))

@router.get("/tickets", response_model=List[TicketResponse], summary="List Tickets")
async def list_tickets(
    service: SupportService = Depends(get_support_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_tickets()

@router.post("/tickets/{ticket_id}/reply", response_model=TicketResponse, summary="Reply to Ticket")
async def reply_to_ticket(
    ticket_id: str,
    data: TicketReplyRequest,
    request: Request,
    service: SupportService = Depends(get_support_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.reply_ticket(ticket_id, data, get_request_info(request, current_user))

@router.put("/tickets/{ticket_id}/resolve", response_model=TicketResponse, summary="Resolve Ticket")
async def resolve_ticket(
    ticket_id: str,
    request: Request,
    service: SupportService = Depends(get_support_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.resolve_ticket(ticket_id, get_request_info(request, current_user))
