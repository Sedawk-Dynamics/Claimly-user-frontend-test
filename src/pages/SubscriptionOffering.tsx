import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';
import { subscriptionService, SubscriptionPlan } from '../services/subscription.service';

export default function SubscriptionOffering() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedPlans = await subscriptionService.getActivePlans();
        setPlans(fetchedPlans);
      } catch (err: any) {
        console.error('Failed to load subscription plans:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleSelectPlan = (planName: string, price: string) => {
    navigate('/payment', { state: { planName, amount: price } });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-sunset rounded-full blur-xl opacity-60 animate-pulse-glow-orange"></div>
          <div className="relative p-4 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full shadow-glow-orange-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-4">Choose Your Plan</h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
          Select a subscription plan to start managing your insurance policies
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading plans...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-brand mt-4"
          >
            Retry
          </button>
        </div>
      ) : plans.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No subscription plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 sm:p-8 relative overflow-hidden group border-2 ${
                plan.isPopular 
                  ? 'border-orange-400/50 hover:border-orange-400 shadow-glow-orange' 
                  : 'border-cyan-400/30 hover:border-cyan-400/50'
              } transition-all duration-300 hover:-translate-y-2`}
            >
              {plan.isPopular && (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="badge badge-orange px-4 py-1 shadow-glow-orange">
                    Most Popular
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-sunset opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              </>
            )}
            <div className="relative">
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-gradient-brand">₹{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2 text-lg">/year</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="relative p-1 bg-gradient-to-br from-cyan-400 to-brand-500 rounded-lg mr-3 mt-0.5 flex-shrink-0 shadow-glow-cyan">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan.name, plan.price)}
                  className={`w-full ${plan.isPopular ? 'btn-orange' : 'btn-brand'} text-lg`}
                >
                  Select {plan.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

