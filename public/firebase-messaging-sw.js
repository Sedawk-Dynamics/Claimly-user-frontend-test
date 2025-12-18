// Service Worker for Firebase Cloud Messaging
// This file must be in the public directory to be accessible

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase configuration - will be set by the main app via postMessage
let firebaseConfig = null;
let messaging = null;

// Listen for config from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig) {
    console.warn('[SW] Firebase config not received yet');
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
        console.log('[SW] Received background message', payload);
        
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
      });
      
      console.log('[SW] Messaging handler set up');
    }
  } catch (error) {
    console.error('[SW] Firebase initialization error:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
    }).then((clientList) => {
      const urlToOpen = event.notification.data?.url || '/notifications';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
