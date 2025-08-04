'use client';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerRegistered: boolean;
}

export interface OrderNotificationData {
  orderId: string;
  orderStatus: string;
  cookerName?: string;
  driverName?: string;
  eta?: string;
  message?: string;
  url?: string;
}

export class PushNotificationService {
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private static isInitialized = false;

  // Initialize the push notification service
  static async initialize(): Promise<NotificationPermissionState> {
    try {
      // Check if service workers and notifications are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return {
          permission: 'denied',
          supported: false,
          serviceWorkerRegistered: false
        };
      }

      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return {
          permission: 'denied',
          supported: false,
          serviceWorkerRegistered: false
        };
      }

      // Register service worker
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', this.serviceWorkerRegistration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        this.isInitialized = true;
        
        // Set up message listener for service worker updates
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
        
        return {
          permission: Notification.permission,
          supported: true,
          serviceWorkerRegistered: true
        };
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return {
          permission: Notification.permission,
          supported: true,
          serviceWorkerRegistered: false
        };
      }
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return {
        permission: 'denied',
        supported: false,
        serviceWorkerRegistered: false
      };
    }
  }

  // Request notification permission from user
  static async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
      }

      if (Notification.permission === 'granted') {
        return 'granted';
      }

      if (Notification.permission === 'denied') {
        console.warn('Notification permission denied by user');
        return 'denied';
      }

      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      return permission;
      
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Show a local notification (fallback for when service worker isn't available)
  static async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      const defaultOptions: NotificationOptions = {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      };

      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 8 seconds unless requireInteraction is true
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 8000);
      }

      // Handle click event
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        
        // Navigate to URL if provided
        if (options.data && options.data.url) {
          window.focus();
          window.location.href = options.data.url;
        } else {
          window.focus();
        }
      };
      
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Show notification via service worker
  static async showServiceWorkerNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.warn('Service Worker not registered, falling back to local notification');
        return this.showLocalNotification(title, options);
      }

      await this.serviceWorkerRegistration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      });
      
    } catch (error) {
      console.error('Error showing service worker notification:', error);
      // Fallback to local notification
      return this.showLocalNotification(title, options);
    }
  }

  // Show order-specific notification
  static async showOrderNotification(data: OrderNotificationData): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      let title = 'Moai - Actualización de Pedido';
      let body = 'Tu pedido ha sido actualizado';
      let icon = '/icon-192x192.png';
      let requireInteraction = false;
      let vibrate: number[] = [200, 100, 200];
      let actions: NotificationAction[] = [];

      // Customize based on order status
      switch (data.orderStatus) {
        case 'accepted':
          title = '✅ Pedido Confirmado';
          body = `Tu pedido #${data.orderId.slice(-8)} ha sido confirmado${data.cookerName ? ` por ${data.cookerName}` : ''}`;
          icon = '/notifications/accepted.png';
          actions = [
            { action: 'view', title: 'Ver Pedido' }
          ];
          break;

        case 'preparing':
          title = '👨‍🍳 Preparando tu Pedido';
          body = `${data.cookerName || 'El cocinero'} está preparando tu pedido. ¡Ya casi está listo!`;
          icon = '/notifications/preparing.png';
          actions = [
            { action: 'track', title: 'Ver Progreso' }
          ];
          break;

        case 'ready':
          title = '🍽️ ¡Pedido Listo!';
          body = 'Tu comida está lista. Buscando conductor para la entrega.';
          icon = '/notifications/ready.png';
          vibrate = [300, 100, 300, 100, 300];
          requireInteraction = true;
          break;

        case 'delivering':
          title = '🚗 Conductor Asignado';
          body = `${data.driverName || 'Un conductor'} está en camino con tu pedido${data.eta ? `. ETA: ${data.eta}` : ''}`;
          icon = '/notifications/delivering.png';
          actions = [
            { action: 'track', title: 'Seguir en Tiempo Real' }
          ];
          vibrate = [200, 100, 200];
          requireInteraction = true;
          break;

        case 'delivered':
          title = '🎉 ¡Pedido Entregado!';
          body = '¡Disfruta tu comida! No olvides calificar tu experiencia.';
          icon = '/notifications/delivered.png';
          actions = [
            { action: 'rate', title: 'Calificar' }
          ];
          vibrate = [300, 100, 300, 100, 300, 100, 300];
          requireInteraction = true;
          break;

        case 'cancelled':
          title = '❌ Pedido Cancelado';
          body = 'Tu pedido ha sido cancelado. Te reembolsaremos el dinero.';
          icon = '/notifications/cancelled.png';
          actions = [
            { action: 'support', title: 'Contactar Soporte' }
          ];
          break;

        default:
          body = data.message || 'Tu pedido ha sido actualizado';
      }

      const options: NotificationOptions = {
        body,
        icon,
        badge: '/icon-96x96.png',
        vibrate,
        requireInteraction,
        actions,
        data: {
          orderId: data.orderId,
          orderStatus: data.orderStatus,
          url: data.url || `/orders/${data.orderId}/tracking`,
          timestamp: Date.now()
        },
        tag: `order-${data.orderId}`, // Replace previous notifications for same order
        renotify: true
      };

      // Use service worker notification if available, otherwise local
      if (this.serviceWorkerRegistration) {
        await this.showServiceWorkerNotification(title, options);
      } else {
        await this.showLocalNotification(title, options);
      }

    } catch (error) {
      console.error('Error showing order notification:', error);
    }
  }

  // Check current permission status
  static getPermissionStatus(): NotificationPermissionState {
    return {
      permission: 'Notification' in window ? Notification.permission : 'denied',
      supported: 'Notification' in window && 'serviceWorker' in navigator,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration
    };
  }

  // Test notification
  static async showTestNotification(): Promise<void> {
    await this.showOrderNotification({
      orderId: 'test-order-123',
      orderStatus: 'delivering',
      driverName: 'Juan Pérez',
      eta: '15 min',
      message: 'Esta es una notificación de prueba'
    });
  }

  // Handle service worker messages
  private static handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log('Received message from service worker:', event.data);
    
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      // Handle notification click if needed
      console.log('Notification was clicked:', event.data);
    }
  };

  // Clean up
  static cleanup(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }
  }

  // Enable/disable notifications (for user settings)
  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      // Store user preference in localStorage
      localStorage.setItem('moai-notifications-enabled', enabled.toString());
      
      if (enabled && Notification.permission !== 'granted') {
        await this.requestPermission();
      }
      
      console.log('Notifications', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Error setting notification preference:', error);
    }
  }

  // Check if notifications are enabled by user
  static areNotificationsEnabled(): boolean {
    const stored = localStorage.getItem('moai-notifications-enabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }
}

// Export default instance
export default PushNotificationService;