import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nomineeService } from '../services/nominee.service';
import { NomineeDocument } from '../types';
import { ArrowLeft, Save, Upload, FileText, X, CheckCircle, Clock } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

type Relationship = 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';
type DocumentType = 'NOMINEE_ID' | 'ADDRESS_PROOF' | 'DEATH_CERTIFICATE' | 'OTHER';

interface NewDocument {
  file: File | null;
  documentType: DocumentType;
  documentName: string;
}

interface DocumentToUpdate {
  documentId: string;
  file: File;
  documentType: DocumentType;
  documentName: string;
}

export default function EditNominee() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { checking } = useRequireActiveSubscription();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'SPOUSE' as Relationship,
    mobileNumber: '',
    dob: '',
    email: '',
    address: '',
  });
  const [existingDocuments, setExistingDocuments] = useState<NomineeDocument[]>([]);
  const [newDocuments, setNewDocuments] = useState<NewDocument[]>([]);
  const [documentsToUpdate, setDocumentsToUpdate] = useState<{ [key: string]: DocumentToUpdate }>({});
  const [documentsToDelete, setDocumentsToDelete] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (checking || !id) {
      return;
    }

    const loadNominee = async () => {
      setError('');
      setLoading(true);
      try {
        const nominee = await nomineeService.getNomineeById(id);
        setFormData({
          name: nominee.name,
          relationship: nominee.relationship as Relationship,
          mobileNumber: nominee.mobileNumber,
          dob: nominee.dob || '',
          email: nominee.email || '',
          address: nominee.address || '',
        });
        setExistingDocuments(nominee.documents || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load nominee details');
      } finally {
        setLoading(false);
      }
    };

    loadNominee();
  }, [checking, id]);

  const handleAddNewDocument = () => {
    setNewDocuments([...newDocuments, { file: null, documentType: 'OTHER', documentName: '' }]);
  };

  const handleNewDocumentChange = (index: number, field: keyof NewDocument, value: any) => {
    const updated = [...newDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setNewDocuments(updated);
  };

  const handleRemoveNewDocument = (index: number) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
  };

  const handleUpdateDocument = (documentId: string, file: File) => {
    const existingDoc = existingDocuments.find((d) => d.id === documentId);
    if (!existingDoc) return;

    setDocumentsToUpdate({
      ...documentsToUpdate,
      [documentId]: {
        documentId,
        file,
        documentType: existingDoc.documentType,
        documentName: existingDoc.documentName,
      },
    });
  };

  const handleUpdateDocumentType = (documentId: string, documentType: DocumentType) => {
    if (documentsToUpdate[documentId]) {
      setDocumentsToUpdate({
        ...documentsToUpdate,
        [documentId]: {
          ...documentsToUpdate[documentId],
          documentType,
        },
      });
    }
  };

  const handleUpdateDocumentName = (documentId: string, documentName: string) => {
    if (documentsToUpdate[documentId]) {
      setDocumentsToUpdate({
        ...documentsToUpdate,
        [documentId]: {
          ...documentsToUpdate[documentId],
          documentName,
        },
      });
    }
  };

  const handleCancelUpdate = (documentId: string) => {
    const updated = { ...documentsToUpdate };
    delete updated[documentId];
    setDocumentsToUpdate(updated);
  };

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const newSet = new Set(documentsToDelete);
      newSet.add(documentId);
      setDocumentsToDelete(newSet);
      
      // Remove from update list if present
      const updated = { ...documentsToUpdate };
      delete updated[documentId];
      setDocumentsToUpdate(updated);
    }
  };

  const handleUndoDelete = (documentId: string) => {
    const newSet = new Set(documentsToDelete);
    newSet.delete(documentId);
    setDocumentsToDelete(newSet);
  };

  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDocumentUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) {
      setError('Invalid nominee');
      return;
    }

    // Validate new documents
    for (const doc of newDocuments) {
      if (!doc.file) {
        setError('Please select a file for all new documents');
        return;
      }
      if (!doc.documentName.trim()) {
        setError('Please provide a name for all new documents');
        return;
      }
    }

    // Filter out invalid new documents
    const validNewDocuments = newDocuments.filter((doc) => doc.file && doc.documentName.trim());

    // Validate documents to update
    for (const doc of Object.values(documentsToUpdate)) {
      if (!doc.file) {
        setError('Please select a file for all documents being updated');
        return;
      }
      if (!doc.documentName.trim()) {
        setError('Please provide a name for all documents being updated');
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      await nomineeService.updateNominee(id, {
        name: formData.name,
        relationship: formData.relationship,
        mobileNumber: formData.mobileNumber,
        dob: formData.dob,
        email: formData.email || undefined,
        address: formData.address || undefined,
        documentsToAdd: validNewDocuments.map((doc) => ({
          file: doc.file!,
          documentType: doc.documentType,
          documentName: doc.documentName,
        })),
        documentsToUpdate: Object.values(documentsToUpdate).map((doc) => ({
          documentId: doc.documentId,
          file: doc.file,
          documentType: doc.documentType,
          documentName: doc.documentName,
        })),
        documentsToDelete: Array.from(documentsToDelete),
      });
      navigate('/nominees');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update nominee');
    } finally {
      setSaving(false);
    }
  };

  if (checking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/nominees')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Nominees
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Nominee</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              placeholder="Enter nominee name"
            />
          </div>

          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
              Relationship *
            </label>
            <select
              id="relationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value as Relationship })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
            >
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
              Mobile Number *
            </label>
            <input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              required
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              placeholder="Enter address"
            />
          </div>

          {/* Existing Documents Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            </div>

            {/* Existing Documents */}
            {existingDocuments
              .filter((doc) => !documentsToDelete.has(doc.id))
              .map((doc) => (
                <div key={doc.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{doc.documentName}</span>
                        {doc.isVerified ? (
                          <span title="Verified">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </span>
                        ) : (
                          <span title="Pending Verification">
                            <Clock className="w-4 h-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Type: {formatDocumentType(doc.documentType)}
                      </p>
                      {documentsToUpdate[doc.id] ? (
                        <div className="space-y-2 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Document Type
                            </label>
                            <select
                              value={documentsToUpdate[doc.id].documentType}
                              onChange={(e) =>
                                handleUpdateDocumentType(doc.id, e.target.value as DocumentType)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            >
                              <option value="NOMINEE_ID">Nominee ID</option>
                              <option value="ADDRESS_PROOF">Address Proof</option>
                              <option value="DEATH_CERTIFICATE">Death Certificate</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Document Name
                            </label>
                            <input
                              type="text"
                              value={documentsToUpdate[doc.id].documentName}
                              onChange={(e) => handleUpdateDocumentName(doc.id, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Document name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              New File
                            </label>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpdateDocument(doc.id, file);
                              }}
                              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            />
                            {documentsToUpdate[doc.id].file && (
                              <p className="text-xs text-gray-500 mt-1">
                                Selected: {documentsToUpdate[doc.id].file.name}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelUpdate(doc.id)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            Cancel Update
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={getDocumentUrl(doc.documentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-600 hover:text-brand-700"
                          >
                            View Document
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleUpdateDocument(doc.id, file);
                              };
                              input.click();
                            }}
                            className="text-sm text-brand-600 hover:text-brand-700"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Deleted Documents (can be undone) */}
            {Array.from(documentsToDelete).map((docId) => {
              const doc = existingDocuments.find((d) => d.id === docId);
              if (!doc) return null;
              return (
                <div key={docId} className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900 line-through">{doc.documentName}</p>
                      <p className="text-xs text-red-600">Marked for deletion</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUndoDelete(docId)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              );
            })}

            {/* New Documents */}
            {newDocuments.map((doc, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">New Document {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewDocument(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Type *
                    </label>
                    <select
                      value={doc.documentType}
                      onChange={(e) =>
                        handleNewDocumentChange(index, 'documentType', e.target.value as DocumentType)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="NOMINEE_ID">Nominee ID</option>
                      <option value="ADDRESS_PROOF">Address Proof</option>
                      <option value="DEATH_CERTIFICATE">Death Certificate</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      value={doc.documentName}
                      onChange={(e) => handleNewDocumentChange(index, 'documentName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="Enter document name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      File *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNewDocumentChange(index, 'file', file);
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      required
                    />
                    {doc.file && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {doc.file.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Document Button */}
            <button
              type="button"
              onClick={handleAddNewDocument}
              className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:text-brand-700 border border-brand-300 rounded-lg hover:bg-brand-50 transition"
            >
              <Upload className="w-4 h-4" />
              Add New Document
            </button>
          </div>

          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/nominees')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


