// Enhanced Service Worker for Moai App with Offline Capabilities
const CACHE_NAME = 'moai-v2.1';
const RUNTIME_CACHE = 'moai-runtime-v2.1';
const IMAGE_CACHE = 'moai-images-v2.1';
const API_CACHE = 'moai-api-v2.1';
const OFFLINE_DATA = 'moai-offline-v2.1';

// Cache strategies
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const NETWORK_ONLY = 'network-only';

// Files to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/client/home',
  '/login',
  '/manifest.json',
  '/offline',
  // Add critical CSS and JS files here
  '/_next/static/css/', // Next.js CSS files
  '/_next/static/chunks/', // Next.js JS chunks
];

// API endpoints to cache
const CACHE_API_PATTERNS = [
  '/api/dishes',
  '/api/cooks',
  '/api/search',
  '/api/orders',
  '/api/reviews'
];

// Background sync tags
const SYNC_TAGS = {
  ORDERS: 'orders-sync',
  REVIEWS: 'reviews-sync',
  MESSAGES: 'messages-sync',
  FAVORITES: 'favorites-sync'
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing enhanced service worker v2.1');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.filter(url => url.startsWith('/')));
      }),
      
      // Initialize offline storage
      caches.open(OFFLINE_DATA).then((cache) => {
        console.log('SW: Initializing offline data cache');
        return cache.put('/offline-data', new Response('{}'));
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('moai-v2.1') && cacheName.startsWith('moai-')) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Store offline data for critical endpoints
      if (shouldCacheOffline(url.pathname)) {
        await storeOfflineData(url.pathname, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed for API request, trying cache:', url.pathname);
    
    // Try cache fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline data if available
    const offlineData = await getOfflineData(url.pathname);
    if (offlineData) {
      return offlineData;
    }
    
    // Return offline response for critical data
    if (isCriticalApiRequest(url.pathname)) {
      return createOfflineApiResponse(url.pathname);
    }
    
    throw error;
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image for offline
    return createPlaceholderImage();
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed for navigation, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort: basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Moai - Sin Conexión</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-container { max-width: 400px; margin: 0 auto; }
            .offline-icon { font-size: 48px; margin-bottom: 20px; }
            .offline-title { font-size: 24px; margin-bottom: 10px; color: #333; }
            .offline-message { color: #666; margin-bottom: 20px; }
            .retry-button { 
              background: #F57C00; color: white; border: none; 
              padding: 10px 20px; border-radius: 5px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">Sin Conexión</h1>
            <p class="offline-message">
              No hay conexión a internet. Algunos contenidos están disponibles offline.
            </p>
            <button class="retry-button" onclick="window.location.reload()">
              Reintentar
            </button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }
}

// Handle static requests
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first for static assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAGS.ORDERS) {
    event.waitUntil(syncOfflineOrders());
  } else if (event.tag === SYNC_TAGS.REVIEWS) {
    event.waitUntil(syncOfflineReviews());
  } else if (event.tag === SYNC_TAGS.MESSAGES) {
    event.waitUntil(syncOfflineMessages());
  } else if (event.tag === SYNC_TAGS.FAVORITES) {
    event.waitUntil(syncOfflineFavorites());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  let data = {};
  let title = 'Moai';
  let options = {
    body: 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {},
    actions: [],
    requireInteraction: false,
    silent: false,
    tag: 'moai-notification'
  };

  if (event.data) {
    try {
      data = event.data.json();
      
      // Enhanced notification customization
      switch (data.type) {
        case 'order_status':
          ({ title, options } = createOrderNotification(data));
          break;
        case 'message':
          ({ title, options } = createMessageNotification(data));
          break;
        case 'review':
          ({ title, options } = createReviewNotification(data));
          break;
        case 'promotion':
          ({ title, options } = createPromotionNotification(data));
          break;
        default:
          title = data.title || title;
          options.body = data.body || options.body;
      }
      
      options.data = data;
    } catch (error) {
      console.error('SW: Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = '/';
  
  // Determine target URL based on notification data
  if (data.orderId) {
    targetUrl = `/orders/${data.orderId}`;
  } else if (data.messageId) {
    targetUrl = `/chat/${data.chatId}`;
  } else if (data.reviewId) {
    targetUrl = `/reviews/${data.reviewId}`;
  } else if (data.url) {
    targetUrl = data.url;
  }
  
  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        targetUrl = data.viewUrl || targetUrl;
        break;
      case 'track':
        targetUrl = `/tracking/${data.orderId}`;
        break;
      case 'call':
        targetUrl = `tel:${data.phone}`;
        break;
      case 'reply':
        targetUrl = `/chat/${data.chatId}`;
        break;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Helper functions
function isImageRequest(request) {
  return request.headers.get('accept')?.includes('image') ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function shouldCacheOffline(pathname) {
  return CACHE_API_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

function isCriticalApiRequest(pathname) {
  return pathname.includes('/dishes') || 
         pathname.includes('/orders') || 
         pathname.includes('/profile');
}

async function storeOfflineData(pathname, response) {
  try {
    const cache = await caches.open(OFFLINE_DATA);
    const data = await response.json();
    
    await cache.put(
      `/offline${pathname}`,
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('SW: Error storing offline data:', error);
  }
}

async function getOfflineData(pathname) {
  try {
    const cache = await caches.open(OFFLINE_DATA);
    return await cache.match(`/offline${pathname}`);
  } catch (error) {
    console.error('SW: Error getting offline data:', error);
    return null;
  }
}

function createOfflineApiResponse(pathname) {
  let mockData = {};
  
  if (pathname.includes('/dishes')) {
    mockData = {
      dishes: [],
      message: 'Datos no disponibles offline'
    };
  } else if (pathname.includes('/orders')) {
    mockData = {
      orders: [],
      message: 'Pedidos no disponibles offline'
    };
  }
  
  return new Response(JSON.stringify(mockData), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}

function createPlaceholderImage() {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#999">
        Sin conexión
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

function createOrderNotification(data) {
  const statusMessages = {
    accepted: '✅ Pedido Confirmado',
    preparing: '👨‍🍳 Preparando tu Pedido',
    ready: '🍽️ ¡Pedido Listo!',
    delivering: '🚗 Conductor Asignado',
    delivered: '🎉 ¡Pedido Entregado!'
  };
  
  return {
    title: statusMessages[data.orderStatus] || 'Actualización de Pedido',
    options: {
      body: data.message || `Tu pedido #${data.orderId?.slice(-8)} ha sido actualizado`,
      icon: `/notifications/${data.orderStatus}.png`,
      actions: [
        { action: 'view', title: 'Ver Pedido' },
        { action: 'track', title: 'Seguir' }
      ],
      requireInteraction: ['ready', 'delivering', 'delivered'].includes(data.orderStatus)
    }
  };
}

function createMessageNotification(data) {
  return {
    title: `💬 Mensaje de ${data.senderName}`,
    options: {
      body: data.message,
      icon: data.senderAvatar || '/icon-192x192.png',
      actions: [
        { action: 'reply', title: 'Responder' },
        { action: 'view', title: 'Ver Chat' }
      ]
    }
  };
}

function createReviewNotification(data) {
  return {
    title: '⭐ Nueva Reseña',
    options: {
      body: `${data.reviewerName} dejó una reseña de ${data.rating} estrellas`,
      icon: '/notifications/review.png',
      actions: [
        { action: 'view', title: 'Ver Reseña' }
      ]
    }
  };
}

function createPromotionNotification(data) {
  return {
    title: '🎉 ' + (data.title || 'Oferta Especial'),
    options: {
      body: data.message,
      icon: '/notifications/promotion.png',
      actions: [
        { action: 'view', title: 'Ver Oferta' }
      ],
      requireInteraction: true
    }
  };
}

// Sync functions for offline data
async function syncOfflineOrders() {
  console.log('SW: Syncing offline orders');
  // Implementation for syncing offline orders
}

async function syncOfflineReviews() {
  console.log('SW: Syncing offline reviews');
  // Implementation for syncing offline reviews
}

async function syncOfflineMessages() {
  console.log('SW: Syncing offline messages');
  // Implementation for syncing offline messages
}

async function syncOfflineFavorites() {
  console.log('SW: Syncing offline favorites');
  // Implementation for syncing offline favorites
}

console.log('SW: Enhanced service worker loaded successfully');