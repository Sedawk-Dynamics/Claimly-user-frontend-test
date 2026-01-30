import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionStatus, Subscription as SubscriptionType } from '../types';
import { CreditCard, Check, X, Clock, Calendar, Plus, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useRequireActiveSubscription } from '../hooks/useRequireActiveSubscription';

export default function Subscription() {
  const navigate = useNavigate();
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return <Check className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'FAILED':
      case 'INACTIVE':
      case 'EXPIRED':
        return <X className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return 'badge badge-success';
      case 'PENDING':
        return 'badge badge-warning';
      case 'FAILED':
      case 'INACTIVE':
      case 'EXPIRED':
        return 'badge badge-danger';
      default:
        return 'badge status-inactive';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-2">My Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400">View your subscription status and history</p>
      </div>

      {/* Current Subscription */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
            Current Subscription
          </h2>
          <div className={`${getStatusBadge(currentSubscription?.status || 'INACTIVE')} flex items-center space-x-2`}>
            {getStatusIcon(currentSubscription?.status || 'INACTIVE')}
            <span>{currentSubscription?.status || 'INACTIVE'}</span>
          </div>
        </div>

        {currentSubscription?.status === 'ACTIVE' && currentSubscription.subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-950/30 dark:to-cyan-950/30 rounded-xl border border-brand-200/30 dark:border-brand-800/30">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Plan Name</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentSubscription.subscription.planName}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-brand-50 dark:from-cyan-950/30 dark:to-brand-950/30 rounded-xl border border-cyan-200/30 dark:border-cyan-800/30">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                <p className="text-lg font-bold text-gradient-brand">
                  ₹{currentSubscription.subscription.amount}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-xl border border-orange-200/30 dark:border-orange-800/30">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentSubscription.subscription.paymentStatus}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl border border-yellow-200/30 dark:border-yellow-800/30">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Transaction Date</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {format(new Date(currentSubscription.subscription.transactionDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Expiry: show "Never expires" for lifetime, or date + days remaining */}
            {currentSubscription.subscription.neverExpires || !currentSubscription.subscription.expiresAt || currentSubscription.subscription.expiresAt === 'lifetime' ? (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200/30 dark:border-green-800/30">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Validity</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">Never expires</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200/30 dark:border-green-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Expires On</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {format(new Date(currentSubscription.subscription.expiresAt!), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Days Remaining</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(0, differenceInDays(new Date(currentSubscription.subscription.expiresAt!), new Date()))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Receipt Section */}
            {currentSubscription.subscription.receiptUrl && (
              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      // Download our own generated PDF receipt
                      await subscriptionService.downloadReceipt(currentSubscription.subscription!.id);
                    } catch (error) {
                      console.error('Error downloading receipt:', error);
                      alert('Failed to download receipt. Please try again.');
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            )}

            {/* Extend Subscription Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-brand-200 dark:border-brand-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
                    Extend Your Subscription
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Purchase an additional subscription plan to extend your current lifetime access even further. Your new subscription will be added on top of your existing remaining days.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/subscription-offering')}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span>Extend Subscription</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-sunset rounded-full blur-xl opacity-50"></div>
              <div className="relative p-4 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">No active subscription</p>
            <button
              onClick={() => window.location.href = '/subscription-offering'}
              className="btn-orange"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>

      {/* Subscription History */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-6 bg-gradient-sunset rounded-full mr-3"></div>
            Subscription History
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm font-semibold text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 transition-colors"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {subscriptionHistory.length > 0 ? (
              subscriptionHistory.map((sub) => (
                <div key={sub.id} className="card p-4 border border-cyan-400/20 hover:border-cyan-400/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">{sub.planName}</h3>
                        <span className={getStatusBadge(sub.paymentStatus)}>
                          {sub.paymentStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Amount</p>
                          <p className="font-bold text-gray-900 dark:text-white">₹{sub.amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Date</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {format(new Date(sub.transactionDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 font-semibold mb-1">Payment ID</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-gray-100">{sub.paymentId}</p>
                        </div>
                      </div>
                      {sub.receiptUrl && sub.paymentStatus === 'SUCCESS' && (
                        <div className="mt-4">
                          <button
                            onClick={async () => {
                              try {
                                // Download our own generated PDF receipt
                                await subscriptionService.downloadReceipt(sub.id);
                              } catch (error) {
                                console.error('Error downloading receipt:', error);
                                alert('Failed to download receipt. Please try again.');
                              }
                            }}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Receipt</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No subscription history</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

