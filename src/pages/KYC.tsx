import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, userService } from '../services/user.service';
import { KycStatus } from '../types';
import { Upload, Check, CreditCard, FileText, ArrowLeft } from 'lucide-react';

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

  const getDocumentStatus = (type: 'AADHAAR' | 'PAN') => {
    if (!kycStatus) {
      return { status: 'missing', text: 'Not uploaded' };
    }
    const doc = kycStatus.documents.find((d) => d.documentType === type);
    if (!doc) return { status: 'missing', text: 'Not uploaded' };
    if (doc.isVerified) return { status: 'uploaded', text: 'Uploaded' };
    return { status: 'uploaded', text: 'Uploaded' };
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
        {kycStatus && kycStatus.documents.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Document Status:</h3>
            <div className="space-y-2">
              {(['AADHAAR', 'PAN'] as const).map((type) => {
                const status = getDocumentStatus(type);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{type}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      status.status === 'uploaded'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {status.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

