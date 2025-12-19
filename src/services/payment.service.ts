import api from './api';

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  key_id: string;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planName: string;
  amount: string;
  walletAmountUsed?: string;
}

export const paymentService = {
  /**
   * Create a Razorpay payment order
   */
  async createOrder(data: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<CreateOrderResponse> {
    const response = await api.post<{ success: boolean; data: CreateOrderResponse }>(
      '/payment/create-order',
      data
    );
    return response.data.data;
  },

  /**
   * Verify payment and create subscription
   */
  async verifyPayment(data: VerifyPaymentData) {
    const response = await api.post<{ success: boolean; data: any }>(
      '/payment/verify',
      data
    );
    return response.data.data;
  },
};
