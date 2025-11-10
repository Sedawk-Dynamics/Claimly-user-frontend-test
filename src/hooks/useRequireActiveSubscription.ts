import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import { SubscriptionStatus } from '../types';

const CACHE_KEY = 'subscription-status-cache';
const CACHE_TTL_MS = 60 * 1000;

type CachedSubscription = {
  status: SubscriptionStatus;
  timestamp: number;
};

let pendingSubscriptionCheck: Promise<SubscriptionStatus> | null = null;

function readCachedSubscription(): SubscriptionStatus | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached: CachedSubscription = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.status;
  } catch (error) {
    console.warn('Failed to parse cached subscription status', error);
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCachedSubscription(status: SubscriptionStatus) {
  try {
    const payload: CachedSubscription = {
      status,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to store subscription status cache', error);
  }
}

export function useRequireActiveSubscription() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveStatus = async () => {
      const cached = readCachedSubscription();
      if (cached) {
        if (cached.status !== 'ACTIVE') {
          navigate('/subscription-offering', { replace: true });
          return;
        }
        if (isMounted) {
          setChecking(false);
        }
        return;
      }

      try {
        if (!pendingSubscriptionCheck) {
          pendingSubscriptionCheck = userService.getSubscription() as Promise<SubscriptionStatus>;
        }

        const status = await pendingSubscriptionCheck;
        writeCachedSubscription(status);

        if (status.status !== 'ACTIVE') {
          navigate('/subscription-offering', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Failed to verify subscription status', error);
      } finally {
        pendingSubscriptionCheck = null;
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    resolveStatus();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return { checking };
}

