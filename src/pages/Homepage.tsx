import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import { CreditCard, FileText, Users, User, Image as ImageIcon } from 'lucide-react';
import type { SubscriptionStatus } from '../types';

export default function Homepage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const status = await userService.getSubscription() as SubscriptionStatus;
      
      // If no active subscription, redirect to subscription offering
      if (status.status !== 'ACTIVE') {
        navigate('/subscription-offering');
        return;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Claimly</h1>
        <p className="text-gray-600 mt-2">Manage your insurance policies and nominees</p>
      </div>

      {/* Banners Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          Banners
        </h2>
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Secure Your Future</h3>
          <p className="text-primary-100">
            Manage all your insurance policies in one place. Add nominees and ensure your loved ones are protected.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/profile')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
          <p className="text-gray-600 text-sm">View and update your profile information</p>
        </div>

        <div
          onClick={() => navigate('/nominees')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nominees List</h3>
          <p className="text-gray-600 text-sm">Manage your nominees and their documents</p>
        </div>

        <div
          onClick={() => navigate('/subscription')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Subscription</h3>
          <p className="text-gray-600 text-sm">View your subscription status and history</p>
        </div>

        <div
          onClick={() => navigate('/policies')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Policies</h3>
          <p className="text-gray-600 text-sm">View and manage your insurance policies</p>
        </div>
      </div>
    </div>
  );
}

