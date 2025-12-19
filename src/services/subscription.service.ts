import api from './api';
import { Subscription } from '../types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  isPopular: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export const subscriptionService = {
  async createSubscription(data: {
    planName: string;
    amount: string;
    paymentId: string;
    paymentStatus?: 'SUCCESS' | 'PENDING' | 'FAILED';
    transactionDate: string;
    walletAmountUsed?: string;
  }): Promise<Subscription> {
    const response = await api.post<{ success: boolean; data: Subscription }>('/subscription', data);
    return response.data.data;
  },

  async getReceiptURL(subscriptionId: string): Promise<{ receiptUrl: string; downloadUrl: string }> {
    const response = await api.get<{ success: boolean; data: { receiptUrl: string; downloadUrl: string } }>(
      `/subscription/${subscriptionId}/receipt-url`
    );
    return response.data.data;
  },

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<{ success: boolean; data: SubscriptionPlan[] }>(
      '/subscription-plan/active'
    );
    return response.data.data;
  },

  async downloadReceipt(subscriptionId: string): Promise<void> {
    try {
      // Get the base URL from the API instance
      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'http://localhost:3000';
      
      // Fetch with blob response - this downloads our own generated PDF receipt
      const response = await fetch(`${baseURL}/subscription/${subscriptionId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${subscriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  },
};

