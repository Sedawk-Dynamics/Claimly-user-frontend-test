import { useNavigate } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '499',
    features: [
      'Manage up to 5 policies',
      'Add up to 3 nominees',
      'Document storage',
      'Email support',
    ],
  },
  {
    name: 'Premium',
    price: '999',
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
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select a subscription plan to start managing your insurance policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow-lg p-8 border-2 ${
              plan.popular ? 'border-primary-500 relative' : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-600 ml-2">/year</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan(plan.name, plan.price)}
              className={`w-full py-3 rounded-lg font-medium transition ${
                plan.popular
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Select {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

