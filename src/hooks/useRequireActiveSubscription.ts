import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export function useRequireActiveSubscription() {
  const navigate = useNavigate();
  const { subscription, checking } = useSubscriptionStatus();

  useEffect(() => {
    if (checking) {
      return;
    }

    if (subscription && subscription.status !== 'ACTIVE') {
      navigate('/subscription-offering', { replace: true });
    }
  }, [checking, navigate, subscription]);

  return { checking };
}

