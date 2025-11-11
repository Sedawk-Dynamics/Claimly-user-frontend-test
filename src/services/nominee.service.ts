import api from './api';
import { Nominee, NomineeDocument } from '../types';

export const nomineeService = {
  async getNominees(): Promise<Nominee[]> {
    const response = await api.get<{ success: boolean; data: Nominee[] }>('/nominees');
    return response.data.data;
  },

  async getNomineeById(id: string): Promise<Nominee> {
    const response = await api.get<{ success: boolean; data: Nominee }>(`/nominees/${id}`);
    return response.data.data;
  },

  async createNominee(data: {
    name: string;
    relationship: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';
    mobileNumber: string;
    email?: string;
    address?: string;
  }): Promise<Nominee> {
    const response = await api.post<{ success: boolean; data: Nominee }>('/nominees', data);
    return response.data.data;
  },

  async updateNominee(id: string, data: Partial<Nominee>): Promise<Nominee> {
    const response = await api.put<{ success: boolean; data: Nominee }>(`/nominees/${id}`, data);
    return response.data.data;
  },

  async deleteNominee(id: string): Promise<void> {
    await api.delete(`/nominees/${id}`);
  },
};

export const nomineeDocumentService = {
  async uploadDocument(
    nomineeId: string,
    file: File,
    documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'DEATH_CERTIFICATE' | 'OTHER',
    documentName?: string
  ): Promise<NomineeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.post<{ success: boolean; data: NomineeDocument }>(
      `/nominee/${nomineeId}/document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async updateDocument(
    nomineeId: string,
    documentId: string,
    file: File,
    documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'DEATH_CERTIFICATE' | 'OTHER',
    documentName?: string
  ): Promise<NomineeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.put<{ success: boolean; data: NomineeDocument }>(
      `/nominee/${nomineeId}/document/${documentId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async getDocuments(nomineeId: string): Promise<NomineeDocument[]> {
    const response = await api.get<{ success: boolean; data: NomineeDocument[] }>(`/nominee/${nomineeId}/document`);
    return response.data.data;
  },

  async deleteDocument(nomineeId: string, documentId: string): Promise<void> {
    await api.delete(`/nominee/${nomineeId}/document/${documentId}`);
  },
};

