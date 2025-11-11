import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, userService } from '../services/user.service';
import { KycStatus } from '../types';
import { Upload, Check, CreditCard, FileText, ArrowLeft, CheckCircle, Clock, ExternalLink, Edit2, X, RotateCcw } from 'lucide-react';

export default function KYC() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documents, setDocuments] = useState<{
    aadhaar: File | null;
    pan: File | null;
  }>({
    aadhaar: null,
    pan: null,
  });
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycComplete, setKycComplete] = useState(false);
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);
  const [updateFiles, setUpdateFiles] = useState<{ [key: string]: File | null }>({});

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const status = await userService.getKycStatus();
      setKycStatus(status);
      setKycComplete(status.status === 'COMPLETED');
    } catch (error) {
      console.error('Error checking KYC status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (documents.aadhaar) {
        await documentService.uploadDocument(documents.aadhaar, 'AADHAAR', documents.aadhaar.name);
      }

      if (documents.pan) {
        await documentService.uploadDocument(documents.pan, 'PAN', documents.pan.name);
      }

      setSuccess('Documents uploaded successfully. Please wait for verification.');
      setDocuments({ aadhaar: null, pan: null });
      await checkKYCStatus();
      
      // Redirect to homepage after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUpdateDocument = async (documentId: string, documentType: 'AADHAAR' | 'PAN', file: File) => {
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
      await checkKYCStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const renderDocumentRow = (type: 'AADHAAR' | 'PAN') => {
    if (!kycStatus) {
      return null;
    }

    const doc = kycStatus.documents.find((d) => d.documentType === type);
    if (!doc) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-800">{type}</p>
              <p className="text-sm text-gray-500">Not uploaded</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
            Missing
          </span>
        </div>
      );
    }

    const isUpdating = updatingDocument === doc.id;
    const hasUpdateFile = updateFiles[doc.id] !== null && updateFiles[doc.id] !== undefined;
    
    // Determine status: Verified, Re-verification, or Pending
    const isReverification = !doc.isVerified && doc.verifiedAt !== null && doc.verifiedAt !== undefined;
    const statusBadge = doc.isVerified ? (
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
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800">{doc.documentName || type}</p>
                  {statusBadge}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded {formatDate(doc.uploadedAt)}
                </p>
                {doc.isVerified && doc.verifiedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Verified on {formatDate(doc.verifiedAt)}
                  </p>
                )}
                {isReverification && doc.verifiedAt && (
                  <p className="text-xs text-orange-600 mt-1">
                    Previously verified on {formatDate(doc.verifiedAt)} • Awaiting re-verification
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <a
              href={getDocumentUrl(doc.documentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              title="View document"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Update Document Section */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          {!hasUpdateFile ? (
            <label className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
              <Edit2 className="w-4 h-4" />
              <span>Replace Document</span>
              <input
                type="file"
                className="sr-only"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUpdateFiles({ ...updateFiles, [doc.id]: file });
                  setError('');
                }}
              />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  New file: {updateFiles[doc.id]?.name}
                </span>
                <button
                  onClick={() => setUpdateFiles({ ...updateFiles, [doc.id]: null })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (updateFiles[doc.id]) {
                      handleUpdateDocument(doc.id, doc.documentType as 'AADHAAR' | 'PAN', updateFiles[doc.id]!);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Document'}
                </button>
                <button
                  onClick={() => setUpdateFiles({ ...updateFiles, [doc.id]: null })}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-yellow-600">
                Note: Updating this document will reset verification status. Admin verification will be required.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (kycComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">KYC Completed</h1>
          <p className="text-gray-600 mb-8">
            Your KYC verification is complete. You can now proceed to add policies.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Homepage
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete KYC</h1>
          <p className="text-gray-600">
            Please upload your Aadhaar and PAN documents to complete KYC verification
          </p>
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

        {/* Existing Documents Status */}
        <div className="mb-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Uploaded Documents</h3>
          <div className="space-y-3">
            {renderDocumentRow('AADHAAR')}
            {renderDocumentRow('PAN')}
            {kycStatus && kycStatus.documents.length === 0 && (
              <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600 text-sm border border-gray-200">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No documents uploaded yet. Please upload your Aadhaar and PAN documents below.</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Aadhaar Card
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf,.doc,.docx,.docm,.dotx"
                      onChange={(e) => setDocuments({ ...documents, aadhaar: e.target.files?.[0] || null })}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                {documents.aadhaar && (
                  <p className="text-sm text-green-600 mt-2">{documents.aadhaar.name}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              PAN Card
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf,.doc,.docx,.docm,.dotx"
                      onChange={(e) => setDocuments({ ...documents, pan: e.target.files?.[0] || null })}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                {documents.pan && (
                  <p className="text-sm text-green-600 mt-2">{documents.pan.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!documents.aadhaar && !documents.pan)}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>
      </div>
    </div>
  );
}

