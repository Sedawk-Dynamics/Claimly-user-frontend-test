import { messaging } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import api from './api';
import { registerServiceWorker } from '../utils/serviceWorkerRegistration';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  try {
    // Register service worker first
    const registration = await registerServiceWorker();
    
    // Wait a bit for service worker to be ready, then send config
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Send Firebase config to service worker
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    // Send config to service worker and ensure it's received
    const sendConfigToSW = async (sw: ServiceWorker) => {
      return new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data === 'CONFIG_RECEIVED') {
            resolve();
          }
        };
        
        sw.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        }, [channel.port2]);
        
        // Timeout after 1 second
        setTimeout(() => resolve(), 1000);
      });
    };

    // Try to send to active service worker
    if (registration?.active) {
      await sendConfigToSW(registration.active);
    } else if (registration?.waiting) {
      await sendConfigToSW(registration.waiting);
    } else if (registration?.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', async function() {
          if (this.state === 'activated' && registration.active) {
            await sendConfigToSW(registration.active);
            resolve();
          }
        });
      });
    }
    
    // Also listen for service worker updates and send config
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', async () => {
            if (newWorker.state === 'activated' && registration.active) {
              await sendConfigToSW(registration.active);
            }
          });
        }
      });
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.warn('No registration token available');
      return null;
    }

    console.log('FCM registration token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 */
export async function registerFCMToken(token: string): Promise<void> {
  try {
    await api.post('/user/fcm-token', { token });
    console.log('FCM token registered successfully');
  } catch (error: any) {
    console.error('Failed to register FCM token:', error);
    throw error;
  }
}

/**
 * Unregister FCM token from backend
 */
export async function unregisterFCMToken(): Promise<void> {
  try {
    await api.delete('/user/fcm-token');
    console.log('FCM token unregistered successfully');
  } catch (error: any) {
    console.error('Failed to unregister FCM token:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Set up foreground message handler
 * This handles notifications when the app is in the foreground
 */
export function setupForegroundMessageHandler(
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  if (!messaging) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      onMessageReceived(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return null;
  }
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    messaging !== null
  );
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

