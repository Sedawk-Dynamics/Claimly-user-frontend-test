import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscriptionService } from '../services/subscription.service';
import { walletService } from '../services/wallet.service';
import { paymentService } from '../services/payment.service';
import { Lock, ArrowLeft, Wallet } from 'lucide-react';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planName, amount } = location.state || { planName: 'Basic', amount: '3' };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  useEffect(() => {
    loadWalletBalance();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  };

  const loadWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance();
      setWalletBalance(balance.balance);
      // Auto-set wallet amount to available balance (but don't auto-check the checkbox)
      if (balance.balance > 0) {
        const subscriptionAmount = parseFloat(amount);
        const initialWalletAmount = Math.min(balance.balance, subscriptionAmount);
        setWalletAmount(initialWalletAmount);
        console.log('Wallet balance loaded:', balance.balance, 'Initial wallet amount set to:', initialWalletAmount);
      } else {
        setWalletAmount(0);
      }
    } catch (err: any) {
      console.error('Failed to load wallet balance', err);
      setWalletBalance(0);
      setWalletAmount(0);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const subscriptionAmount = parseFloat(amount);
      
      // Ensure walletAmount is set correctly when useWallet is true
      let walletAmountToUse = 0;
      if (useWallet) {
        // If wallet is checked but amount is 0 or invalid, set it to the minimum of balance and subscription amount
        if (walletAmount <= 0 || isNaN(walletAmount)) {
          walletAmountToUse = Math.min(walletBalance, subscriptionAmount);
        } else {
          walletAmountToUse = walletAmount;
        }
        
        // Ensure walletAmountToUse is valid and positive
        if (walletAmountToUse <= 0 || isNaN(walletAmountToUse)) {
          setError('Please enter a valid wallet amount to use');
          setLoading(false);
          return;
        }
      }

      if (useWallet && walletAmountToUse > walletBalance) {
        setError('Insufficient wallet balance');
        setLoading(false);
        return;
      }

      if (useWallet && walletAmountToUse > subscriptionAmount) {
        setError('Wallet amount cannot exceed subscription amount');
        setLoading(false);
        return;
      }

      // Calculate final amount to pay
      const finalAmountToPay = subscriptionAmount - walletAmountToUse;

      // If wallet covers the full amount, create subscription directly
      if (finalAmountToPay <= 0) {
        const paymentId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const subscriptionResponse = await subscriptionService.createSubscription({
          planName,
          amount,
          paymentId,
          paymentStatus: 'SUCCESS',
          transactionDate: new Date().toISOString(),
          walletAmountUsed: walletAmountToUse.toString(),
        });

        const walletUsedFromResponse = subscriptionResponse.walletAmountUsed ? parseFloat(subscriptionResponse.walletAmountUsed) : walletAmountToUse;
        const finalAmountPaid = subscriptionAmount - walletUsedFromResponse;

        // Clear subscription status cache
        const CACHE_KEY = 'subscription-status-cache';
        sessionStorage.removeItem(CACHE_KEY);

        navigate('/payment-success', { 
          state: { 
            planName, 
            amount: subscriptionAmount.toString(),
            finalAmountPaid: finalAmountPaid.toFixed(2),
            walletAmountUsed: walletUsedFromResponse > 0 ? walletUsedFromResponse.toFixed(2) : '0',
            paymentId,
            subscription: subscriptionResponse,
          } 
        });
        return;
      }

      // For Razorpay payment, create order and open checkout
      try {
        // Load Razorpay script
        await loadRazorpayScript();

        // Create payment order
        const orderResponse = await paymentService.createOrder({
          amount: finalAmountToPay,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            planName,
            subscriptionAmount: subscriptionAmount.toString(),
            walletAmountUsed: walletAmountToUse.toString(),
          },
        });

        // Open Razorpay Checkout
        const options = {
          key: orderResponse.key_id,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          name: 'Claimly',
          description: `Subscription: ${planName}`,
          order_id: orderResponse.id,
          handler: async (response: any) => {
            try {
              // Verify payment and create subscription
              const verifyResult = await paymentService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName,
                amount,
                walletAmountUsed: walletAmountToUse > 0 ? walletAmountToUse.toString() : undefined,
              });

              const subscription = verifyResult.subscription;
              const walletUsedFromResponse = subscription.walletAmountUsed ? parseFloat(subscription.walletAmountUsed) : walletAmountToUse;
              const finalAmountPaid = subscriptionAmount - walletUsedFromResponse;

              // Clear subscription status cache
              const CACHE_KEY = 'subscription-status-cache';
              sessionStorage.removeItem(CACHE_KEY);

              navigate('/payment-success', { 
                state: { 
                  planName, 
                  amount: subscriptionAmount.toString(),
                  finalAmountPaid: finalAmountPaid.toFixed(2),
                  walletAmountUsed: walletUsedFromResponse > 0 ? walletUsedFromResponse.toFixed(2) : '0',
                  paymentId: response.razorpay_payment_id,
                  subscription,
                } 
              });
            } catch (verifyError: any) {
              setError(verifyError.response?.data?.error || 'Payment verification failed. Please contact support.');
              setLoading(false);
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#0ea5e9',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (razorpayError: any) {
        console.error('Razorpay error:', razorpayError);
        setError(razorpayError.response?.data?.error || 'Failed to initialize payment. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
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
              <span className="font-semibold text-gray-900 dark:text-white">₹{amount}</span>
            </div>
            {useWallet && walletAmount > 0 && (
              <>
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span className="text-gray-600 dark:text-gray-300">Wallet Discount:</span>
                  <span className="font-semibold">-₹{walletAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-200 font-semibold">Amount to Pay:</span>
                    <span className="font-bold text-xl text-brand-600 dark:text-brand-400">₹{(parseFloat(amount) - walletAmount).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            {(!useWallet || walletAmount === 0) && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-200 font-semibold">Amount to Pay:</span>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">₹{amount}</span>
                </div>
              </div>
            )}
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
                        const checked = e.target.checked;
                        setUseWallet(checked);
                        if (checked) {
                          const subscriptionAmount = parseFloat(amount);
                          // Always set to the maximum available (minimum of balance and subscription amount)
                          const amountToUse = Math.min(walletBalance, subscriptionAmount);
                          // Only set if we have a valid positive amount
                          if (amountToUse > 0 && walletBalance > 0) {
                            setWalletAmount(amountToUse);
                            console.log('Wallet checkbox checked, setting amount:', amountToUse, 'from balance:', walletBalance);
                          } else {
                            // If no balance, uncheck and show error
                            setUseWallet(false);
                            setWalletAmount(0);
                            setError('No wallet balance available');
                            console.log('Wallet checkbox checked but no balance available');
                          }
                        } else {
                          setWalletAmount(0);
                          console.log('Wallet checkbox unchecked');
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
                        value={walletAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          const subscriptionAmount = parseFloat(amount);
                          // Ensure value is valid and within bounds
                          if (!isNaN(value) && value >= 0) {
                            const maxAllowed = Math.min(walletBalance, subscriptionAmount);
                            const newAmount = Math.min(Math.max(0, value), maxAllowed);
                            setWalletAmount(newAmount);
                            console.log('Wallet amount changed:', newAmount, 'max allowed:', maxAllowed);
                          } else if (e.target.value === '' || e.target.value === '0') {
                            // Allow empty or 0 for user input, but ensure useWallet is handled
                            setWalletAmount(0);
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, ensure we have a valid amount if useWallet is checked
                          if (useWallet) {
                            const value = parseFloat(e.target.value) || 0;
                            const subscriptionAmount = parseFloat(amount);
                            const maxAllowed = Math.min(walletBalance, subscriptionAmount);
                            if (value <= 0 || isNaN(value)) {
                              // Auto-set to max if invalid
                              setWalletAmount(maxAllowed);
                            } else {
                              // Ensure it's within bounds
                              setWalletAmount(Math.min(value, maxAllowed));
                            }
                          }
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
          {(() => {
            const subscriptionAmount = parseFloat(amount);
            const finalAmountToPay = useWallet && walletAmount > 0 
              ? subscriptionAmount - walletAmount 
              : subscriptionAmount;
            const isWalletOnly = finalAmountToPay <= 0;
            
            return (
              <>
                {isWalletOnly && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Great!</strong> Your wallet balance covers the full subscription amount. No payment required.
                    </p>
                  </div>
                )}

                {!isWalletOnly && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You will be redirected to Razorpay's secure payment gateway to complete your payment.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      {isWalletOnly ? (
                        'Complete Purchase with Wallet'
                      ) : (
                        `Pay ₹${finalAmountToPay.toFixed(2)} via Razorpay`
                      )}
                    </>
                  )}
                </button>
              </>
            );
          })()}
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}

