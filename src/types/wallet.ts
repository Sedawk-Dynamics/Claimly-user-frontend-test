export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  transactionType: 'REFERRAL_REWARD' | 'REDEMPTION' | 'REFUND';
  amount: number;
  description: string;
  createdAt: string;
  relatedUserId?: string;
}

export interface WalletEligibility {
  isEligible: boolean;
  currentBalance: number;
  minimumRequired?: number;
}

