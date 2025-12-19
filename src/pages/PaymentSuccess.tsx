import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home, AlertCircle, Download } from 'lucide-react';
import { userService } from '../services/user.service';
import { subscriptionService } from '../services/subscription.service';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  const { 
    planName, 
    amount, 
    finalAmountPaid, 
    walletAmountUsed, 
    paymentId,
    subscription 
  } = location.state || {};
  
  // Calculate amounts safely with proper type handling
  const subscriptionAmount = amount ? parseFloat(String(amount)) : (subscription?.amount ? parseFloat(String(subscription.amount)) : 0);
  const walletUsedValue = walletAmountUsed 
    ? parseFloat(String(walletAmountUsed)) 
    : (subscription?.walletAmountUsed ? parseFloat(String(subscription.walletAmountUsed)) : 0);
  
  // Calculate final amount paid
  let amountPaid: number;
  if (finalAmountPaid) {
    amountPaid = parseFloat(String(finalAmountPaid));
  } else if (subscriptionAmount > 0) {
    // Calculate: subscription amount - wallet used
    amountPaid = subscriptionAmount - walletUsedValue;
  } else {
    amountPaid = 0;
  }
  
  // Ensure amountPaid is not negative
  amountPaid = Math.max(0, amountPaid);
  
  // Get display values
  const displayPlanName = planName || subscription?.planName || 'Subscription';
  const displayAmount = subscriptionAmount > 0 ? subscriptionAmount : 0;
  const displayWalletUsed = walletUsedValue > 0 ? walletUsedValue : 0;
  const displayAmountPaid = amountPaid;
  const displayPaymentId = paymentId || subscription?.paymentId || 'N/A';

  useEffect(() => {
    // Clear subscription status cache to force refresh
    const CACHE_KEY = 'subscription-status-cache';
    sessionStorage.removeItem(CACHE_KEY);
    
    // Refresh subscription status to ensure it's up to date
    setLoading(true);
    userService.getSubscription()
      .then(() => {
        console.log('Subscription status refreshed successfully');
      })
      .catch((error) => {
        console.error('Error refreshing subscription status:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Auto-redirect to homepage after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Handle case where no data is available (direct navigation)
  if (!location.state && !subscription) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Payment Information</h1>
          <p className="text-gray-600 mb-8">
            No payment information found. Please complete a payment to see details here.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your subscription has been activated successfully.
        </p>

        {displayPlanName && displayAmount > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{displayPlanName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Subscription Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{displayAmount.toFixed(2)}</span>
              </div>
              {displayWalletUsed > 0 && (
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span className="text-gray-600 dark:text-gray-400">Wallet Discount:</span>
                  <span className="font-semibold">-₹{displayWalletUsed.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Amount Paid:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">₹{displayAmountPaid.toFixed(2)}</span>
                </div>
              </div>
              {displayPaymentId && displayPaymentId !== 'N/A' && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white break-all">{displayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {subscription?.id && subscription?.receiptUrl && (
            <button
              onClick={async () => {
                try {
                  // Download our own generated PDF receipt
                  await subscriptionService.downloadReceipt(subscription.id);
                } catch (error) {
                  console.error('Error downloading receipt:', error);
                  alert('Failed to download receipt. Please try again.');
                }
              }}
              className="inline-flex items-center bg-gray-600 dark:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Receipt
            </button>
          )}
          <button
            onClick={() => {
              // Clear cache before navigating
              const CACHE_KEY = 'subscription-status-cache';
              sessionStorage.removeItem(CACHE_KEY);
              // Refresh subscription status
              userService.getSubscription().catch((error) => {
                console.error('Error refreshing subscription status:', error);
              });
              navigate('/');
            }}
            disabled={loading}
            className="inline-flex items-center bg-primary-600 dark:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Home className="w-5 h-5 mr-2" />
            {loading ? 'Loading...' : 'Go to Homepage'}
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Redirecting to homepage in 5 seconds...
        </p>
      </div>
    </div>
  );
}

