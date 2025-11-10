import { useEffect, useState } from 'react';
import { documentService, userService } from '../services/user.service';
import { KycStatus } from '../types';
import { CheckCircle, Clock, Upload, RefreshCw, AlertTriangle } from 'lucide-react';

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

  const statusBadge = () => {
    if (!kycStatus || kycStatus.status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
          <Clock className="w-4 h-4 mr-2" />
          Pending Verification
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
        <CheckCircle className="w-4 h-4 mr-2" />
        KYC Completed
      </span>
    );
  };

  const renderDocumentRow = (label: 'AADHAAR' | 'PAN') => {
    if (!kycStatus) {
      return null;
    }

    const doc = kycStatus.documents.find((d) => d.documentType === label);
    if (!doc) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">{label}</p>
            <p className="text-sm text-gray-500">Not uploaded</p>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
            Missing
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
        <div>
          <p className="font-medium text-gray-800">{doc.documentName || label}</p>
          <p className="text-xs text-gray-500">
            Uploaded {new Date(doc.uploadedAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            doc.isVerified ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {doc.isVerified ? 'Verified' : 'In Review'}
        </span>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">KYC Verification</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload your Aadhaar and PAN documents to verify your identity.
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          disabled={loadingStatus}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingStatus ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {statusBadge()}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Current Documents</h3>
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
                <AlertTriangle className="w-4 h-4 mt-0.5 mr-2" />
                <span>
                  Pending: {kycStatus.missingDocuments.join(', ')}. Upload the remaining document(s) to complete KYC.
                </span>
              </div>
            )}
          </div>
        )}
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
          className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Submit Documents'}
        </button>
      </div>
    </section>
  );
}


