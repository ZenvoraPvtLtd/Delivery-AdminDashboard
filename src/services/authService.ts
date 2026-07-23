import { api } from './api';

export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  message?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  success?: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
}

export interface CurrentUserResponse {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  permissions?: string[];
  is_active?: boolean;
  success?: boolean;
  data?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    permissions: string[];
    is_active: boolean;
  };
}

class AuthService {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', payload);
    return response.data;
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await api.get<CurrentUserResponse>('/api/v1/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.warn("Logout endpoint failed, proceeding with local cleanup");
    }
  }
}

export const authService = new AuthService();
