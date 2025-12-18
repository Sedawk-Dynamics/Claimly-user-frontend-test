// Service Worker for Firebase Cloud Messaging
// This file must be in the public directory to be accessible

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase configuration - will be set by the main app via postMessage or injected at build time
// NOTE: This will be replaced by Vite plugin during build with actual config
let firebaseConfig = null;
let messaging = null;
let isFirebaseInitialized = false;

// Initialize Firebase immediately if config is available (from build-time injection)
// This ensures notifications work even when browser is closed
// The Vite build plugin will replace firebaseConfig = null with the actual config object
if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      
      // Set up background message handler immediately
      messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message via FCM', payload);
        handleNotification(payload);
      });
      
      isFirebaseInitialized = true;
      console.log('[SW] Firebase initialized with build-time config - ready for background notifications');
    }
  } catch (error) {
    console.error('[SW] Error initializing Firebase on load:', error);
  }
}

// Listen for config from main app (runtime config)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

// Initialize Firebase when service worker activates (try to get stored config)
self.addEventListener('activate', (event) => {
  // If config is already available, initialize
  if (firebaseConfig && firebaseConfig.apiKey && !isFirebaseInitialized) {
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.warn('[SW] Firebase config not available');
    return;
  }

  if (isFirebaseInitialized) {
    return;
  }

  try {
    // Initialize Firebase if not already initialized
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      console.log('[SW] Firebase initialized successfully');
    }

    // Get messaging instance
    if (!messaging) {
      messaging = firebase.messaging();
      
      // Set up background message handler
      messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message via FCM', payload);
        handleNotification(payload);
      });
      
      console.log('[SW] Messaging handler set up');
      isFirebaseInitialized = true;
    }
  } catch (error) {
    console.error('[SW] Firebase initialization error:', error);
  }
}

function handleNotification(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.notificationId || 'notification',
    data: {
      url: payload.data?.url || '/notifications',
      notificationId: payload.data?.notificationId,
    },
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
}

// Handle push events - Firebase will handle via onBackgroundMessage if initialized
// This is a fallback for cases where Firebase isn't initialized yet
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  // If Firebase is initialized, it will handle the message via onBackgroundMessage
  // We still need this listener to ensure the event is handled
  if (isFirebaseInitialized && messaging) {
    // Firebase's onBackgroundMessage will handle it
    console.log('[SW] Push event will be handled by Firebase onBackgroundMessage');
    return;
  }
  
  // Fallback: Try to initialize Firebase if config is available
  if (firebaseConfig && firebaseConfig.apiKey && !isFirebaseInitialized) {
    initializeFirebase();
    // If initialization succeeds, Firebase will handle the message
    if (isFirebaseInitialized) {
      return;
    }
  }
  
  // Last resort: Handle push event directly
  let payload;
  try {
    if (event.data) {
      payload = event.data.json();
    } else {
      console.warn('[SW] Push event has no data and Firebase not initialized');
      return;
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    return;
  }
  
  // Show notification directly
  event.waitUntil(handleNotification(payload));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      const urlToOpen = event.notification.data?.url || '/notifications';
      const fullUrl = self.location.origin + urlToOpen;
      
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === fullUrl || client.url.includes(urlToOpen)) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
