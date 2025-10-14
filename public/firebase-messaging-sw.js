// Firebase Cloud Messaging Service Worker
importScripts('/api/firebase-config-sw');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

if (!self.__FIREBASE_CONFIG__) {
  console.error('Firebase config not detected in service worker.');
}

firebase.initializeApp(self.__FIREBASE_CONFIG__ || {});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: payload.data?.orderId || 'moai-notification',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'high',
    actions: [
      {
        action: 'view',
        title: 'Ver detalles',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the order details page
    const orderId = event.notification.data?.orderId;
    const urlToOpen = orderId ? `/orders/${orderId}` : '/client/home';
    
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Cache strategies for offline support
const CACHE_NAME = 'moai-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/styles/globals.css',
  '/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        return caches.match('/offline.html');
      })
  );
});