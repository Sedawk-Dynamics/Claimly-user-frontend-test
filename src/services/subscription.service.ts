import api from './api';
import { Subscription } from '../types';

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
};

