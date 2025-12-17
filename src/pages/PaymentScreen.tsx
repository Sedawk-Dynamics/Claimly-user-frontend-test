import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscriptionService } from '../services/subscription.service';
import { walletService } from '../services/wallet.service';
import { CreditCard, Lock, ArrowLeft, Wallet } from 'lucide-react';

export default function PaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planName, amount } = location.state || { planName: 'Basic', amount: '499' };

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance();
      setWalletBalance(balance.balance);
      // Auto-set wallet amount to available balance if user wants to use wallet
      if (balance.balance > 0) {
        const subscriptionAmount = parseFloat(amount);
        setWalletAmount(Math.min(balance.balance, subscriptionAmount));
      }
    } catch (err: any) {
      console.error('Failed to load wallet balance', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData({ ...formData, [name]: formatted.slice(0, 19) });
    } else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'cvv') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 3) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const subscriptionAmount = parseFloat(amount);
      const walletAmountToUse = useWallet ? walletAmount : 0;

      if (useWallet && walletAmountToUse > walletBalance) {
        setError('Insufficient wallet balance');
        return;
      }

      if (useWallet && walletAmountToUse > subscriptionAmount) {
        setError('Wallet amount cannot exceed subscription amount');
        return;
      }

      // In a real app, this would integrate with a payment gateway
      // For now, we'll simulate a payment
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create subscription with payment details
      await subscriptionService.createSubscription({
        planName,
        amount,
        paymentId,
        paymentStatus: 'SUCCESS',
        transactionDate: new Date().toISOString(),
        walletAmountUsed: walletAmountToUse > 0 ? walletAmountToUse.toString() : undefined,
      });

      // Clear subscription status cache to force refresh
      const CACHE_KEY = 'subscription-status-cache';
      sessionStorage.removeItem(CACHE_KEY);

      // Navigate to payment success
      navigate('/payment-success', { state: { planName, amount, paymentId } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/subscription-offering')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment</h1>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Plan:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Subscription Amount:</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">₹{amount}</span>
            </div>
            {walletBalance > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <Wallet className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        You have ₹{walletBalance.toFixed(2)} in your wallet!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Use your wallet balance to reduce the payment amount below.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useWallet"
                      checked={useWallet}
                      onChange={(e) => {
                        setUseWallet(e.target.checked);
                        if (e.target.checked) {
                          const subscriptionAmount = parseFloat(amount);
                          setWalletAmount(Math.min(walletBalance, subscriptionAmount));
                        } else {
                          setWalletAmount(0);
                        }
                      }}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <label htmlFor="useWallet" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center cursor-pointer">
                      <Wallet className="w-4 h-4 mr-1 text-brand-600 dark:text-brand-400" />
                      Use Wallet Balance (₹{walletBalance.toFixed(2)} available)
                    </label>
                  </div>
                </div>
                {useWallet && (
                  <div className="ml-6 space-y-3 mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount to use from wallet
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={Math.min(walletBalance, parseFloat(amount))}
                        step="0.01"
                        value={walletAmount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const subscriptionAmount = parseFloat(amount);
                          setWalletAmount(Math.min(Math.max(0, value), Math.min(walletBalance, subscriptionAmount)));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Maximum: ₹{Math.min(walletBalance, parseFloat(amount)).toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Subscription Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Amount from wallet:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">-₹{walletAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-gray-900 dark:text-white">Final Amount to Pay:</span>
                        <span className="text-brand-700 dark:text-brand-400 text-lg">₹{(parseFloat(amount) - walletAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-2">
              Card Holder Name
            </label>
            <input
              id="cardHolderName"
              name="cardHolderName"
              type="text"
              value={formData.cardHolderName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                value={formData.cardNumber}
                onChange={handleInputChange}
                required
                maxLength={19}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="1234 5678 9012 3456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="text"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="MM/YY"
              />
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                id="cvv"
                name="cvv"
                type="text"
                value={formData.cvv}
                onChange={handleInputChange}
                required
                maxLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="123"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (useWallet && walletAmount > 0 && parseFloat(amount) - walletAmount <= 0 && (!formData.cardNumber || !formData.cardHolderName))}
            className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-md hover:shadow-lg"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pay ₹{useWallet && walletAmount > 0 ? (parseFloat(amount) - walletAmount).toFixed(2) : amount}
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}

