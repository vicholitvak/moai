// Service Worker for Push Notifications
const CACHE_NAME = 'moai-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache opened');
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other essential resources here
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let data = {};
  let title = 'Moai - Actualización de Pedido';
  let options = {
    body: 'Tu pedido ha sido actualizado',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {},
    actions: [],
    requireInteraction: false,
    silent: false,
  };

  if (event.data) {
    try {
      data = event.data.json();
      
      // Customize notification based on order status
      switch (data.orderStatus) {
        case 'accepted':
          title = '✅ Pedido Confirmado';
          options.body = `Tu pedido #${data.orderId?.slice(-8)} ha sido confirmado por ${data.cookerName}`;
          options.icon = '/notifications/accepted.png';
          options.actions = [
            { action: 'view', title: 'Ver Pedido', icon: '/icons/view.png' }
          ];
          break;
          
        case 'preparing':
          title = '👨‍🍳 Preparando tu Pedido';
          options.body = `${data.cookerName} está cocinando tu pedido. ¡Ya casi está listo!`;
          options.icon = '/notifications/preparing.png';
          options.actions = [
            { action: 'track', title: 'Ver Progreso', icon: '/icons/track.png' }
          ];
          break;
          
        case 'ready':
          title = '🍽️ ¡Pedido Listo!';
          options.body = 'Tu comida está lista. Buscando conductor para la entrega.';
          options.icon = '/notifications/ready.png';
          options.vibrate = [300, 100, 300, 100, 300];
          options.requireInteraction = true;
          break;
          
        case 'delivering':
          title = '🚗 Conductor Asignado';
          options.body = `${data.driverName} está en camino con tu pedido. ETA: ${data.eta || '30 min'}`;
          options.icon = '/notifications/delivering.png';
          options.actions = [
            { action: 'track', title: 'Seguir en Tiempo Real', icon: '/icons/location.png' },
            { action: 'call', title: 'Llamar Conductor', icon: '/icons/phone.png' }
          ];
          options.vibrate = [200, 100, 200];
          options.requireInteraction = true;
          break;
          
        case 'delivered':
          title = '🎉 ¡Pedido Entregado!';
          options.body = '¡Disfruta tu comida! No olvides calificar tu experiencia.';
          options.icon = '/notifications/delivered.png';
          options.actions = [
            { action: 'rate', title: 'Calificar', icon: '/icons/star.png' },
            { action: 'reorder', title: 'Pedir de Nuevo', icon: '/icons/reorder.png' }
          ];
          options.vibrate = [300, 100, 300, 100, 300, 100, 300];
          options.requireInteraction = true;
          break;
          
        case 'cancelled':
          title = '❌ Pedido Cancelado';
          options.body = 'Tu pedido ha sido cancelado. Te reembolsaremos el dinero.';
          options.icon = '/notifications/cancelled.png';
          options.actions = [
            { action: 'support', title: 'Contactar Soporte', icon: '/icons/support.png' }
          ];
          break;
          
        default:
          title = 'Moai - Actualización';
          options.body = data.message || 'Tu pedido ha sido actualizado';
      }
      
      // Add order data for click handling
      options.data = {
        orderId: data.orderId,
        orderStatus: data.orderStatus,
        url: data.url || `/orders/${data.orderId}/tracking`,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('Service Worker: Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  let urlToOpen = '/';
  
  if (data && data.orderId) {
    switch (action) {
      case 'view':
      case 'track':
        urlToOpen = `/orders/${data.orderId}/tracking`;
        break;
      case 'call':
        // Could open a calling interface or show driver contact
        urlToOpen = `/orders/${data.orderId}/tracking#contact`;
        break;
      case 'rate':
        urlToOpen = `/orders/${data.orderId}/review`;
        break;
      case 'reorder':
        urlToOpen = `/dishes?reorder=${data.orderId}`;
        break;
      case 'support':
        urlToOpen = '/support';
        break;
      default:
        urlToOpen = data.url || `/orders/${data.orderId}/tracking`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'order-status-sync') {
    event.waitUntil(syncOrderStatus());
  }
});

// Function to sync order status when back online
async function syncOrderStatus() {
  try {
    // This would typically fetch latest order status from the server
    // and show notifications for any missed updates
    console.log('Service Worker: Syncing order status');
    
    // Implementation would depend on your backend API
    // For now, we'll just log that sync happened
  } catch (error) {
    console.error('Service Worker: Error syncing order status:', error);
  }
}

// Message event - Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});