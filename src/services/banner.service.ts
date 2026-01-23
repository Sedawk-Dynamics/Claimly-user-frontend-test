import api from './api';

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const bannerService = {
  async getActiveBanner(): Promise<Banner | null> {
    try {
      const response = await api.get<{ success: boolean; data: Banner | null }>('/banners/active');
      return response.data.data;
    } catch (error) {
      // If no active banner, return null
      return null;
    }
  },
};
