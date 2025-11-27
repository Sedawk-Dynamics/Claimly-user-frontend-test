import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nomineeService, nomineeDocumentService } from '../services/nominee.service';
import { Nominee } from '../types';
import { Users, Plus, Trash2, Pencil, CheckCircle, Clock, FileText, ExternalLink, ChevronDown, ChevronUp, Edit2, X, RotateCcw } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function NomineesList() {
  const navigate = useNavigate();
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNominees, setExpandedNominees] = useState<Set<string>>(new Set());
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);
  const [updateFiles, setUpdateFiles] = useState<{ [key: string]: File | null }>({});
  const [success, setSuccess] = useState('');

  const { checking } = useRequireActiveSubscription();

  const toggleNomineeExpansion = (nomineeId: string) => {
    const newExpanded = new Set(expandedNominees);
    if (newExpanded.has(nomineeId)) {
      newExpanded.delete(nomineeId);
    } else {
      newExpanded.add(nomineeId);
    }
    setExpandedNominees(newExpanded);
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

  const getVerificationBadge = (nominee: Nominee) => {
    if (!nominee.documents || nominee.documents.length === 0) {
      return (
        <span className="badge status-inactive">
          <Clock className="w-3 h-3 mr-1" />
          No Documents
        </span>
      );
    }

    if (nominee.isVerified) {
      return (
        <span className="badge badge-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }

    const verifiedCount = nominee.verifiedDocumentsCount || 0;
    const totalCount = nominee.documentsCount || 0;

    if (verifiedCount === 0) {
      return (
        <span className="badge badge-warning">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </span>
      );
    }

    return (
      <span className="badge badge-warning">
        <Clock className="w-3 h-3 mr-1" />
        Partially Verified ({verifiedCount}/{totalCount})
      </span>
    );
  };

  useEffect(() => {
    if (checking) {
      return;
    }
    loadNominees();
  }, [checking]);

  const loadNominees = async () => {
    try {
      const data = await nomineeService.getNominees();
      setNominees(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load nominees');
    } finally {
      setLoading(false);
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
      await loadNominees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this nominee?')) {
      return;
    }

    try {
      await nomineeService.deleteNominee(id);
      setNominees(nominees.filter((n) => n.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete nominee');
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-2">Nominees</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your nominees and their documents</p>
        </div>
        <button
          onClick={() => navigate('/nominees/add')}
          className="btn-brand flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Nominee</span>
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

      {success && (
        <div className="bg-cyan-500/20 border-2 border-cyan-400 backdrop-blur-sm text-cyan-900 dark:text-cyan-200 px-4 py-3 rounded-lg text-sm shadow-glow-cyan">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}

      {nominees.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-brand rounded-full blur-xl opacity-50"></div>
            <div className="relative p-4 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Nominees</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first nominee</p>
          <button
            onClick={() => navigate('/nominees/add')}
            className="btn-brand inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Nominee</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {nominees.map((nominee) => (
            <div key={nominee.id} className="card overflow-hidden border border-cyan-400/20 hover:border-cyan-400/40 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nominee.name}</h3>
                      {getVerificationBadge(nominee)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{nominee.relationship.toLowerCase()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/nominees/${nominee.id}/edit`)}
                      className="p-2 text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(nominee.id)}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">Phone:</span>
                    <span className="text-gray-900 dark:text-white ml-2">{nominee.mobileNumber}</span>
                  </div>
                  {nominee.email && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Email:</span>
                      <span className="text-gray-900 dark:text-white ml-2">{nominee.email}</span>
                    </div>
                  )}
                  {nominee.address && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Address:</span>
                      <span className="text-gray-900 dark:text-white ml-2">{nominee.address}</span>
                    </div>
                  )}
                </div>
                
                {nominee.documents && nominee.documents.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleNomineeExpansion(nominee.id)}
                      className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
                    >
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Documents ({nominee.documents.length})
                      </span>
                      {expandedNominees.has(nominee.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedNominees.has(nominee.id) && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                        {nominee.documents.map((document) => {
                          const isUpdating = updatingDocument === document.id;
                          const hasUpdateFile = updateFiles[document.id] !== null && updateFiles[document.id] !== undefined;
                          
                          // Determine status: Verified, Re-verification, or Pending
                          const isReverification = !document.isVerified && document.verifiedAt !== null && document.verifiedAt !== undefined;
                          const statusBadge = document.isVerified ? (
                            <span className="badge badge-success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
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
                            <div key={document.id} className="p-3 bg-gray-50 dark:bg-navy-800/50 rounded-lg border border-gray-200 dark:border-navy-700">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{document.documentName}</p>
                                    {statusBadge}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                  className="ml-3 inline-flex items-center text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-semibold"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-300">
                                {!hasUpdateFile ? (
                                  <label className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 cursor-pointer">
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
                                        className="px-2 py-1 text-xs btn-brand transition disabled:opacity-50"
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
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

