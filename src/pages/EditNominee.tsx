import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nomineeService } from '../services/nominee.service';
import { ArrowLeft, Save } from 'lucide-react';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

type Relationship = 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'FRIEND' | 'OTHER';

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
    email: '',
    address: '',
  });

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
          email: nominee.email || '',
          address: nominee.address || '',
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load nominee details');
      } finally {
        setLoading(false);
      }
    };

    loadNominee();
  }, [checking, id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) {
      setError('Invalid nominee');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await nomineeService.updateNominee(id, {
        name: formData.name,
        relationship: formData.relationship,
        mobileNumber: formData.mobileNumber,
        email: formData.email || undefined,
        address: formData.address || undefined,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="9876543210"
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

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
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


