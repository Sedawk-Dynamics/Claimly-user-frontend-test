import { useEffect, useState } from 'react';
import { documentService, userService } from '../services/user.service';
import { KycStatus } from '../types';
import { CheckCircle, Clock, Upload, RefreshCw, AlertTriangle, ExternalLink, FileText, Edit2, X, RotateCcw, XCircle } from 'lucide-react';

type UploadState = {
  aadhaar: File | null;
  pan: File | null;
};

export default function KycSection() {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploads, setUploads] = useState<UploadState>({ aadhaar: null, pan: null });
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);
  const [updateFiles, setUpdateFiles] = useState<{ [key: string]: File | null }>({});

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoadingStatus(true);
    setError('');
    try {
      const status = await userService.getKycStatus();
      setKycStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load KYC status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleUpload = async () => {
    if (!uploads.aadhaar && !uploads.pan) {
      setError('Please choose Aadhaar and/or PAN files to upload.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);
    try {
      if (uploads.aadhaar) {
        await documentService.uploadDocument(uploads.aadhaar, 'AADHAAR', uploads.aadhaar.name);
      }
      if (uploads.pan) {
        await documentService.uploadDocument(uploads.pan, 'PAN', uploads.pan.name);
      }
      setUploads({ aadhaar: null, pan: null });
      setSuccess('Documents uploaded successfully. Verification may take some time.');
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
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
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const statusBadge = () => {
    if (!kycStatus || kycStatus.status === 'PENDING') {
      return (
        <span className="badge badge-warning">
          <Clock className="w-4 h-4 mr-2" />
          Pending Verification
        </span>
      );
    }

    return (
      <span className="badge badge-success">
        <CheckCircle className="w-4 h-4 mr-2" />
        KYC Completed
      </span>
    );
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

  const renderDocumentRow = (label: 'AADHAAR' | 'PAN') => {
    if (!kycStatus) {
      return null;
    }

    const doc = kycStatus.documents.find((d) => d.documentType === label);
    if (!doc) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-800">{label}</p>
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
    
    // Determine status: Verified, Re-verification, Rejected, or Pending
    const isReverification = !doc.isVerified && doc.verifiedAt !== null && doc.verifiedAt !== undefined;
    const isRejected = doc.rejectedAt !== null && doc.rejectedAt !== undefined;
    const statusBadge = doc.isVerified ? (
      <span className="badge badge-success">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </span>
    ) : isRejected ? (
      <span className="badge badge-danger">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </span>
    ) : isReverification ? (
      <span className="badge badge-danger">
        <RotateCcw className="w-3 h-3 mr-1" />
        Re-verification
      </span>
    ) : (
      <span className="badge badge-warning">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );

    return (
      <div className="p-3 bg-white dark:bg-navy-800/50 border border-gray-200 dark:border-navy-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand-600 dark:text-cyan-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 dark:text-white">{doc.documentName || label}</p>
                  {statusBadge}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploaded {formatDate(doc.uploadedAt)}
                </p>
                {doc.isVerified && doc.verifiedAt && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                    Verified on {formatDate(doc.verifiedAt)}
                  </p>
                )}
                {isRejected && doc.rejectedAt && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Rejected on {formatDate(doc.rejectedAt)} • Please upload a new document
                  </p>
                )}
                {isReverification && doc.verifiedAt && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
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
              className="inline-flex items-center text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-semibold"
              title="View document"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Update Document Section */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          {!hasUpdateFile ? (
            <label className="flex items-center gap-2 text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 cursor-pointer font-semibold">
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
                  className="px-3 py-1.5 text-xs btn-brand transition disabled:opacity-50"
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

  return (
    <section className="card p-6 sm:p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
            KYC Verification
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload your Aadhaar and PAN documents to verify your identity.
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="inline-flex items-center text-sm font-semibold text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 transition-colors"
          disabled={loadingStatus}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingStatus ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {statusBadge()}

      {error && (
        <div className="mt-4 bg-orange-500/20 border-2 border-orange-400 backdrop-blur-sm text-orange-900 dark:text-orange-200 px-4 py-3 rounded-lg text-sm shadow-glow-orange">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-cyan-500/20 border-2 border-cyan-400 backdrop-blur-sm text-cyan-900 dark:text-cyan-200 px-4 py-3 rounded-lg text-sm shadow-glow-cyan">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h3>
          {loadingStatus ? (
            <div className="p-6 bg-gray-50 rounded-lg text-gray-600 text-sm">
              Loading KYC details...
            </div>
          ) : (
            <div className="space-y-3">
              {renderDocumentRow('AADHAAR')}
              {renderDocumentRow('PAN')}
              {kycStatus && kycStatus.missingDocuments.length > 0 && (
                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>
                    Pending: {kycStatus.missingDocuments.join(', ')}. Upload the remaining document(s) to complete KYC.
                  </span>
                </div>
              )}
              {kycStatus && kycStatus.documents.length === 0 && (
                <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No documents uploaded yet. Please upload your Aadhaar and PAN documents below.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-primary-500 transition cursor-pointer">
            <Upload className="w-6 h-6 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Upload Aadhaar</span>
            <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</span>
            <input
              type="file"
              className="sr-only"
              accept="image/*,.pdf"
              onChange={(e) =>
                setUploads((prev) => ({
                  ...prev,
                  aadhaar: e.target.files?.[0] || null,
                }))
              }
            />
            {uploads.aadhaar && (
              <span className="mt-2 text-xs text-primary-600">{uploads.aadhaar.name}</span>
            )}
          </label>
          <label className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-primary-500 transition cursor-pointer">
            <Upload className="w-6 h-6 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Upload PAN</span>
            <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</span>
            <input
              type="file"
              className="sr-only"
              accept="image/*,.pdf"
              onChange={(e) =>
                setUploads((prev) => ({
                  ...prev,
                  pan: e.target.files?.[0] || null,
                }))
              }
            />
            {uploads.pan && (
              <span className="mt-2 text-xs text-primary-600">{uploads.pan.name}</span>
            )}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 btn-brand inline-flex items-center justify-center"
        >
          {uploading ? 'Uploading...' : 'Submit Documents'}
        </button>
      </div>
    </section>
  );
}


