import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { policyService, policyNomineeService, companyService, policyDocumentService } from '../services/policy.service';
import { nomineeService } from '../services/nominee.service';
import { InsuranceCompany, Nominee, Policy, PolicyDocument } from '../types';
import { ArrowLeft, Upload, FileText, Users, Building2, Trash2 } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function EditPolicy() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<PolicyDocument[]>([]);
  const { checking: subscriptionChecking } = useRequireActiveSubscription();

  // Policy Details
  const [formData, setFormData] = useState({
    insuranceCompanyId: '',
    policyNumber: '',
    sumAssured: '',
  });

  // New Documents to upload
  const [newDocuments, setNewDocuments] = useState<File[]>([]);

  // Nominees
  const [selectedNominees, setSelectedNominees] = useState<Array<{
    nomineeId: string;
    sharePercentage: number;
  }>>([]);

  useEffect(() => {
    if (subscriptionChecking || !id) {
      return;
    }
    loadData();
  }, [subscriptionChecking, id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');

      // Load policy, companies, nominees, and documents in parallel
      const [policyData, companiesData, nomineesData, documentsData] = await Promise.all([
        policyService.getPolicyById(id),
        companyService.getCompanies().catch(() => []),
        nomineeService.getNominees().catch(() => []),
        policyDocumentService.getDocuments(id).catch(() => []),
      ]);

      setPolicy(policyData);
      setCompanies(companiesData);
      setNominees(nomineesData);
      setExistingDocuments(documentsData);

      // Set form data from policy
      setFormData({
        insuranceCompanyId: policyData.insuranceCompany.id,
        policyNumber: policyData.policyNumber,
        sumAssured: policyData.sumAssured,
      });

      // Set existing nominees
      if (policyData.nominees && policyData.nominees.length > 0) {
        setSelectedNominees(
          policyData.nominees.map((pn) => ({
            nomineeId: pn.nominee.id,
            sharePercentage: parseFloat(pn.sharePercentage),
          }))
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load policy data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    setSaving(true);

    try {
      // Update policy details
      await policyService.updatePolicy(id, {
        insuranceCompanyId: formData.insuranceCompanyId,
        policyNumber: formData.policyNumber,
        sumAssured: formData.sumAssured,
      });

      // Upload new documents
      for (const file of newDocuments) {
        await policyDocumentService.uploadDocument(id, file, 'POLICY_COPY', file.name);
      }

      // Update nominees - get current policy nominees first
      const currentPolicyNominees = policy?.nominees || [];
      
      // Remove nominees that are no longer selected
      for (const pn of currentPolicyNominees) {
        if (!selectedNominees.some((sn) => sn.nomineeId === pn.nominee.id)) {
          await policyNomineeService.unlinkNominee(id, pn.nominee.id);
        }
      }

      // Add or update selected nominees
      for (const selected of selectedNominees) {
        const existing = currentPolicyNominees.find((pn) => pn.nominee.id === selected.nomineeId);
        if (existing) {
          // Update share if changed
          if (parseFloat(existing.sharePercentage) !== selected.sharePercentage) {
            await policyNomineeService.updateNomineeShare(id, selected.nomineeId, selected.sharePercentage);
          }
        } else {
          // Link new nominee
          await policyNomineeService.linkNominee(id, selected.nomineeId, selected.sharePercentage);
        }
      }

      navigate('/policies');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await policyDocumentService.deleteDocument(id, documentId);
      setExistingDocuments(existingDocuments.filter((doc) => doc.id !== documentId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document');
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

  if (subscriptionChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/policies')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Policies
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Policy not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/policies')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Policies
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Policy</h1>
          <p className="text-gray-600 mt-1">Update your policy details, documents, and nominees</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Policy Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Policy Details
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="insuranceCompanyId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Insurance Company *
                </label>
                {companies.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    No insurance companies are available yet.
                  </div>
                ) : (
                  <select
                    id="insuranceCompanyId"
                    value={formData.insuranceCompanyId}
                    onChange={(e) => setFormData({ ...formData, insuranceCompanyId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
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
                  Policy Number *
                </label>
                <input
                  id="policyNumber"
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="Enter policy number"
                />
              </div>

              <div>
                <label htmlFor="sumAssured" className="block text-sm font-medium text-gray-700 mb-2">
                  Sum Assured *
                </label>
                <input
                  id="sumAssured"
                  type="number"
                  value={formData.sumAssured}
                  onChange={(e) => setFormData({ ...formData, sumAssured: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="Enter sum assured amount"
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Documents
            </h2>
            
            {/* Existing Documents */}
            {existingDocuments.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Existing Documents:</p>
                {existingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-700">{doc.documentName}</span>
                      <span className="ml-2 text-xs text-gray-500">({doc.documentType})</span>
                      {doc.isVerified && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Documents (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload files</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => setNewDocuments(Array.from(e.target.files || []))}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                  {newDocuments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {newDocuments.map((doc, index) => (
                        <p key={index} className="text-sm text-green-600">{doc.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nominees Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Nominees
              </h2>
              <button
                type="button"
                onClick={handleAddNominee}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add Nominee
              </button>
            </div>

            {nominees.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 mb-4">No nominees found. Please add nominees first.</p>
                <button
                  type="button"
                  onClick={() => navigate('/nominees/add')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Add Nominee
                </button>
              </div>
            ) : selectedNominees.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-4">No nominees selected</p>
                <button
                  type="button"
                  onClick={handleAddNominee}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
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

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/policies')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (selectedNominees.length > 0 && totalShare !== 100)}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

