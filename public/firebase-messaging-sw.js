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
function tryInitializeFirebase() {
  if (firebaseConfig && firebaseConfig.apiKey && !isFirebaseInitialized) {
    try {
      if (typeof firebase !== 'undefined') {
        // Initialize Firebase app if not already initialized
        if (firebase.apps.length === 0) {
          firebase.initializeApp(firebaseConfig);
          console.log('[SW] Firebase app initialized');
        }
        
        // Get messaging instance
        messaging = firebase.messaging();
        
        // Set up background message handler - CRITICAL for notifications when app is closed
        messaging.onBackgroundMessage((payload) => {
          console.log('[SW] Received background message via FCM', payload);
          return handleNotification(payload);
        });
        
        isFirebaseInitialized = true;
        console.log('[SW] Firebase Messaging initialized - ready for background notifications');
      }
    } catch (error) {
      console.error('[SW] Error initializing Firebase on load:', error);
    }
  }
}

// Try to initialize immediately if config is available
tryInitializeFirebase();

// Install event - ensure service worker is installed properly
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Listen for config from main app (runtime config)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    console.log('[SW] Received Firebase config from main app');
    tryInitializeFirebase();
    
    // Send confirmation back to main app
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage('CONFIG_RECEIVED');
    }
  }
});

// Initialize Firebase when service worker activates
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  // Try to initialize if config is available
  tryInitializeFirebase();
  
  // Take control of all pages immediately
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[SW] Service worker is controlling all clients');
    })
  );
});

// This function is now replaced by tryInitializeFirebase()
// Keeping for backward compatibility
function initializeFirebase() {
  tryInitializeFirebase();
}

function handleNotification(payload) {
  console.log('[SW] Handling notification:', payload);
  
  // Extract notification data - support both notification and data payloads
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationBody = payload.notification?.body || payload.data?.message || 'You have a new notification';
  const notificationId = payload.data?.notificationId || payload.notificationId || 'notification';
  const url = payload.data?.url || '/notifications';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: notificationId, // Use notificationId as tag to prevent duplicates
    data: {
      url: url,
      notificationId: notificationId,
      click_action: url, // For compatibility
    },
    requireInteraction: false,
    silent: false,
    // Add vibrate pattern for mobile devices
    vibrate: [200, 100, 200],
    // Add timestamp
    timestamp: Date.now(),
  };

  console.log('[SW] Showing notification:', notificationTitle, notificationOptions);
  
  // Return promise to ensure notification is shown
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[SW] Notification shown successfully');
    })
    .catch((error) => {
      console.error('[SW] Error showing notification:', error);
    });
}

// Handle push events - Firebase will handle via onBackgroundMessage if initialized
// This is a fallback for cases where Firebase isn't initialized yet
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received', event);
  
  // Try to initialize Firebase if config is available but not initialized
  if (firebaseConfig && firebaseConfig.apiKey && !isFirebaseInitialized) {
    tryInitializeFirebase();
  }
  
  // If Firebase is initialized, it will handle the message via onBackgroundMessage
  // But we still need to wait for the event to ensure it's processed
  if (isFirebaseInitialized && messaging) {
    console.log('[SW] Push event will be handled by Firebase onBackgroundMessage');
    // Firebase's onBackgroundMessage will handle it automatically
    // We just need to keep the event alive
    event.waitUntil(Promise.resolve());
    return;
  }
  
  // Fallback: Handle push event directly if Firebase isn't initialized
  let payload;
  try {
    if (event.data) {
      payload = event.data.json();
      console.log('[SW] Parsed push payload:', payload);
    } else {
      console.warn('[SW] Push event has no data');
      // Create a default payload
      payload = {
        notification: {
          title: 'New Notification',
          body: 'You have a new notification',
        },
        data: {
          url: '/notifications',
        },
      };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    // Create a default payload on error
    payload = {
      notification: {
        title: 'New Notification',
        body: 'You have a new notification',
      },
      data: {
        url: '/notifications',
      },
    };
  }
  
  // Show notification directly - this ensures notifications work even if Firebase fails
  event.waitUntil(handleNotification(payload));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received', event);
  
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || 
                    event.notification.data?.click_action || 
                    '/notifications';
  const fullUrl = self.location.origin + urlToOpen;
  
  console.log('[SW] Opening URL:', fullUrl);

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Check if client URL matches our app
        if (client.url.startsWith(self.location.origin)) {
          // Focus existing window and navigate to notifications
          if ('focus' in client) {
            client.focus();
            // Navigate to notifications page if not already there
            if (client.url !== fullUrl && 'navigate' in client) {
              client.navigate(fullUrl);
            }
            return Promise.resolve();
          }
        }
      }
      
      // No existing window found, open new window
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
      
      return Promise.resolve();
    }).catch((error) => {
      console.error('[SW] Error handling notification click:', error);
    })
  );
});

