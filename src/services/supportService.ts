import { api } from './api';

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

class SupportService {
  async getReviews(): Promise<ReviewResponse[]> {
    const response = await api.get('/api/v1/support/reviews');
    return response.data;
  }

  async toggleReviewStatus(reviewId: string, status: string): Promise<ReviewResponse> {
    const response = await api.put(`/api/v1/support/reviews/${reviewId}/status`, { status });
    return response.data;
  }

  async getTickets(): Promise<TicketResponse[]> {
    const response = await api.get('/api/v1/support/tickets');
    return response.data;
  }

  async replyToTicket(ticketId: string, text: string, sender: string = 'support'): Promise<TicketResponse> {
    const response = await api.post(`/api/v1/support/tickets/${ticketId}/reply`, { text, sender });
    return response.data;
  }

  async resolveTicket(ticketId: string): Promise<TicketResponse> {
    const response = await api.put(`/api/v1/support/tickets/${ticketId}/resolve`);
    return response.data;
  }
}

export const supportService = new SupportService();
