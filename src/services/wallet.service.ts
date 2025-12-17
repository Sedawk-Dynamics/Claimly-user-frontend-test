import api from './api';
import { WalletBalance, WalletTransaction, WalletEligibility } from '../types/wallet';

export const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const response = await api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance');
    return response.data.data;
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    const response = await api.get<{ success: boolean; data: WalletTransaction[] }>('/wallet/transactions');
    return response.data.data;
  },

  async getEligibility(): Promise<WalletEligibility> {
    const response = await api.get<{ success: boolean; data: WalletEligibility }>('/wallet/eligibility');
    return response.data.data;
  },
};

