import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nomineeService, nomineeDocumentService } from '../services/nominee.service';
import { ArrowLeft, Upload, Check } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

type Step = 1 | 2;

export default function AddNominee() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [nomineeId, setNomineeId] = useState<string>('');
  const { checking } = useRequireActiveSubscription();

  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    name: '',
    relationship: '' as '' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER',
    mobileNumber: '',
    dob: '',
    email: '',
    address: '',
  });

  // Step 2: Documents
  const [documents, setDocuments] = useState<{
    nomineeId: File | null;
    addressProof: File | null;
  }>({
    nomineeId: null,
    addressProof: null,
  });

  const saveDraftIfNeeded = async () => {
    if (nomineeId) return;
    if (!formData.name.trim()) return; // backend needs at least a name

    try {
      setSavingDraft(true);
      const nominee = await nomineeService.createNominee({
        name: formData.name.trim(),
        relationship: formData.relationship || undefined,
        mobileNumber: formData.mobileNumber || undefined,
        dob: formData.dob || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });
      setNomineeId(nominee.id);
    } catch (err: any) {
      console.error('Failed to auto-save nominee draft', err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleBackToList = async () => {
    await saveDraftIfNeeded();
    navigate('/nominees');
  };

  useEffect(() => {
    // On unmount/navigation, try to persist draft if we have partial data
    return () => {
      void saveDraftIfNeeded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nominee = await nomineeService.createNominee({
        name: formData.name,
        relationship: formData.relationship || undefined,
        mobileNumber: formData.mobileNumber || undefined,
        dob: formData.dob || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });
      setNomineeId(nominee.id);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create nominee');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Upload documents if provided
      const uploadPromises = [];
      
      if (documents.nomineeId) {
        uploadPromises.push(
          nomineeDocumentService.uploadDocument(
            nomineeId,
            documents.nomineeId,
            'NOMINEE_ID',
            documents.nomineeId.name
          )
        );
      }

      if (documents.addressProof) {
        uploadPromises.push(
          nomineeDocumentService.uploadDocument(
            nomineeId,
            documents.addressProof,
            'ADDRESS_PROOF',
            documents.addressProof.name
          )
        );
      }

      // Wait for all uploads to complete (if any)
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // Navigate even if no documents were uploaded (documents are optional)
      navigate('/nominees');
    } catch (err: any) {
      console.error('Error uploading documents:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={handleBackToList}
        disabled={savingDraft}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 disabled:opacity-60"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Nominees
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Add Nominee</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <div className="w-12 h-1 bg-gray-200">
                <div className={`h-full ${step >= 2 ? 'bg-brand-600' : ''}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            Step {step} of 2: {step === 1 ? 'Nominee Basic Info' : 'Upload Nominee Documents'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter nominee name"
              />
            </div>

            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                Relationship (optional)
              </label>
              <select
                id="relationship"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              >
                <option value="">Select relationship (optional)</option>
                <option value="SPOUSE">Spouse</option>
                <option value="CHILD">Child</option>
                <option value="PARENT">Parent</option>
                <option value="SIBLING">Sibling</option>
                <option value="FRIEND">Friend</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number (optional)
              </label>
              <input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth (optional)
              </label>
              <input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="nominee@example.com"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address (Optional)
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : 'Next: Upload Documents'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <label htmlFor="nomineeIdDoc" className="block text-sm font-medium text-gray-700 mb-2">
                Nominee ID Document (Optional)
              </label>
              <label
                htmlFor="nomineeIdDoc"
                className="mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-brand-400 transition-colors cursor-pointer"
              >
                <div className="space-y-1 text-center w-full">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center items-center">
                    <span className="font-medium text-brand-600 hover:text-brand-500">Click to upload a file</span>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  {documents.nomineeId && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 font-medium">{documents.nomineeId.name}</p>
                      <p className="text-xs text-gray-500">{(documents.nomineeId.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="nomineeIdDoc"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      setDocuments({ ...documents, nomineeId: file });
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label htmlFor="addressProofDoc" className="block text-sm font-medium text-gray-700 mb-2">
                Address Proof Document (Optional)
              </label>
              <label
                htmlFor="addressProofDoc"
                className="mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-brand-400 transition-colors cursor-pointer"
              >
                <div className="space-y-1 text-center w-full">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center items-center">
                    <span className="font-medium text-brand-600 hover:text-brand-500">Click to upload a file</span>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  {documents.addressProof && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 font-medium">{documents.addressProof.name}</p>
                      <p className="text-xs text-gray-500">{(documents.addressProof.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="addressProofDoc"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      setDocuments({ ...documents, addressProof: file });
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Uploading...' : 'Complete'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

