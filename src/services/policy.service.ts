import api from './api';
import { Policy, PolicyDocument, InsuranceCompany } from '../types';

export const policyService = {
  async getPolicies(): Promise<Policy[]> {
    const response = await api.get<{ success: boolean; data: Policy[] }>('/policies');
    return response.data.data;
  },

  async getPolicyById(id: string): Promise<Policy> {
    const response = await api.get<{ success: boolean; data: Policy }>(`/policies/${id}`);
    return response.data.data;
  },

  async createPolicy(data: {
    insuranceCompanyId: string;
    policyNumber?: string;
    sumAssured?: string;
  }): Promise<Policy> {
    const payload: Record<string, string> = {
      insuranceCompanyId: data.insuranceCompanyId,
    };
    const trimmedPolicyNumber = data.policyNumber?.trim();
    const trimmedSumAssured = data.sumAssured?.toString().trim();

    if (trimmedPolicyNumber) {
      payload.policyNumber = trimmedPolicyNumber;
    }
    if (trimmedSumAssured) {
      payload.sumAssured = trimmedSumAssured;
    }

    const response = await api.post<{ success: boolean; data: Policy }>('/policies', payload);
    return response.data.data;
  },

  async updatePolicy(
    id: string,
    data: {
      insuranceCompanyId?: string;
      policyNumber?: string;
      sumAssured?: string;
      status?: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    }
  ): Promise<Policy> {
    const payload: Record<string, string> = {};

    if (data.insuranceCompanyId) {
      payload.insuranceCompanyId = data.insuranceCompanyId;
    }

    if (data.policyNumber !== undefined) {
      const trimmed = data.policyNumber?.trim();
      if (trimmed) {
        payload.policyNumber = trimmed;
      }
    }

    if (data.sumAssured !== undefined) {
      const trimmed = data.sumAssured?.toString().trim();
      if (trimmed) {
        payload.sumAssured = trimmed;
      }
    }

    if (data.status === 'DRAFT') {
      payload.status = 'DRAFT';
    }

    const response = await api.put<{ success: boolean; data: Policy }>(`/policies/${id}`, payload);
    return response.data.data;
  },

  async deletePolicy(id: string): Promise<void> {
    await api.delete(`/policies/${id}`);
  },
};

export const policyDocumentService = {
  async uploadDocument(
    policyId: string,
    file: File,
    documentType: 'POLICY_DOCUMENT' | 'RECEIPT' | 'OTHER',
    documentName?: string
  ): Promise<PolicyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.post<{ success: boolean; data: PolicyDocument }>(
      `/policy/${policyId}/document`,
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
    policyId: string,
    documentId: string,
    file: File,
    documentType: 'POLICY_DOCUMENT' | 'RECEIPT' | 'OTHER',
    documentName?: string
  ): Promise<PolicyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const response = await api.put<{ success: boolean; data: PolicyDocument }>(
      `/policy/${policyId}/document/${documentId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async getDocuments(policyId: string): Promise<PolicyDocument[]> {
    const response = await api.get<{ success: boolean; data: PolicyDocument[] }>(`/policy/${policyId}/document`);
    return response.data.data;
  },

  async deleteDocument(policyId: string, documentId: string): Promise<void> {
    await api.delete(`/policy/${policyId}/document/${documentId}`);
  },
};

export const policyNomineeService = {
  async linkNominee(policyId: string, nomineeId: string, sharePercentage: number): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/policy/${policyId}/nominee`, {
      nomineeId,
      sharePercentage: sharePercentage.toString(),
    });
    return response.data.data;
  },

  async updateNomineeShare(policyId: string, nomineeId: string, sharePercentage: number): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(`/policy/${policyId}/nominee/${nomineeId}`, {
      sharePercentage: sharePercentage.toString(),
    });
    return response.data.data;
  },

  async unlinkNominee(policyId: string, nomineeId: string): Promise<void> {
    await api.delete(`/policy/${policyId}/nominee/${nomineeId}`);
  },

  async getPolicyNominees(policyId: string): Promise<{
    policyId: string;
    policyNumber: string;
    totalSharePercentage: string;
    nominees: Array<{
      id: string;
      nominee: {
        id: string;
        name: string;
        relationship: string;
        mobileNumber?: string;
        email?: string;
        address?: string;
      };
      sharePercentage: string;
      createdAt: string;
    }>;
  }> {
    const response = await api.get<{ success: boolean; data: any }>(`/policy/${policyId}`);
    return response.data.data;
  },
};

export const companyService = {
  async getCompanies(): Promise<InsuranceCompany[]> {
    const response = await api.get<{ success: boolean; data: InsuranceCompany[] }>('/companies');
    return response.data.data;
  },
};

