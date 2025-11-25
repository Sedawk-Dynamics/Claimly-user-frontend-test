import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { policyService, policyNomineeService } from '../services/policy.service';
import { userService } from '../services/user.service';
import { nomineeService } from '../services/nominee.service';
import { Policy, Nominee } from '../types';
import { FileText, Plus, Trash2, Users, Pencil, X, CheckCircle, Clock, XCircle, Upload, AlertCircle, RotateCcw } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-2">My Policies</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage your insurance policies</p>
        </div>
        <button
          onClick={handleAddPolicy}
          className="btn-brand flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Policy</span>
        </button>
      </div>

      {error && (
        <div className="bg-orange-500/20 border-2 border-orange-400 backdrop-blur-sm text-orange-900 dark:text-orange-200 px-4 py-3 rounded-lg text-sm shadow-glow-orange">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {policies.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-brand rounded-full blur-xl opacity-50"></div>
            <div className="relative p-4 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full">
              <FileText className="w-12 h-12 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Policies</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first policy</p>
          <button
            onClick={handleAddPolicy}
            className="btn-brand inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Policy</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <div key={policy.id} className="card p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{policy.policyNumber}</h3>
                    <span className={`badge ${policy.status === 'ACTIVE' ? 'badge-success' : 'status-inactive'}`}>
                      {policy.status}
                    </span>
                    {(() => {
                      const totalDocs = policy.documents.length;
                      const verifiedDocs = policy.documents.filter((doc) => doc.isVerified && doc.verifiedAt);
                      const rejectedDocs = policy.documents.filter((doc) => doc.rejectedAt !== null && doc.rejectedAt !== undefined);
                      const verifiedCount = verifiedDocs.length;
                      
                      // Check for re-verification: verified docs exist AND new unverified docs uploaded after latest verification
                      let needsReverification = false;
                      if (verifiedCount > 0 && verifiedCount < totalDocs) {
                        const latestVerification = verifiedDocs
                          .map((d) => d.verifiedAt ? new Date(d.verifiedAt).getTime() : 0)
                          .sort((a, b) => b - a)[0];
                        const unverifiedDocs = policy.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt);
                        needsReverification = unverifiedDocs.some((doc) => 
                          new Date(doc.uploadedAt).getTime() > latestVerification
                        );
                      }
                      
                      if (totalDocs === 0) {
                        return (
                          <span className="badge badge-warning">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No Documents
                          </span>
                        );
                      } else if (rejectedDocs.length > 0) {
                        return (
                          <span className="badge badge-danger">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </span>
                        );
                      } else if (verifiedCount === totalDocs) {
                        return (
                          <span className="badge badge-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        );
                      } else if (needsReverification) {
                        return (
                          <span className="badge badge-danger">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Re-verification
                          </span>
                        );
                      } else {
                        return (
                          <span className="badge badge-warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending ({verifiedCount}/{totalDocs})
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{policy.insuranceCompany.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/policies/${policy.id}/edit`)}
                    className="p-2 text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                    title="Edit Policy"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openNomineeModal(policy)}
                    className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                    title="Manage Nominee Shares"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-950/30 dark:to-cyan-950/30 rounded-xl border border-brand-200/30 dark:border-brand-800/30">
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Sum Assured</p>
                  <p className="font-bold text-gradient-brand">₹{parseFloat(policy.sumAssured).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-50 to-brand-50 dark:from-cyan-950/30 dark:to-brand-950/30 rounded-xl border border-cyan-200/30 dark:border-cyan-800/30">
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Uploaded</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {format(new Date(policy.uploadedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-xl border border-orange-200/30 dark:border-orange-800/30">
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Nominees</p>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {policy.nominees.length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl border border-yellow-200/30 dark:border-yellow-800/30">
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Documents</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {policy.documents.filter((d) => d.isVerified).length}/{policy.documents.length} Verified
                  </p>
                </div>
              </div>
              {policy.documents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                  <div className="space-y-2">
                    {policy.documents.map((doc) => {
                      const isRejected = doc.rejectedAt !== null && doc.rejectedAt !== undefined;
                      const isVerified = doc.isVerified && doc.verifiedAt;
                      const isReverification = !doc.isVerified && !isRejected && doc.verifiedAt !== null && doc.verifiedAt !== undefined;
                      
                      return (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{doc.documentName}</span>
                            <span className="ml-2 text-xs text-gray-500">({doc.documentType})</span>
                          </div>
                          <div className="flex items-center">
                            {isVerified ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </span>
                            ) : isReverification ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Re-verification
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const rejectedDocs = policy.documents.filter((d) => d.rejectedAt !== null && d.rejectedAt !== undefined);
                    const verifiedDocs = policy.documents.filter((d) => d.isVerified && d.verifiedAt);
                    const unverifiedDocs = policy.documents.filter((d) => !d.isVerified && !d.rejectedAt);
                    
                    if (verifiedDocs.length === policy.documents.length) {
                      // All documents are verified, no message needed
                      return null;
                    }
                    
                    if (rejectedDocs.length > 0) {
                      // Show rejected message if there are rejected documents
                      return (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 mb-2">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Some documents were rejected. Please upload new documents for verification.
                          </p>
                          <button
                            onClick={() => navigate(`/policies/${policy.id}/edit`)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Resubmit Documents
                          </button>
                        </div>
                      );
                    } else if (unverifiedDocs.length > 0) {
                      // Check if it's re-verification (new docs after verification) or pending
                      const needsReverification = verifiedDocs.length > 0 && unverifiedDocs.some((doc) => {
                        const latestVerification = verifiedDocs
                          .map((d) => d.verifiedAt ? new Date(d.verifiedAt).getTime() : 0)
                          .sort((a, b) => b - a)[0];
                        return new Date(doc.uploadedAt).getTime() > latestVerification;
                      });
                      
                      if (needsReverification) {
                        return (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 mb-2">
                              <RotateCcw className="w-4 h-4 inline mr-1" />
                              Re-verification pending. Please wait for admin approval.
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 mb-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Verification pending. Please wait for admin approval.
                            </p>
                          </div>
                        );
                      }
                    }
                    
                    return null;
                  })()}
                  {policy.documents.length === 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        No documents uploaded. Please upload policy documents for verification.
                      </p>
                      <button
                        onClick={() => navigate(`/policies/${policy.id}/edit`)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Documents
                      </button>
                    </div>
                  )}
                </div>
              )}
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

