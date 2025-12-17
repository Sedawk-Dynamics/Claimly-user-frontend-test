import api from './api';
import { LoginResponse, User } from '../types';

export const authService = {
  async verifyOTP(idToken: string, mobileNumber: string, name?: string, email?: string, deviceId?: string, referralCode?: string): Promise<LoginResponse> {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/register', {
      idToken,
      mobileNumber,
      name,
      email,
      deviceId,
      referralCode,
    });
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

