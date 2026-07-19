import axios from 'axios';
import { store, logout } from '../store';
import { addNotification } from '../store';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('access_token');
  }
};

export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized & refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip interception if it's the refresh route itself
    if (originalRequest.url?.includes('/v1/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          if (res.data?.data?.access_token) {
            const newAccessToken = res.data.data.access_token;
            setAuthToken(newAccessToken);
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, force logout
          setAuthToken(null);
          setRefreshToken(null);
          store.dispatch(logout());
        }
      } else {
        // No refresh token available, force logout
        setAuthToken(null);
        setRefreshToken(null);
        store.dispatch(logout());
        store.dispatch(addNotification({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          type: 'system'
        }));
      }
      return Promise.reject(error);
    }

    // Global Error Handling for other status codes
    if (!originalRequest.url?.includes('/v1/auth/me')) {
      const status = error.response?.status;
      let title = 'Network Error';
      let description = 'Could not connect to the server. Please check your connection.';
      
      if (status === 500) {
        title = 'Server Error';
        description = 'An internal server error occurred. Our team has been notified.';
      } else if (status === 403) {
        title = 'Forbidden';
        description = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        title = 'Not Found';
        description = 'The requested resource was not found.';
      } else if (error.response?.data?.error?.message) {
        title = 'Error';
        description = error.response.data.error.message;
      } else if (error.response?.data?.detail) {
        title = 'Error';
        description = error.response.data.detail;
      }

      store.dispatch(addNotification({
        title,
        description,
        type: 'system'
      }));
    }
    
    return Promise.reject(error);
  }
);
