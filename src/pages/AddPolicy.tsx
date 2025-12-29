import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { policyService, policyNomineeService, companyService, policyDocumentService } from '../services/policy.service';
import { nomineeService } from '../services/nominee.service';
import { userService } from '../services/user.service';
import { InsuranceCompany, Nominee } from '../types';
import { ArrowLeft, Upload, Check, FileText, Users, Building2 } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

type Step = 1 | 2 | 3;

export default function AddPolicy() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [policyId, setPolicyId] = useState<string>('');
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const { checking: subscriptionChecking } = useRequireActiveSubscription();
  const [kycChecking, setKycChecking] = useState(true);
  const [kycReady, setKycReady] = useState(false);

  // Step 1: Policy Details
  const [formData, setFormData] = useState({
    insuranceCompanyId: '',
    policyNumber: '',
    sumAssured: '',
  });

  // Step 2: Documents
  const [documents, setDocuments] = useState<File[]>([]);

  // Step 3: Nominees
  const [selectedNominees, setSelectedNominees] = useState<Array<{
    nomineeId: string;
    sharePercentage: number;
  }>>([]);

  const saveDraftIfNeeded = async () => {
    // Only save a draft if we don't already have a policyId and there's enough data
    if (policyId) return;
    if (!formData.insuranceCompanyId) return; // backend requires company id

    const hasAnyField = formData.policyNumber.trim() || formData.sumAssured.trim();
    if (!hasAnyField) return; // nothing to save

    try {
      setSavingDraft(true);
      const payload: any = { insuranceCompanyId: formData.insuranceCompanyId };
      if (formData.policyNumber.trim()) payload.policyNumber = formData.policyNumber.trim();
      if (formData.sumAssured.trim()) payload.sumAssured = formData.sumAssured.trim();
      const policy = await policyService.createPolicy(payload);
      setPolicyId(policy.id);
    } catch (err: any) {
      console.error('Failed to auto-save draft policy', err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleBackToPolicies = async () => {
    await saveDraftIfNeeded();
    navigate('/policies');
  };

  useEffect(() => {
    // On unmount/navigation, try to persist draft if we have partial data
    return () => {
      void saveDraftIfNeeded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (subscriptionChecking) {
      return;
    }

    let isMounted = true;

    const verifyKyc = async () => {
      try {
        const status = await userService.getKycStatus();

        if (status.status !== 'COMPLETED') {
          navigate('/kyc', { replace: true });
          return;
        }

        if (isMounted) {
          setKycReady(true);
        }
      } catch (error: any) {
        console.error('Failed to verify KYC status before adding policy', error);
        if (isMounted) {
          setKycReady(true);
        }
      } finally {
        if (isMounted) {
          setKycChecking(false);
        }
      }
    };

    verifyKyc();

    return () => {
      isMounted = false;
    };
  }, [subscriptionChecking, navigate]);

  useEffect(() => {
    if (subscriptionChecking || !kycReady) {
      return;
    }
    loadCompanies();
    loadNominees();
  }, [subscriptionChecking, kycReady]);

  const loadCompanies = async () => {
    try {
      // Note: This endpoint might need to be created in the backend
      // For now, we'll handle the error gracefully
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
      // Set empty array if endpoint doesn't exist yet
      setCompanies([]);
    }
  };

  const loadNominees = async () => {
    try {
      const data = await nomineeService.getNominees();
      setNominees(data);
    } catch (err) {
      console.error('Failed to load nominees:', err);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { insuranceCompanyId: formData.insuranceCompanyId };
      if (formData.policyNumber.trim()) payload.policyNumber = formData.policyNumber.trim();
      if (formData.sumAssured.trim()) payload.sumAssured = formData.sumAssured.trim();

      const policy = await policyService.createPolicy(payload);
      setPolicyId(policy.id);
      setStep(2);
    } catch (err: any) {
      const apiError = err.response?.data;
      if (apiError?.details?.missingDocuments) {
        setError(
          `${apiError.error || 'Failed to create policy'} (Pending: ${apiError.details.missingDocuments.join(', ')})`
        );
      } else {
        setError(apiError?.error || 'Failed to create policy');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Upload all documents
      for (const file of documents) {
        await policyDocumentService.uploadDocument(
          policyId,
          file,
          'POLICY_DOCUMENT',
          file.name
        );
      }

      // Always proceed to step 3 (nominees), even if no nominees exist
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Link nominees to policy (if any selected)
      for (const selected of selectedNominees) {
        await policyNomineeService.linkNominee(policyId, selected.nomineeId, selected.sharePercentage);
      }

      // Navigate to policies page whether nominees were added or not
      navigate('/policies');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link nominees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNominee = () => {
    const totalShare = selectedNominees.reduce((sum, n) => sum + n.sharePercentage, 0);
    if (totalShare >= 100) {
      setError('Total share percentage cannot exceed 100%');
      return;
    }

    if (nominees.length === 0) {
      navigate('/nominees/add');
      return;
    }

    const availableNominees = nominees.filter(
      (n) => !selectedNominees.some((sn) => sn.nomineeId === n.id)
    );

    if (availableNominees.length === 0) {
      setError('All nominees are already added. Add more nominees first.');
      return;
    }

    setSelectedNominees([
      ...selectedNominees,
      { nomineeId: availableNominees[0].id, sharePercentage: 0 },
    ]);
  };

  const handleRemoveNominee = (index: number) => {
    setSelectedNominees(selectedNominees.filter((_, i) => i !== index));
  };

  const handleShareChange = (index: number, share: number) => {
    const updated = [...selectedNominees];
    updated[index].sharePercentage = Math.max(0, Math.min(100, share));
    setSelectedNominees(updated);
  };

  const totalShare = selectedNominees.reduce((sum, n) => sum + n.sharePercentage, 0);

  if (subscriptionChecking || kycChecking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={handleBackToPolicies}
        disabled={savingDraft}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 disabled:opacity-60"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Policies
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Add Policy</h1>
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
              <div className="w-12 h-1 bg-gray-200">
                <div className={`h-full ${step >= 3 ? 'bg-brand-600' : ''}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step > 3 ? <Check className="w-5 h-5" /> : '3'}
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            Step {step} of 3: {step === 1 ? 'Fill Policy Details' : step === 2 ? 'Upload Policy Documents' : 'Select Nominees + Share %'}
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
              <label htmlFor="insuranceCompanyId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Insurance Company *
              </label>
              {companies.length === 0 ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mb-3">
                    No insurance companies are available yet. Please contact support or try again later.
                  </div>
                  <select
                    id="insuranceCompanyId"
                    value=""
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">No companies available</option>
                  </select>
                </div>
              ) : (
                <select
                  id="insuranceCompanyId"
                  value={formData.insuranceCompanyId}
                  onChange={(e) => setFormData({ ...formData, insuranceCompanyId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                >
                  <option value="">Select Insurance Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Policy Number (optional)
              </label>
              <input
                id="policyNumber"
                type="text"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter policy number"
              />
            </div>

            <div>
              <label htmlFor="sumAssured" className="block text-sm font-medium text-gray-700 mb-2">
                Sum Assured (optional)
              </label>
              <input
                id="sumAssured"
                type="number"
                value={formData.sumAssured}
                onChange={(e) => setFormData({ ...formData, sumAssured: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter sum assured amount"
              />
            </div>

            <button
              type="submit"
              disabled={loading || companies.length === 0}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : 'Next: Upload Documents'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Documents
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500">
                      <span>Upload files</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                  {documents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {documents.map((doc, index) => (
                        <p key={index} className="text-sm text-green-600">{doc.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                {loading
                  ? 'Saving...'
                  : documents.length > 0
                  ? 'Next: Select Nominees'
                  : 'Skip Documents & Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Select Nominees and Share Percentage (Optional)
                </label>
                {nominees.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddNominee}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Nominee
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                You can add nominees now or skip this step and add them later. Policies without nominees will remain in draft status.
              </p>

              {nominees.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-800 mb-4">No nominees found. You can add nominees later or skip this step.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => navigate('/nominees/add')}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                    >
                      Add Nominee Now
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              ) : selectedNominees.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 mb-4">No nominees selected</p>
                  <button
                    type="button"
                    onClick={handleAddNominee}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                  >
                    Add Nominee
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedNominees.map((selected, index) => {
                    const nominee = nominees.find((n) => n.id === selected.nomineeId);
                    const availableNominees = nominees.filter(
                      (n) => !selectedNominees.some((sn, i) => i !== index && sn.nomineeId === n.id)
                    );

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <select
                            value={selected.nomineeId}
                            onChange={(e) => {
                              const updated = [...selectedNominees];
                              updated[index].nomineeId = e.target.value;
                              setSelectedNominees(updated);
                            }}
                            className="flex-1 mr-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          >
                            {nominee && <option value={nominee.id}>{nominee.name} ({nominee.relationship})</option>}
                            {availableNominees.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.name} ({n.relationship})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveNominee(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Share Percentage (%)</label>
                          <input
                            type="number"
                            value={selected.sharePercentage}
                            onChange={(e) => handleShareChange(index, parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Share:</span>
                      <span className={`font-bold text-lg ${totalShare === 100 ? 'text-green-600' : totalShare > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                        {totalShare.toFixed(2)}%
                      </span>
                    </div>
                    {totalShare !== 100 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {totalShare < 100
                          ? `Remaining: ${(100 - totalShare).toFixed(2)}%`
                          : 'Total share cannot exceed 100%'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : selectedNominees.length > 0 ? (totalShare === 100 ? 'Complete' : 'Save & Continue') : 'Skip Nominees & Complete'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

