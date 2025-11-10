import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { policyService, policyNomineeService } from '../services/policy.service';
import { userService } from '../services/user.service';
import { nomineeService } from '../services/nominee.service';
import { Policy, Nominee } from '../types';
import { FileText, Plus, Trash2, Users, Pencil, X } from 'lucide-react';
import { format } from 'date-fns';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function Policies() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { checking } = useRequireActiveSubscription();

  const [nomineeModalOpen, setNomineeModalOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [availableNominees, setAvailableNominees] = useState<Nominee[]>([]);
  const [selectedNominees, setSelectedNominees] = useState<Array<{ nomineeId: string; sharePercentage: number }>>([]);
  const [initialPolicyNominees, setInitialPolicyNominees] = useState<
    Array<{ nomineeId: string; sharePercentage: number }>
  >([]);
  const modalTotalShare = selectedNominees.reduce((sum, item) => sum + item.sharePercentage, 0);
  const SHARE_EPSILON = 0.01;
  const canAddMoreNominees = availableNominees.some(
    (nominee) => !selectedNominees.some((sn) => sn.nomineeId === nominee.id)
  );

  const closeNomineeModal = () => {
    setNomineeModalOpen(false);
    setActivePolicy(null);
    setModalLoading(false);
    setModalSaving(false);
    setModalError('');
    setAvailableNominees([]);
    setSelectedNominees([]);
    setInitialPolicyNominees([]);
  };

  const openNomineeModal = async (policy: Policy) => {
    setActivePolicy(policy);
    setNomineeModalOpen(true);
    setModalError('');
    setModalLoading(true);

    try {
      const nominees = await nomineeService.getNominees();
      setAvailableNominees(nominees);

      let policyNomineesResponse;
      try {
        policyNomineesResponse = await policyNomineeService.getPolicyNominees(policy.id);
      } catch (err: any) {
        if (err.response?.status === 404) {
          policyNomineesResponse = {
            policyId: policy.id,
            policyNumber: policy.policyNumber,
            totalSharePercentage: '0',
            nominees: [],
          };
        } else {
          throw err;
        }
      }

      const mapped = policyNomineesResponse.nominees.map((link) => ({
        nomineeId: link.nominee.id,
        sharePercentage: parseFloat(link.sharePercentage),
      }));

      setSelectedNominees(mapped);
      setInitialPolicyNominees(mapped);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to load policy nominees');
      const existingLinks = policy.nominees.map((link) => ({
        nomineeId: link.nominee.id,
        sharePercentage: parseFloat(link.sharePercentage),
      }));
      setSelectedNominees(existingLinks);
      setInitialPolicyNominees(existingLinks);
      const fallbackNominees: Nominee[] = policy.nominees.map((link) => ({
        id: link.nominee.id,
        name: link.nominee.name,
        relationship: link.nominee.relationship as Nominee['relationship'],
        mobileNumber: '',
        email: undefined,
        address: undefined,
        createdAt: '',
        updatedAt: '',
      }));
      setAvailableNominees(fallbackNominees);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNomineeRow = () => {
    setModalError('');
    const remainingNominees = availableNominees.filter(
      (nominee) => !selectedNominees.some((sn) => sn.nomineeId === nominee.id)
    );

    if (remainingNominees.length === 0) {
      setModalError('All nominees have already been assigned to this policy.');
      return;
    }

    setSelectedNominees([
      ...selectedNominees,
      {
        nomineeId: remainingNominees[0].id,
        sharePercentage: 0,
      },
    ]);
  };

  const handleNomineeSelectionChange = (index: number, nomineeId: string) => {
    setModalError('');

    if (selectedNominees.some((sn, i) => sn.nomineeId === nomineeId && i !== index)) {
      setModalError('This nominee is already selected.');
      return;
    }

    const updated = [...selectedNominees];
    updated[index] = {
      ...updated[index],
      nomineeId,
    };
    setSelectedNominees(updated);
  };

  const handleShareChange = (index: number, value: number) => {
    setModalError('');
    const sanitized = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, parseFloat(value.toFixed(2))));
    const updated = [...selectedNominees];
    updated[index] = {
      ...updated[index],
      sharePercentage: sanitized,
    };
    setSelectedNominees(updated);
  };

  const handleRemoveNomineeRow = (index: number) => {
    setModalError('');
    setSelectedNominees(selectedNominees.filter((_, i) => i !== index));
  };

  const handleSaveNomineeShares = async () => {
    if (!activePolicy) {
      return;
    }

    setModalError('');

    if (selectedNominees.length === 0) {
      setModalError('Please assign at least one nominee.');
      return;
    }

    if (selectedNominees.some((sn) => sn.sharePercentage <= 0)) {
      setModalError('Share percentage must be greater than 0 for all nominees.');
      return;
    }

    if (Math.abs(modalTotalShare - 100) > SHARE_EPSILON) {
      setModalError('Total share percentage must equal 100%.');
      return;
    }

    setModalSaving(true);

    try {
      const initialMap = new Map(initialPolicyNominees.map((item) => [item.nomineeId, item.sharePercentage]));
      const selectedMap = new Map(selectedNominees.map((item) => [item.nomineeId, item.sharePercentage]));

      const decreases = selectedNominees.filter((item) => {
        const initial = initialMap.get(item.nomineeId);
        return initial !== undefined && item.sharePercentage < initial - SHARE_EPSILON;
      });

      const increases = selectedNominees.filter((item) => {
        const initial = initialMap.get(item.nomineeId);
        return initial !== undefined && item.sharePercentage > initial + SHARE_EPSILON;
      });

      const additions = selectedNominees.filter((item) => !initialMap.has(item.nomineeId));
      const removals = initialPolicyNominees.filter((item) => !selectedMap.has(item.nomineeId));

      for (const item of decreases) {
        await policyNomineeService.updateNomineeShare(activePolicy.id, item.nomineeId, item.sharePercentage);
      }

      for (const item of removals) {
        await policyNomineeService.unlinkNominee(activePolicy.id, item.nomineeId);
      }

      for (const item of additions) {
        await policyNomineeService.linkNominee(activePolicy.id, item.nomineeId, item.sharePercentage);
      }

      for (const item of increases) {
        await policyNomineeService.updateNomineeShare(activePolicy.id, item.nomineeId, item.sharePercentage);
      }

      await loadPolicies();
      closeNomineeModal();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to update nominees');
    } finally {
      setModalSaving(false);
    }
  };

  useEffect(() => {
    if (checking) {
      return;
    }
    loadPolicies();
  }, [checking]);

  const loadPolicies = async () => {
    try {
      const data = await policyService.getPolicies();
      setPolicies(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      await policyService.deletePolicy(id);
      setPolicies(policies.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete policy');
    }
  };

  const handleAddPolicy = async () => {
    // Check KYC status before allowing policy addition
    try {
      const status = await userService.getKycStatus();
      if (status.status !== 'COMPLETED') {
        if (
          window.confirm(
            `KYC is required to add policies. Missing: ${status.missingDocuments.join(', ')}. Do you want to complete KYC now?`
          )
        ) {
          navigate('/kyc');
        }
        return;
      }

      navigate('/policies/add');
    } catch (err) {
      // If error, proceed to add policy page anyway
      navigate('/policies/add');
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Policies</h1>
        <button
          onClick={handleAddPolicy}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Policy
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {policies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Policies</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first policy</p>
          <button
            onClick={handleAddPolicy}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Policy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{policy.policyNumber}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      policy.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{policy.insuranceCompany.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openNomineeModal(policy)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    title="Manage Nominee Shares"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Sum Assured</p>
                  <p className="font-semibold text-gray-900">₹{parseFloat(policy.sumAssured).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Uploaded</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(policy.uploadedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Nominees</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {policy.nominees.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Documents</p>
                  <p className="font-semibold text-gray-900">{policy.documents.length}</p>
                </div>
              </div>
              {policy.nominees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Nominees:</p>
                  <div className="flex flex-wrap gap-2">
                    {policy.nominees.map((pn) => (
                      <span key={pn.id} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
                        {pn.nominee.name} ({pn.sharePercentage}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nomineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage Nominee Shares</h2>
                {activePolicy && <p className="text-sm text-gray-500 mt-1">Policy: {activePolicy.policyNumber}</p>}
              </div>
              <button
                onClick={closeNomineeModal}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {modalError}
                </div>
              )}

              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : availableNominees.length === 0 && selectedNominees.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 mb-4">
                    No nominees are available yet. Add nominees before assigning shares to this policy.
                  </p>
                  <button
                    onClick={() => {
                      closeNomineeModal();
                      navigate('/nominees/add');
                    }}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Add Nominee
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Nominee Allocations</h3>
                    <button
                      type="button"
                      onClick={handleAddNomineeRow}
                      disabled={!canAddMoreNominees}
                      className={`text-sm font-medium transition ${
                        canAddMoreNominees
                          ? 'text-primary-600 hover:text-primary-700'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      + Add Nominee
                    </button>
                  </div>

                  {selectedNominees.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                      No nominees selected yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedNominees.map((selected, index) => {
                        const availableForRow = availableNominees.filter(
                          (nominee) =>
                            nominee.id === selected.nomineeId ||
                            !selectedNominees.some((sn, i) => i !== index && sn.nomineeId === nominee.id)
                        );
                        const nomineeDetails = availableNominees.find((nominee) => nominee.id === selected.nomineeId);

                        return (
                          <div key={`${selected.nomineeId}-${index}`} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <select
                                value={selected.nomineeId}
                                onChange={(e) => handleNomineeSelectionChange(index, e.target.value)}
                                className="flex-1 mr-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              >
                                {availableForRow.map((nominee) => (
                                  <option key={nominee.id} value={nominee.id}>
                                    {nominee.name} ({nominee.relationship.toLowerCase()})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveNomineeRow(index)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Share Percentage (%) {nomineeDetails ? `- ${nomineeDetails.name}` : ''}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={selected.sharePercentage.toString()}
                                onChange={(e) => handleShareChange(index, parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <span className="font-medium text-gray-700">Total Share</span>
                    <span
                      className={`font-semibold ${
                        Math.abs(modalTotalShare - 100) < SHARE_EPSILON
                          ? 'text-green-600'
                          : modalTotalShare > 100
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {modalTotalShare.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeNomineeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNomineeShares}
                disabled={modalSaving || modalLoading || selectedNominees.length === 0}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

