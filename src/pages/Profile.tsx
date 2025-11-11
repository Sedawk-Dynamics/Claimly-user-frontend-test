import { useState, useEffect } from 'react';
import { userService, documentService } from '../services/user.service';
import { policyService, policyDocumentService } from '../services/policy.service';
import { nomineeService, nomineeDocumentService } from '../services/nominee.service';
import { User, UserDocument, Policy, Nominee } from '../types';
import { User as UserIcon, Mail, Phone, Calendar, Save, FileText, CheckCircle, Clock, ExternalLink, Edit2, X, RotateCcw } from 'lucide-react';
import KycSection from '../components/KycSection';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function Profile() {
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
  const { checking } = useRequireActiveSubscription();

  useEffect(() => {
    if (checking) {
      return;
    }
    loadProfile();
    loadAllDocuments();
  }, [checking]);

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

  const handleUpdatePolicyDocument = async (policyId: string, documentId: string, documentType: 'POLICY_COPY' | 'RECEIPT' | 'OTHER', file: File) => {
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

  const handleUpdateNomineeDocument = async (nomineeId: string, documentId: string, documentType: 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'DEATH_CERTIFICATE' | 'OTHER', file: File) => {
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

  if (checking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
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
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.mobileNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900">{user?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Mobile Number
              </label>
              <p className="text-gray-900">{user?.mobileNumber}</p>
              <p className="text-sm text-gray-500 mt-1">Mobile number cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900">{user?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date of Birth
              </label>
              {editing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              ) : (
                <p className="text-gray-900">
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
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
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
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
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
                    
                    // Determine status: Verified, Re-verification, or Pending
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
            {policies.length > 0 && policies.some((p) => p.documents && p.documents.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Policy Documents</h3>
                <div className="space-y-4">
                  {policies.map((policy) =>
                    policy.documents && policy.documents.length > 0 ? (
                      <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Policy #{policy.policyNumber} - {policy.insuranceCompany.name}
                        </p>
                        <div className="space-y-2">
                          {policy.documents.map((document) => {
                            const isUpdating = updatingDocument === document.id;
                            const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
                            
                            // Determine status: Verified, Re-verification, or Pending
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
                                      <p className="text-xs text-green-600 mt-1">
                                        Verified on {formatDate(document.verifiedAt)}
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
                                              handleUpdatePolicyDocument(policy.id, document.id, document.documentType as 'POLICY_COPY' | 'RECEIPT' | 'OTHER', updateFiles[document.id]!);
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
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Nominee Documents */}
            {nominees.length > 0 && nominees.some((n) => n.documents && n.documents.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Nominee Documents</h3>
                <div className="space-y-4">
                  {nominees.map((nominee) =>
                    nominee.documents && nominee.documents.length > 0 ? (
                      <div key={nominee.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {nominee.name} ({formatEnumLabel(nominee.relationship)})
                        </p>
                        <div className="space-y-2">
                          {nominee.documents.map((document) => {
                            const isUpdating = updatingDocument === document.id;
                            const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
                            
                            // Determine status: Verified, Re-verification, or Pending
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
                                      <p className="text-xs text-green-600 mt-1">
                                        Verified on {formatDate(document.verifiedAt)}
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
                                              handleUpdateNomineeDocument(nominee.id, document.id, document.documentType as 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'DEATH_CERTIFICATE' | 'OTHER', updateFiles[document.id]!);
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
                    ) : null
                  )}
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
    </div>
  );
}

