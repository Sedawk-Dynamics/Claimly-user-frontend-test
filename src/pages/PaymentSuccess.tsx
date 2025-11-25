import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import { userService } from '../services/user.service';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planName, amount, paymentId } = location.state || {};

  useEffect(() => {
    // Clear subscription status cache to force refresh
    const CACHE_KEY = 'subscription-status-cache';
    sessionStorage.removeItem(CACHE_KEY);
    
    // Refresh subscription status to ensure it's up to date
    userService.getSubscription().catch((error) => {
      console.error('Error refreshing subscription status:', error);
    });

    // Auto-redirect to homepage after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your subscription has been activated successfully.
        </p>

        {planName && amount && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-gray-900">₹{amount}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-sm text-gray-900">{paymentId}</span>
                </div>
              )}
            </div>
          </div>
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
          className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          <Home className="w-5 h-5 mr-2" />
          Go to Homepage
        </button>

        <p className="text-sm text-gray-500 mt-4">
          Redirecting to homepage in 5 seconds...
        </p>
      </div>
    </div>
  );
}

