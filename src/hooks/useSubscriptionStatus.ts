import { useCallback, useEffect, useRef, useState } from 'react';
import { userService } from '../services/user.service';
import { SubscriptionStatus } from '../types';

const CACHE_KEY = 'subscription-status-cache';
const CACHE_TTL_MS = 60 * 1000;

type CachedSubscription = {
  status: SubscriptionStatus;
  timestamp: number;
};

let pendingSubscriptionCheck: Promise<SubscriptionStatus> | null = null;

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readCachedSubscription(): SubscriptionStatus | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached: CachedSubscription = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.status;
  } catch (error) {
    console.warn('Failed to parse cached subscription status', error);
    window.sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCachedSubscription(status: SubscriptionStatus) {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const payload: CachedSubscription = {
      status,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to store subscription status cache', error);
  }
}

export function useSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(() => readCachedSubscription());
  const [checking, setChecking] = useState(() => subscription === null);
  const isMountedRef = useRef(true);

  const fetchSubscription = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh && isStorageAvailable()) {
        window.sessionStorage.removeItem(CACHE_KEY);
      }

      let usedCached = false;

      if (!forceRefresh) {
        const cached = readCachedSubscription();
        if (cached) {
          usedCached = true;
          if (isMountedRef.current) {
            setSubscription(cached);
            setChecking(false);
          }
          if (cached.status === 'ACTIVE') {
            return cached;
          }
        }
      }

      const shouldToggleChecking = !usedCached || forceRefresh;

      if (shouldToggleChecking && isMountedRef.current) {
        setChecking(true);
      }

      try {
        if (!pendingSubscriptionCheck) {
          pendingSubscriptionCheck = userService.getSubscription() as Promise<SubscriptionStatus>;
        }

        const status = await pendingSubscriptionCheck;
        writeCachedSubscription(status);
        if (isMountedRef.current) {
          setSubscription(status);
        }
        return status;
      } catch (error) {
        console.error('Failed to fetch subscription status', error);
        return null;
      } finally {
        pendingSubscriptionCheck = null;
        if (shouldToggleChecking && isMountedRef.current) {
          setChecking(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => fetchSubscription(true), [fetchSubscription]);

  return {
    subscription,
    checking,
    refresh,
  };
}



