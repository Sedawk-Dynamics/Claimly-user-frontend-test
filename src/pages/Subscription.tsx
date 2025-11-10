import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { SubscriptionStatus, Subscription as SubscriptionType } from '../types';
import { CreditCard, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function Subscription() {
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { checking } = useRequireActiveSubscription();

  useEffect(() => {
    if (checking) {
      return;
    }
    loadSubscription();
  }, [checking]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const current = await userService.getSubscription(false) as SubscriptionStatus;
      setCurrentSubscription(current);

      if (showHistory) {
        const history = await userService.getSubscription(true) as SubscriptionType[];
        setSubscriptionHistory(history);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checking || !showHistory) {
      return;
    }
    loadSubscription();
  }, [checking, showHistory]);

  if (checking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED':
      case 'INACTIVE':
      case 'EXPIRED':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'INACTIVE':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(currentSubscription?.status || 'INACTIVE')}`}>
            {getStatusIcon(currentSubscription?.status || 'INACTIVE')}
            <span>{currentSubscription?.status || 'INACTIVE'}</span>
          </div>
        </div>

        {currentSubscription?.status === 'ACTIVE' && currentSubscription.subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSubscription.subscription.planName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{currentSubscription.subscription.amount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSubscription.subscription.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(currentSubscription.subscription.transactionDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No active subscription</p>
            <button
              onClick={() => window.location.href = '/subscription-offering'}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>

      {/* Subscription History */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Subscription History</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {subscriptionHistory.length > 0 ? (
              subscriptionHistory.map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-gray-900">{sub.planName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sub.paymentStatus)}`}>
                          {sub.paymentStatus}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium text-gray-900">₹{sub.amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(sub.transactionDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment ID</p>
                          <p className="font-mono text-xs text-gray-900">{sub.paymentId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No subscription history</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

