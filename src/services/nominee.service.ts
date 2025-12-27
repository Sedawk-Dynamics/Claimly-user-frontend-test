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
    relationship?: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';
    mobileNumber?: string;
    dob?: string;
    email?: string;
    address?: string;
  }): Promise<Nominee> {
    // Drop empty strings so backend can auto-classify draft vs complete
    const payload: any = { name: data.name };
    if (data.relationship) payload.relationship = data.relationship;
    if (data.mobileNumber) payload.mobileNumber = data.mobileNumber;
    if (data.dob) payload.dob = data.dob;
    if (data.email !== undefined) payload.email = data.email || undefined;
    if (data.address !== undefined) payload.address = data.address || undefined;

    const response = await api.post<{ success: boolean; data: Nominee }>('/nominees', payload);
    return response.data.data;
  },

  async updateNominee(
    id: string,
    data: {
      name?: string;
      relationship?: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';
      mobileNumber?: string;
      dob?: string;
      email?: string;
      address?: string;
      status?: 'DRAFT';
      documentsToAdd?: Array<{
        file: File;
        documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'OTHER';
        documentName: string;
      }>;
      documentsToUpdate?: Array<{
        documentId: string;
        file: File;
        documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'OTHER';
        documentName: string;
      }>;
      documentsToDelete?: string[];
    }
  ): Promise<Nominee> {
    const formData = new FormData();

    // Add basic fields
    if (data.name) formData.append('name', data.name);
    if (data.relationship) formData.append('relationship', data.relationship);
    if (data.mobileNumber) formData.append('mobileNumber', data.mobileNumber);
    if (data.dob) formData.append('dob', data.dob);
    if (data.email !== undefined) formData.append('email', data.email || '');
    if (data.address !== undefined) formData.append('address', data.address || '');

    // Add new documents
    if (data.documentsToAdd && data.documentsToAdd.length > 0) {
      data.documentsToAdd.forEach((doc, index) => {
        formData.append(`document${index}`, doc.file);
        formData.append(`documentType${index}`, doc.documentType);
        formData.append(`documentName${index}`, doc.documentName);
      });
    }

    // Add document updates
    if (data.documentsToUpdate && data.documentsToUpdate.length > 0) {
      data.documentsToUpdate.forEach((doc, index) => {
        formData.append(`updateDocument${index}`, doc.file);
        formData.append(`updateDocumentId${index}`, doc.documentId);
        formData.append(`updateDocumentType${index}`, doc.documentType);
        formData.append(`updateDocumentName${index}`, doc.documentName);
      });
    }

    // Add documents to delete
    if (data.documentsToDelete && data.documentsToDelete.length > 0) {
      formData.append('documentsToDelete', JSON.stringify(data.documentsToDelete));
    }

    if (data.status === 'DRAFT') {
      formData.append('status', 'DRAFT');
    }

    const response = await api.put<{ success: boolean; data: Nominee }>(`/nominees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
    documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'OTHER',
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
    documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'OTHER',
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

