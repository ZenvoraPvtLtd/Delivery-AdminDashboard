import { api } from './api';
import { initialTickets } from '../store/mockDb';

export interface ReviewResponse {
  id: string;
  customer: string;
  dish: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
}

export interface TicketMessage {
  sender: string;
  text: string;
  timestamp: string;
}

export interface TicketResponse {
  id: string;
  customerName: string;
  customerPhone: string;
  issueType: string;
  priority: string;
  status: string;
  createdAt: string;
  messages: TicketMessage[];
}

const mockReviews: ReviewResponse[] = [
  { id: 'rev-1', customer: 'Marcus Aurelius', dish: 'Truffle Mushroom Burger', rating: 5, comment: 'Absolutely delicious! The truffle glaze was rich and the bun was perfectly toasted.', date: '2026-07-22', status: 'Published' },
  { id: 'rev-2', customer: 'Bruce Wayne', dish: 'Spicy Pepperoni Pizza', rating: 4, comment: 'Great crust and cheese ratio. Slightly greasy but overall very satisfied.', date: '2026-07-21', status: 'Published' },
  { id: 'rev-3', customer: 'Clark Kent', dish: 'Iced Vanilla Matcha Latte', rating: 5, comment: 'Best matcha in town! Smooth and not overly sweet.', date: '2026-07-20', status: 'Published' }
];

class SupportService {
  async getReviews(): Promise<ReviewResponse[]> {
    try {
      const response = await api.get('/api/v1/support/reviews');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Backend get reviews failed, using mock data.", e);
    }
    return mockReviews;
  }

  async toggleReviewStatus(reviewId: string, status: string): Promise<ReviewResponse> {
    try {
      const response = await api.put(`/api/v1/support/reviews/${reviewId}/status`, { status });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend toggle review status failed.");
    }
    const rev = mockReviews.find(r => r.id === reviewId);
    if (rev) {
      rev.status = status;
      return rev;
    }
    throw new Error('Review not found');
  }

  async getTickets(): Promise<TicketResponse[]> {
    try {
      const response = await api.get('/api/v1/support/tickets');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Backend get tickets failed, using mock data.", e);
    }
    return initialTickets.map(t => ({
      id: t.id,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      issueType: t.issueType,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      messages: t.messages
    }));
  }

  async replyToTicket(ticketId: string, text: string, sender: string = 'support'): Promise<TicketResponse> {
    try {
      const response = await api.post(`/api/v1/support/tickets/${ticketId}/reply`, { text, sender });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend reply to ticket failed.");
    }
    const ticket = initialTickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.messages.push({ sender: sender as any, text, timestamp: new Date().toISOString() });
      if (sender === 'support') ticket.status = 'In Progress';
      return ticket as any;
    }
    throw new Error('Ticket not found');
  }

  async resolveTicket(ticketId: string): Promise<TicketResponse> {
    try {
      const response = await api.put(`/api/v1/support/tickets/${ticketId}/resolve`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend resolve ticket failed.");
    }
    const ticket = initialTickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = 'Resolved';
      return ticket as any;
    }
    throw new Error('Ticket not found');
  }
}

export const supportService = new SupportService();
