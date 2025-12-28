import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { env } from '../config/env';

// Global callback registry for API tracking
type ApiCallCallback = (call: {
  method: string;
  url: string;
  fullUrl: string;
  headers: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  error?: any;
  duration?: number;
}) => void;

let apiCallCallback: ApiCallCallback | null = null;

export function registerApiCallCallback(callback: ApiCallCallback | null) {
  apiCallCallback = callback;
}

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

    // Request interceptor to add auth token and track requests
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Store request start time
        (config as any).__startTime = Date.now();

        // Track request
        if (apiCallCallback && config.url) {
          const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
          const headers: Record<string, string> = {};
          if (config.headers) {
            Object.keys(config.headers).forEach((key) => {
              const value = config.headers[key];
              if (typeof value === 'string') {
                headers[key] = value;
              }
            });
          }

          // Store request data for later use in response interceptor
          (config as any).__requestData = {
            method: (config.method || 'GET').toUpperCase(),
            url: config.url,
            fullUrl,
            headers,
            requestBody: config.data,
          };
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors with retry logic and track responses
    this.api.interceptors.response.use(
      (response) => {
        // Reset retry count on successful response
        this.retryCount = 0;

        // Track successful response
        if (apiCallCallback && response.config) {
          const requestData = (response.config as any).__requestData;
          const startTime = (response.config as any).__startTime;
          const duration = startTime ? Date.now() - startTime : undefined;

          if (requestData) {
            const responseHeaders: Record<string, string> = {};
            if (response.headers) {
              Object.keys(response.headers).forEach((key) => {
                const value = response.headers[key];
                if (typeof value === 'string') {
                  responseHeaders[key] = value;
                } else if (Array.isArray(value)) {
                  responseHeaders[key] = value.join(', ');
                }
              });
            }

            apiCallCallback({
              ...requestData,
              responseStatus: response.status,
              responseHeaders,
              responseBody: response.data,
              duration,
            });
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Track error response
        if (apiCallCallback && originalRequest) {
          const requestData = (originalRequest as any).__requestData;
          const startTime = (originalRequest as any).__startTime;
          const duration = startTime ? Date.now() - startTime : undefined;

          if (requestData) {
            const responseHeaders: Record<string, string> = {};
            if (error.response?.headers) {
              Object.keys(error.response.headers).forEach((key) => {
                const value = error.response!.headers[key];
                if (typeof value === 'string') {
                  responseHeaders[key] = value;
                } else if (Array.isArray(value)) {
                  responseHeaders[key] = value.join(', ');
                }
              });
            }

            apiCallCallback({
              ...requestData,
              responseStatus: error.response?.status,
              responseHeaders,
              responseBody: error.response?.data,
              error: error.response?.data || error.message,
              duration,
            });
          }
        }

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

