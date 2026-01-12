import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, documentService } from '../services/user.service';
import { policyService, policyDocumentService } from '../services/policy.service';
import { nomineeService, nomineeDocumentService } from '../services/nominee.service';
import { User, UserDocument, Policy, Nominee, NomineeDocument } from '../types';
import { User as UserIcon, Mail, Phone, Calendar, Save, FileText, CheckCircle, Clock, ExternalLink, Edit2, X, RotateCcw, Gift, Copy, Check, Wallet, TrendingUp, XCircle, Upload, Camera } from 'lucide-react';
import KycSection from '../components/KycSection';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { walletService } from '../services/wallet.service';
import { WalletTransaction } from '../types/wallet';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
  });
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);
  const [updateFiles, setUpdateFiles] = useState<{ [key: string]: File | null }>({});
  const [generatingReferralCode, setGeneratingReferralCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [showWalletHistory, setShowWalletHistory] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const { subscription, checking: checkingSubscription } = useSubscriptionStatus();
  const hasActiveSubscription = subscription?.status === 'ACTIVE';
  const policiesWithDocuments = policies.filter((policy) => policy.documents && policy.documents.length > 0);
  const nomineesWithDocuments = nominees.filter((nominee) => nominee.documents && nominee.documents.length > 0);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (checkingSubscription || !hasActiveSubscription) {
      return;
    }
    loadAllDocuments();
  }, [checkingSubscription, hasActiveSubscription]);

  useEffect(() => {
    if (!showWalletHistory) {
      return;
    }
    loadWalletTransactions();
  }, [showWalletHistory]);

  const loadWalletTransactions = async () => {
    try {
      setLoadingWallet(true);
      const transactions = await walletService.getTransactions();
      setWalletTransactions(transactions);
    } catch (err: any) {
      console.error('Failed to load wallet transactions', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  const loadAllDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const [docs, policiesData, nomineesData] = await Promise.all([
        documentService.getDocuments(),
        policyService.getPolicies(),
        nomineeService.getNominees(),
      ]);
      setUserDocuments(docs);
      setPolicies(policiesData);
      setNominees(nomineesData);
    } catch (err: any) {
      console.error('Failed to load documents', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEnumLabel = (value: string) => {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDocumentUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const getProfilePictureUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingProfilePicture(true);

    try {
      const updated = await userService.uploadProfilePicture(file);
      setUser(updated);
      setSuccess('Profile picture updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingProfilePicture(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await userService.getProfile();
      setUser(profile);
      setFormData({
        name: profile.name,
        email: profile.email || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
      });
    } catch (error: any) {
      console.error('Failed to load profile', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updated = await userService.updateProfile(formData);
      setUser(updated);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserDocument = async (documentId: string, documentType: 'AADHAAR' | 'PAN' | 'OTHER', file: File) => {
    if (!file) {
      setError('Please select a file to update.');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingDocument(documentId);
    try {
      await documentService.updateDocument(documentId, file, documentType, file.name);
      setUpdateFiles({ ...updateFiles, [documentId]: null });
      setSuccess('Document updated successfully. Please wait for admin verification.');
      await loadAllDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const handleUpdatePolicyDocument = async (policyId: string, documentId: string, documentType: 'POLICY_DOCUMENT' | 'RECEIPT' | 'OTHER', file: File) => {
    if (!file) {
      setError('Please select a file to update.');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingDocument(documentId);
    try {
      await policyDocumentService.updateDocument(policyId, documentId, file, documentType, file.name);
      setUpdateFiles({ ...updateFiles, [documentId]: null });
      setSuccess('Document updated successfully. Please wait for admin verification.');
      await loadAllDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const handleUpdateNomineeDocument = async (nomineeId: string, documentId: string, documentType: 'NOMINEE_PAN' | 'NOMINEE_AADHAAR' | 'OTHER', file: File) => {
    if (!file) {
      setError('Please select a file to update.');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingDocument(documentId);
    try {
      await nomineeDocumentService.updateDocument(nomineeId, documentId, file, documentType, file.name);
      setUpdateFiles({ ...updateFiles, [documentId]: null });
      setSuccess('Document updated successfully. Please wait for admin verification.');
      await loadAllDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const renderPolicyDocumentRow = (policyId: string, document: Policy['documents'][number]) => {
    const isUpdating = updatingDocument === document.id;
    const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
    const isReverification = !document.isVerified && document.verifiedAt !== null && document.verifiedAt !== undefined;
    const statusBadge = document.isVerified ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </span>
    ) : isReverification ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        <RotateCcw className="w-3 h-3 mr-1" />
        Re-verification
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );

    return (
      <div key={document.id} className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900">{document.documentName}</p>
              {statusBadge}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
            </p>
            {document.isVerified && document.verifiedAt && (
              <p className="text-xs text-green-600 mt-1">Verified on {formatDate(document.verifiedAt)}</p>
            )}
            {isReverification && document.verifiedAt && (
              <p className="text-xs text-orange-600 mt-1">
                Previously verified on {formatDate(document.verifiedAt)} • Awaiting re-verification
              </p>
            )}
          </div>
          <a
            href={getDocumentUrl(document.documentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300">
          {!hasUpdateFile ? (
            <label className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
              <Edit2 className="w-3 h-3" />
              <span>Replace</span>
              <input
                type="file"
                className="sr-only"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUpdateFiles({ ...updateFiles, [document.id]: file });
                  setError('');
                }}
              />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{updateFiles[document.id]?.name}</span>
                <button onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })} className="text-xs text-gray-500 hover:text-gray-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (updateFiles[document.id]) {
                      handleUpdatePolicyDocument(policyId, document.id, document.documentType as 'POLICY_DOCUMENT' | 'RECEIPT' | 'OTHER', updateFiles[document.id]!);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNomineeDocumentRow = (nomineeId: string, document: NomineeDocument) => {
    const isUpdating = updatingDocument === document.id;
    const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
    const isReverification = !document.isVerified && document.verifiedAt !== null && document.verifiedAt !== undefined;
    const statusBadge = document.isVerified ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </span>
    ) : isReverification ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        <RotateCcw className="w-3 h-3 mr-1" />
        Re-verification
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );

    return (
      <div key={document.id} className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900">{document.documentName}</p>
              {statusBadge}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
            </p>
            {document.isVerified && document.verifiedAt && (
              <p className="text-xs text-green-600 mt-1">Verified on {formatDate(document.verifiedAt)}</p>
            )}
            {isReverification && document.verifiedAt && (
              <p className="text-xs text-orange-600 mt-1">
                Previously verified on {formatDate(document.verifiedAt)} • Awaiting re-verification
              </p>
            )}
          </div>
          <a
            href={getDocumentUrl(document.documentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300">
          {!hasUpdateFile ? (
            <label className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
              <Edit2 className="w-3 h-3" />
              <span>Replace</span>
              <input
                type="file"
                className="sr-only"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUpdateFiles({ ...updateFiles, [document.id]: file });
                  setError('');
                }}
              />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">{updateFiles[document.id]?.name}</span>
                <button onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })} className="text-xs text-gray-500 hover:text-gray-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (updateFiles[document.id]) {
                      handleUpdateNomineeDocument(nomineeId, document.id, document.documentType as 'NOMINEE_PAN' | 'NOMINEE_AADHAAR' | 'OTHER', updateFiles[document.id]!);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (checkingSubscription || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 dark:border-brand-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition shadow-md hover:shadow-lg"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.profilePicture ? (
                <img
                  src={getProfilePictureUrl(user.profilePicture) || ''}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-200 dark:border-brand-700"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-full p-2 cursor-pointer shadow-lg hover:shadow-xl transition-all">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingProfilePicture}
                />
              </label>
              {uploadingProfilePicture && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{user?.mobileNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                Mobile Number
              </label>
              <p className="text-gray-900 dark:text-white font-medium">{user?.mobileNumber}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mobile number cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">{user?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
                Date of Birth
              </label>
              {editing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    dob: user?.dob ? user.dob.split('T')[0] : '',
                  });
                  setError('');
                  setSuccess('');
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Gift className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
          My Referral Code
        </h2>
        
        <div className="bg-gradient-to-r from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 rounded-lg p-6 border-2 border-brand-200 dark:border-brand-700">
          {user?.referralCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Referral Code
                  </label>
                  <div className="flex items-center space-x-3 flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border-2 border-brand-300 dark:border-brand-600">
                      <code className="text-2xl font-bold tracking-wider block text-brand-700 dark:text-brand-400">
                        {user.referralCode}
                      </code>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(user.referralCode!);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy', err);
                        }
                      }}
                      className="px-4 py-3 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium shadow-md hover:shadow-lg whitespace-nowrap"
                      title="Copy referral code"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share this code with your friends! When they sign up using your referral code, and they take subscription you will get 10% in your wallet.
                </p>
              </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                You don't have a referral code yet. Generate one to start referring friends!
              </p>
              <button
                onClick={async () => {
                  setGeneratingReferralCode(true);
                  setError('');
                  try {
                    await userService.generateReferralCode();
                    await loadProfile(); // Reload profile to get the new code
                    setSuccess('Referral code generated successfully!');
                  } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to generate referral code');
                  } finally {
                    setGeneratingReferralCode(false);
                  }
                }}
                disabled={generatingReferralCode}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generatingReferralCode ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Generate Referral Code</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
          My Wallet
        </h2>
        
        <div className="bg-gradient-to-r from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 rounded-lg p-6 border-2 border-brand-200 dark:border-brand-700 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-400">₹{user?.walletBalance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-4 bg-brand-600 dark:bg-brand-500 rounded-full">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
            Earn rewards when your referrals subscribe! Use your wallet balance to pay for your own subscription.
          </p>
          {user?.walletBalance && user.walletBalance > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-200 dark:border-brand-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                <strong>How to use your wallet:</strong> When purchasing a subscription, you can choose to use your wallet balance to reduce the payment amount.
              </p>
              <button
                onClick={() => navigate('/subscription-offering')}
                className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
              >
                <Gift className="w-4 h-4 mr-2" />
                Use Wallet for Subscription
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-brand-600" />
              Transaction History
            </h3>
            <button
              onClick={() => setShowWalletHistory(!showWalletHistory)}
              className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              {showWalletHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
          {showWalletHistory && (
            <>
              {loadingWallet ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              ) : walletTransactions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">No wallet transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {walletTransactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(tx.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${tx.transactionType === 'REFERRAL_REWARD' || tx.transactionType === 'REFUND' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {tx.transactionType === 'REFERRAL_REWARD' || tx.transactionType === 'REFUND' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {hasActiveSubscription && (
        <>
          <KycSection />
          
          {/* All Documents Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              All Documents
            </h2>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Documents */}
                {userDocuments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">My Documents</h3>
                    <div className="space-y-2">
                      {userDocuments.map((document) => {
                    const isUpdating = updatingDocument === document.id;
                    const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
                    
                    // Determine status: Verified, Rejected, Re-verification, or Pending
                    const isRejected = document.rejectedAt !== null && document.rejectedAt !== undefined && document.rejectedAt !== '';
                    const isReverification = !document.isVerified && document.verifiedAt !== null && document.verifiedAt !== undefined && !isRejected;
                    const statusBadge = document.isVerified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </span>
                    ) : isReverification ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Re-verification
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    );
                    
                    return (
                      <div key={document.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{document.documentName}</p>
                              {statusBadge}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                            </p>
                            {document.isVerified && document.verifiedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Verified on {formatDate(document.verifiedAt)}
                              </p>
                            )}
                            {isRejected && document.rejectedAt && (
                              <p className="text-xs text-red-600 mt-1">
                                Rejected on {formatDate(document.rejectedAt)} • Please upload a new document
                              </p>
                            )}
                            {isReverification && document.verifiedAt && (
                              <p className="text-xs text-orange-600 mt-1">
                                Previously verified on {formatDate(document.verifiedAt)} • Awaiting re-verification
                              </p>
                            )}
                          </div>
                          <a
                            href={getDocumentUrl(document.documentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          {!hasUpdateFile ? (
                            <label className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
                              <Edit2 className="w-3 h-3" />
                              <span>Replace</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setUpdateFiles({ ...updateFiles, [document.id]: file });
                                  setError('');
                                }}
                              />
                            </label>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-700">
                                  {updateFiles[document.id]?.name}
                                </span>
                                <button
                                  onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (updateFiles[document.id]) {
                                      handleUpdateUserDocument(document.id, document.documentType as 'AADHAAR' | 'PAN' | 'OTHER', updateFiles[document.id]!);
                                    }
                                  }}
                                  disabled={isUpdating}
                                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                  {isUpdating ? 'Updating...' : 'Update'}
                                </button>
                                <button
                                  onClick={() => setUpdateFiles({ ...updateFiles, [document.id]: null })}
                                  disabled={isUpdating}
                                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                      })}
                    </div>
                  </div>
                )}

                {/* Policy Documents */}
                {policiesWithDocuments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Policy Documents</h3>
                    <div className="space-y-4">
                      {policiesWithDocuments.map((policy) => {
                        const documents = policy.documents ?? [];

                        return (
                          <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              Policy #{policy.policyNumber} - {policy.insuranceCompany.name}
                            </p>
                            <div className="space-y-2">
                              {documents.map((document) => renderPolicyDocumentRow(policy.id, document))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nominee Documents */}
                {nomineesWithDocuments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Nominee Documents</h3>
                    <div className="space-y-4">
                      {nomineesWithDocuments.map((nominee) => {
                        const documents = nominee.documents ?? [];

                        return (
                          <div key={nominee.id} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {nominee.name} ({formatEnumLabel(nominee.relationship)})
                            </p>
                            <div className="space-y-2">
                              {documents.map((document) => renderNomineeDocumentRow(nominee.id, document))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {userDocuments.length === 0 &&
                  policies.every((p) => !p.documents || p.documents.length === 0) &&
                  nominees.every((n) => !n.documents || n.documents.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

