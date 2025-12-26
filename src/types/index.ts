export interface User {
  id: string;
  name: string;
  dob: string | null;
  email?: string;
  mobileNumber: string;
  deviceId?: string;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  referralCode?: string | null;
  walletBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Subscription {
  id: string;
  planName: string;
  amount: string;
  paymentId: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionDate: string;
  expiresAt?: string | null;
  walletAmountUsed?: string;
  receiptUrl?: string | null;
}

export interface SubscriptionStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  subscription?: Subscription;
}

export interface Nominee {
  id: string;
  name: string;
  relationship: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';
  mobileNumber: string;
  dob: string | null;
  email?: string;
  address?: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  documents?: NomineeDocument[];
  documentsCount?: number;
  verifiedDocumentsCount?: number;
  isVerified?: boolean;
  policies?: Array<{
    policyId: string;
    policyNumber: string;
    sumAssured: string;
    sharePercentage: string;
  }>;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  contactEmail?: string;
  contactNumber?: string;
  websiteUrl?: string;
  address?: string;
}

export interface Policy {
  id: string;
  insuranceCompany: InsuranceCompany;
  policyNumber: string;
  sumAssured: string;
  // Policy lifecycle statuses from backend
  // DRAFT: user created but incomplete
  // PENDING: all data/documents present, awaiting admin review
  // ACCEPTED: admin accepted the policy
  // REJECTED: admin rejected the policy
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  uploadedAt: string;
  nominees: Array<{
    id: string;
    nominee: {
      id: string;
      name: string;
      relationship: string;
      dob?: string | null;
      status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    };
    sharePercentage: string;
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    documentName: string;
    documentUrl: string;
    isVerified: boolean;
    uploadedAt: string;
    verifiedAt?: string | null;
    rejectedAt?: string | null;
  }>;
}

export interface UserDocument {
  id: string;
  documentType: 'AADHAAR' | 'PAN' | 'OTHER';
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface KycStatus {
  status: 'COMPLETED' | 'PENDING';
  hasAadhaar: boolean;
  hasPan: boolean;
  missingDocuments: Array<'AADHAAR' | 'PAN'>;
  documents: UserDocument[];
}

export interface NomineeDocument {
  id: string;
  documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'OTHER';
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface PolicyDocument {
  id: string;
  documentType: 'POLICY_COPY' | 'RECEIPT' | 'OTHER';
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string;
}

