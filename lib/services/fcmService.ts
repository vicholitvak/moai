import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from '@/lib/firebase/client';
import { NotificationService } from './notificationService';

export class FCMService {
  private static messaging: Messaging | null = null;
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';
  private static isInitialized = false;
  private static token: string | null = null;

  /**
   * Initialize Firebase Cloud Messaging
   */
  static async initialize(): Promise<void> {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      // Initialize messaging
      this.messaging = getMessaging(app);
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      }

      // Get FCM token
      await this.getToken();

      // Setup message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('FCM Service initialized successfully');

    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }

  /**
   * Get FCM token for the current device
   */
  static async getToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const currentToken = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        this.token = currentToken;
        
        // Save token to user profile in Firestore
        await this.saveTokenToDatabase(currentToken);
        
        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to database for the current user
   */
  private static async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // Save to Firestore
      const response = await fetch('/api/fcm/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          platform: 'web',
          lastUpdated: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token');
      }

      console.log('FCM token saved to database');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Setup handlers for foreground messages
   */
  private static setupMessageHandlers(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Create notification using NotificationService
      if (payload.notification) {
        const { title, body } = payload.notification;
        const data = payload.data || {};

        // Map FCM notification to our notification system
        NotificationService.create({
          title: title || 'Nueva notificación',
          message: body || '',
          type: this.getNotificationType(data.type),
          priority: data.priority as 'low' | 'medium' | 'high' || 'medium',
          category: data.category as any || 'system',
          metadata: data,
          action: data.actionUrl ? {
            label: 'Ver detalles',
            onClick: () => window.location.href = data.actionUrl
          } : undefined
        });
      }
    });
  }

  /**
   * Map FCM notification type to our system type
   */
  private static getNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' {
    const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
      'order_accepted': 'success',
      'order_ready': 'success',
      'order_delivered': 'success',
      'order_cancelled': 'error',
      'payment_success': 'success',
      'payment_failed': 'error',
      'promotion': 'info',
      'system': 'info'
    };
    return typeMap[type] || 'info';
  }

  /**
   * Subscribe to a topic for grouped notifications
   */
  static async subscribeToTopic(topic: string): Promise<void> {
    if (!this.token) {
      await this.getToken();
    }

    if (!this.token) {
      console.error('No FCM token available');
      return;
    }

    try {
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          topic
        })
      });

      if (response.ok) {
        console.log(`Subscribed to topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  static async unsubscribeFromTopic(topic: string): Promise<void> {
    if (!this.token) return;

    try {
      const response = await fetch('/api/fcm/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          topic
        })
      });

      if (response.ok) {
        console.log(`Unsubscribed from topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  static async sendNotificationToUser(
    userId: string, 
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send notification for order status update
   */
  static async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string
  ): Promise<void> {
    const statusMessages: Record<string, { title: string; body: string }> = {
      accepted: {
        title: '¡Pedido Aceptado! ✅',
        body: 'Tu pedido ha sido aceptado y está siendo preparado'
      },
      preparing: {
        title: 'Preparando tu pedido 👨‍🍳',
        body: 'Tu deliciosa comida está siendo preparada con amor'
      },
      ready: {
        title: '¡Pedido Listo! 📦',
        body: 'Tu pedido está listo para ser recogido'
      },
      delivering: {
        title: 'En camino 🚚',
        body: 'Tu pedido está en camino. ¡Prepárate para disfrutar!'
      },
      delivered: {
        title: '¡Entregado! 🎉',
        body: 'Tu pedido ha sido entregado. ¡Que lo disfrutes!'
      },
      cancelled: {
        title: 'Pedido Cancelado ❌',
        body: 'Tu pedido ha sido cancelado. Contacta soporte si necesitas ayuda'
      }
    };

    const message = statusMessages[status];
    if (!message) return;

    await this.sendNotificationToUser(userId, {
      ...message,
      data: {
        type: `order_${status}`,
        orderId,
        actionUrl: `/orders/${orderId}`,
        priority: 'high',
        category: 'order'
      }
    });
  }

  /**
   * Send promotional notification
   */
  static async sendPromotionalNotification(
    topic: string,
    promotion: {
      title: string;
      description: string;
      discount: number;
      code: string;
      expiresAt: string;
    }
  ): Promise<void> {
    try {
      const response = await fetch('/api/fcm/send-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          notification: {
            title: `🎉 ${promotion.title}`,
            body: `${promotion.description} - Usa el código ${promotion.code} para ${promotion.discount}% de descuento`,
            image: '/images/promotion-banner.jpg'
          },
          data: {
            type: 'promotion',
            code: promotion.code,
            discount: promotion.discount.toString(),
            expiresAt: promotion.expiresAt,
            actionUrl: '/promotions',
            priority: 'low',
            category: 'promotion'
          }
        })
      });

      if (response.ok) {
        console.log('Promotional notification sent');
      }
    } catch (error) {
      console.error('Error sending promotional notification:', error);
    }
  }

  /**
   * Get current user ID (helper method)
   */
  private static getCurrentUserId(): string | null {
    try {
      // Try to get from auth context if available
      const authContext = (window as any).__AUTH_CONTEXT__;
      if (authContext?.user?.uid) {
        return authContext.user.uid;
      }
      
      // Fallback to localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.uid || null;
    } catch (error) {
      console.warn('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Check if FCM is supported and initialized
   */
  static isSupported(): boolean {
    return this.isInitialized && this.token !== null;
  }

  /**
   * Get current FCM token
   */
  static getCurrentToken(): string | null {
    return this.token;
  }

  /**
   * Refresh FCM token
   */
  static async refreshToken(): Promise<string | null> {
    this.token = null;
    return await this.getToken();
  }
}