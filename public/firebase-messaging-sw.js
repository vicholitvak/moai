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
  '/offline',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add resources individually with error handling
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return Promise.resolve(); // Continue even if one fails
            })
          )
        );
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).catch(() => {
          // If fetch fails and it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});