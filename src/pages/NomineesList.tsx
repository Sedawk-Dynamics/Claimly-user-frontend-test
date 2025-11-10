import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nomineeService } from '../services/nominee.service';
import { Nominee } from '../types';
import { Users, Plus, Trash2, Pencil } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function NomineesList() {
  const navigate = useNavigate();
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { checking } = useRequireActiveSubscription();

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nominees</h1>
        <button
          onClick={() => navigate('/nominees/add')}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Nominee
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {nominees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Nominees</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first nominee</p>
          <button
            onClick={() => navigate('/nominees/add')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Nominee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nominees.map((nominee) => (
            <div key={nominee.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{nominee.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{nominee.relationship.toLowerCase()}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/nominees/${nominee.id}/edit`)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(nominee.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900 ml-2">{nominee.mobileNumber}</span>
                </div>
                {nominee.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900 ml-2">{nominee.email}</span>
                  </div>
                )}
                {nominee.address && (
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <span className="text-gray-900 ml-2">{nominee.address}</span>
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

