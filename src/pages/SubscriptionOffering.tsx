import { useNavigate } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '3',
    features: [
      'Manage up to 5 policies',
      'Add up to 3 nominees',
      'Document storage',
      'Email support',
    ],
  },
  {
    name: 'Premium',
    price: '5',
    popular: true,
    features: [
      'Unlimited policies',
      'Unlimited nominees',
      'Document storage',
      'Priority support',
      'Advanced analytics',
    ],
  },
];

export default function SubscriptionOffering() {
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string, amount: string) => {
    navigate('/payment', { state: { planName, amount } });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card p-6 sm:p-8 relative overflow-hidden group border-2 ${
              plan.popular 
                ? 'border-orange-400/50 hover:border-orange-400 shadow-glow-orange' 
                : 'border-cyan-400/30 hover:border-cyan-400/50'
            } transition-all duration-300 hover:-translate-y-2`}
          >
            {plan.popular && (
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
                className={`w-full ${plan.popular ? 'btn-orange' : 'btn-brand'} text-lg`}
              >
                Select {plan.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

