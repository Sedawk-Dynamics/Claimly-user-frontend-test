import api from './api';
import { User, SubscriptionStatus, Subscription, UserDocument, KycStatus } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/user/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>('/user/profile', data);
    return response.data.data;
  },

  async getSubscription(all: boolean = false): Promise<SubscriptionStatus | Subscription[]> {
    const response = await api.get<{ success: boolean; data: SubscriptionStatus | Subscription[] }>(
      `/user/subscription${all ? '?all=true' : ''}`
    );
    return response.data.data;
  },

  async getKycStatus(): Promise<KycStatus> {
    const response = await api.get<{ success: boolean; data: KycStatus }>('/user/kyc-status');
    return response.data.data;
  },

  async generateReferralCode(regenerate: boolean = false): Promise<{ referralCode: string; expiresAt: string }> {
    const response = await api.post<{ success: boolean; data: { referralCode: string; expiresAt: string } }>(
      `/user/referral-code${regenerate ? '?regenerate=true' : ''}`
    );
    return response.data.data;
  },

  async getNotifications(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/notifications');
    return response.data.data;
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};

export const documentService = {
  async uploadDocument(file: File, documentType: 'AADHAAR' | 'PAN' | 'OTHER', documentName?: string): Promise<UserDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.post<{ success: boolean; data: UserDocument }>('/user/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateDocument(documentId: string, file: File, documentType: 'AADHAAR' | 'PAN' | 'OTHER', documentName?: string): Promise<UserDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.put<{ success: boolean; data: UserDocument }>(`/user/document/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getDocuments(): Promise<UserDocument[]> {
    const response = await api.get<{ success: boolean; data: UserDocument[] }>('/user/document');
    return response.data.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/user/document/${documentId}`);
  },
};

