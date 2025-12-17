import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { env } from '../config/env';

class ApiService {
  private api: AxiosInstance;
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    this.api = axios.create({
      baseURL: env.VITE_API_URL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors with retry logic
    this.api.interceptors.response.use(
      (response) => {
        // Reset retry count on successful response
        this.retryCount = 0;
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear auth data and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Handle network errors and 5xx errors with retry logic
        if (
          (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
          !originalRequest._retry &&
          this.retryCount < this.maxRetries
        ) {
          originalRequest._retry = true;
          this.retryCount++;

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * this.retryCount));

          // Retry the request
          return this.api(originalRequest);
        }

        // Reset retry count after max retries
        if (this.retryCount >= this.maxRetries) {
          this.retryCount = 0;
        }

        // Log error in development
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            message: error.message,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService.instance;

