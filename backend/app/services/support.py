from typing import List, Optional
from app.repositories.support import SupportRepository, get_support_repository
from app.models.support import Review, Complaint, SupportTicket, TicketMessage
from app.schemas.support import ReviewResponse, TicketResponse, TicketReplyRequest
from fastapi import HTTPException
from datetime import datetime
import asyncio

class SupportService:
    def __init__(self, repository: SupportRepository):
        self.repository = repository

    async def get_reviews(self) -> List[ReviewResponse]:
        reviews = await self.repository.get_reviews()
        if not reviews:
            # Seed dummy reviews if none exist
            r1 = Review(customer_id="c1", customer_name="Diana Prince", product_name="Truffle Mushroom Burger", rating=5, comment="Phenomenal burger! Truffle cream was rich and mushrooms fresh.")
            r2 = Review(customer_id="c2", customer_name="Clark Kent", product_name="Spicy Pepperoni Pizza (12\")", rating=4, comment="Great crust, pepperoni was nice and spicy.")
            r3 = Review(customer_id="c3", customer_name="Steve Rogers", product_name="Premium Veggie Salad Bowl", rating=2, comment="Salad portion size was tiny for the price.")
            await self.repository.create_review(r1)
            await self.repository.create_review(r2)
            await self.repository.create_review(r3)
            reviews = [r1, r2, r3]
            
        return [
            ReviewResponse(
                id=r.review_id,
                customer=r.customer_name,
                dish=r.product_name or "Unknown Item",
                rating=r.rating,
                comment=r.comment,
                date=r.created_at.strftime("%Y-%m-%d"),
                status=r.visibility
            ) for r in reviews
        ]
        
    async def toggle_review_status(self, review_id: str, new_status: str, request_info: dict) -> ReviewResponse:
        r = await self.repository.get_review(review_id)
        if not r:
            raise HTTPException(status_code=404, detail="Review not found")
        
        r.visibility = new_status
        r = await self.repository.update_review(r)
        
        return ReviewResponse(
            id=r.review_id,
            customer=r.customer_name,
            dish=r.product_name or "Unknown Item",
            rating=r.rating,
            comment=r.comment,
            date=r.created_at.strftime("%Y-%m-%d"),
            status=r.visibility
        )

    async def get_tickets(self) -> List[TicketResponse]:
        tickets = await self.repository.get_tickets()
        if not tickets:
            # Seed dummy ticket if none exist
            t1 = SupportTicket(
                customer_name="John Doe",
                customer_phone="+1 555-0000",
                issue_type="Missing Item",
                priority="High",
                status="Open",
                messages=[
                    TicketMessage(sender="customer", text="Hello, my order is missing the drink!"),
                    TicketMessage(sender="system", text="System: Ticket opened. SLA Due in 4 hours.")
                ]
            )
            await self.repository.create_ticket(t1)
            tickets = [t1]
            
        return [
            TicketResponse(
                id=t.ticket_number,
                customerName=t.customer_name,
                customerPhone=t.customer_phone or "",
                issueType=t.issue_type,
                priority=t.priority,
                status=t.status,
                createdAt=t.created_at,
                messages=t.messages
            ) for t in tickets
        ]
        
    async def reply_ticket(self, ticket_id: str, request: TicketReplyRequest, request_info: dict) -> TicketResponse:
        t = await self.repository.get_ticket(ticket_id)
        if not t:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        t.messages.append(TicketMessage(
            sender=request.sender,
            text=request.text
        ))
        
        if request.sender == "support" and t.status == "Open":
            t.status = "In Progress"
            
        t = await self.repository.update_ticket(t)
        
        return TicketResponse(
            id=t.ticket_number,
            customerName=t.customer_name,
            customerPhone=t.customer_phone or "",
            issueType=t.issue_type,
            priority=t.priority,
            status=t.status,
            createdAt=t.created_at,
            messages=t.messages
        )

    async def resolve_ticket(self, ticket_id: str, request_info: dict) -> TicketResponse:
        t = await self.repository.get_ticket(ticket_id)
        if not t:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        t.status = "Resolved"
        t.resolution_time = datetime.utcnow()
        t.resolution_notes = "Resolved by support agent."
        
        t.messages.append(TicketMessage(
            sender="system",
            text="System: Ticket marked as Resolved."
        ))
        
        t = await self.repository.update_ticket(t)
        
        return TicketResponse(
            id=t.ticket_number,
            customerName=t.customer_name,
            customerPhone=t.customer_phone or "",
            issueType=t.issue_type,
            priority=t.priority,
            status=t.status,
            createdAt=t.created_at,
            messages=t.messages
        )

def get_support_service() -> SupportService:
    return SupportService(get_support_repository())
