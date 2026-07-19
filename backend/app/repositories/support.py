from typing import List, Optional
from app.models.support import Review, Complaint, SupportTicket, SLAPolicy

class SupportRepository:
    
    # Reviews
    async def get_reviews(self) -> List[Review]:
        return await Review.find_all().to_list()
        
    async def get_review(self, review_id: str) -> Optional[Review]:
        return await Review.find_one({"review_id": review_id})
        
    async def create_review(self, review: Review) -> Review:
        return await review.insert()

    async def update_review(self, review: Review) -> Review:
        return await review.save()
        
    # Complaints
    async def get_complaints(self) -> List[Complaint]:
        return await Complaint.find_all().to_list()
        
    async def create_complaint(self, complaint: Complaint) -> Complaint:
        return await complaint.insert()
        
    # Tickets
    async def get_tickets(self) -> List[SupportTicket]:
        return await SupportTicket.find_all().sort("-created_at").to_list()
        
    async def get_ticket(self, ticket_id: str) -> Optional[SupportTicket]:
        return await SupportTicket.find_one({"ticket_number": ticket_id})

    async def create_ticket(self, ticket: SupportTicket) -> SupportTicket:
        return await ticket.insert()

    async def update_ticket(self, ticket: SupportTicket) -> SupportTicket:
        return await ticket.save()
        
def get_support_repository() -> SupportRepository:
    return SupportRepository()
