'use client';

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';

export interface NotificationSettings {
  userId: string;
  fcmToken?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  preferences: {
    orderUpdates: boolean;
    promotions: boolean;
    newDishes: boolean;
    deliveryUpdates: boolean;
    messages: boolean;
    reviews: boolean;
  };
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
  };
  lastUpdated: Timestamp;
}

export interface NotificationMessage {
  id?: string;
  userId: string;
  type: 'order_update' | 'delivery_update' | 'promotion' | 'new_dish' | 'message' | 'review' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high';
  scheduled?: Timestamp;
  sent: boolean;
  read: boolean;
  createdAt: Timestamp;
  sentAt?: Timestamp;
  readAt?: Timestamp;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private static messaging: any = null;
  private static isSupported = false;

  // Initialize Firebase Messaging
  static async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;

      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      // Check if Firebase Messaging is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker is not supported');
        return false;
      }

      this.messaging = getMessaging();
      this.isSupported = true;

      // Set up message listener for foreground messages
      this.setupForegroundListener();

      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  // Request notification permission and get FCM token
  static async requestPermission(userId: string): Promise<string | null> {
    try {
      if (!this.isSupported) {
        await this.initialize();
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        // Save token to user settings
        await this.updateUserToken(userId, token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  // Update user FCM token
  static async updateUserToken(userId: string, token: string): Promise<void> {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, {
          fcmToken: token,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Create default notification settings
        const defaultSettings: NotificationSettings = {
          userId,
          fcmToken: token,
          emailNotifications: true,
          pushNotifications: true,
          preferences: {
            orderUpdates: true,
            promotions: true,
            newDishes: true,
            deliveryUpdates: true,
            messages: true,
            reviews: true
          },
          schedule: {
            startTime: '08:00',
            endTime: '22:00',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          lastUpdated: Timestamp.now()
        };

        await setDoc(settingsRef, defaultSettings);
      }
    } catch (error) {
      console.error('Error updating user token:', error);
    }
  }

  // Get user notification settings
  static async getUserSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));
      
      if (settingsDoc.exists()) {
        return { id: settingsDoc.id, ...settingsDoc.data() } as NotificationSettings;
      }

      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Update user notification settings
  static async updateUserSettings(userId: string, settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      await updateDoc(settingsRef, {
        ...settings,
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
  }

  // Send notification to specific user
  static async sendToUser(userId: string, notification: Omit<NotificationMessage, 'id' | 'userId' | 'sent' | 'read' | 'createdAt'>): Promise<string | null> {
    try {
      // Check user notification preferences
      const settings = await this.getUserSettings(userId);
      
      if (!settings || !settings.pushNotifications) {
        console.log('User has disabled push notifications');
        return null;
      }

      // Check if notification type is allowed
      const typeMap: { [key: string]: keyof NotificationSettings['preferences'] } = {
        'order_update': 'orderUpdates',
        'delivery_update': 'deliveryUpdates',
        'promotion': 'promotions',
        'new_dish': 'newDishes',
        'message': 'messages',
        'review': 'reviews'
      };

      const preferenceKey = typeMap[notification.type];
      if (preferenceKey && !settings.preferences[preferenceKey]) {
        console.log(`User has disabled ${notification.type} notifications`);
        return null;
      }

      // Check notification schedule
      if (!this.isWithinSchedule(settings.schedule)) {
        // Schedule for later if not urgent
        if (notification.priority !== 'high') {
          return await this.scheduleNotification(userId, notification);
        }
      }

      // Create notification document
      const notificationData: NotificationMessage = {
        ...notification,
        userId,
        sent: false,
        read: false,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);

      // Send via Firebase Cloud Messaging (this would typically be done server-side)
      if (settings.fcmToken) {
        // In a real implementation, this would call your backend API
        // which would use Firebase Admin SDK to send the push notification
        console.log('Would send FCM notification to token:', settings.fcmToken);
        
        // For now, we'll show a browser notification if possible
        this.showBrowserNotification({
          title: notification.title,
          body: notification.body,
          icon: '/icon-192.png',
          tag: notification.type,
          data: notification.data
        });

        // Mark as sent
        await updateDoc(docRef, {
          sent: true,
          sentAt: Timestamp.now()
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Send notification to multiple users
  static async sendToUsers(userIds: string[], notification: Omit<NotificationMessage, 'id' | 'userId' | 'sent' | 'read' | 'createdAt'>): Promise<string[]> {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, notification))
      );

      return results
        .filter((result): result is PromiseFulfilledResult<string> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return [];
    }
  }

  // Schedule notification for later
  static async scheduleNotification(userId: string, notification: Omit<NotificationMessage, 'id' | 'userId' | 'sent' | 'read' | 'createdAt'>, scheduleTime?: Date): Promise<string | null> {
    try {
      const settings = await this.getUserSettings(userId);
      
      let scheduledTime = scheduleTime;
      if (!scheduledTime && settings) {
        // Schedule for next allowed time
        scheduledTime = this.getNextAllowedTime(settings.schedule);
      }

      const notificationData: NotificationMessage = {
        ...notification,
        userId,
        sent: false,
        read: false,
        scheduled: scheduledTime ? Timestamp.fromDate(scheduledTime) : undefined,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationMessage[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const notifications = await getDocs(notificationsQuery);
      return notifications.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationMessage));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const unreadNotifications = await getDocs(unreadQuery);
      
      const updatePromises = unreadNotifications.docs.map(doc =>
        updateDoc(doc.ref, {
          read: true,
          readAt: Timestamp.now()
        })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const unreadNotifications = await getDocs(unreadQuery);
      return unreadNotifications.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Show browser notification
  private static showBrowserNotification(payload: PushNotificationPayload): void {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          image: payload.image,
          badge: payload.badge,
          tag: payload.tag,
          data: payload.data,
          requireInteraction: false,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          
          // Handle action based on notification data
          if (payload.data?.actionUrl) {
            window.location.href = payload.data.actionUrl;
          }
        };

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  // Setup foreground message listener
  private static setupForegroundListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);

      // Show notification when app is in foreground
      if (payload.notification) {
        this.showBrowserNotification({
          title: payload.notification.title || 'Moai',
          body: payload.notification.body || '',
          icon: payload.notification.icon,
          image: payload.notification.image,
          data: payload.data
        });
      }
    });
  }

  // Check if current time is within user's notification schedule
  private static isWithinSchedule(schedule: NotificationSettings['schedule']): boolean {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
    } catch (error) {
      console.error('Error checking schedule:', error);
      return true; // Default to allowing notifications
    }
  }

  // Get next allowed time based on user schedule
  private static getNextAllowedTime(schedule: NotificationSettings['schedule']): Date {
    const now = new Date();
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    
    const nextAllowed = new Date(now);
    nextAllowed.setHours(startHour, startMinute, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextAllowed <= now) {
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    
    return nextAllowed;
  }

  // Notification templates for common use cases
  static getNotificationTemplate(type: string, data: any): Omit<NotificationMessage, 'id' | 'userId' | 'sent' | 'read' | 'createdAt'> {
    switch (type) {
      case 'order_confirmed':
        return {
          type: 'order_update',
          title: '¡Pedido confirmado!',
          body: `Tu pedido #${data.orderId} ha sido confirmado y está siendo preparado.`,
          data: { orderId: data.orderId, actionUrl: `/orders/${data.orderId}` },
          priority: 'high'
        };

      case 'order_ready':
        return {
          type: 'order_update',
          title: '¡Tu pedido está listo!',
          body: `Tu pedido #${data.orderId} está listo para entrega.`,
          data: { orderId: data.orderId, actionUrl: `/orders/${data.orderId}` },
          priority: 'high'
        };

      case 'driver_assigned':
        return {
          type: 'delivery_update',
          title: 'Conductor asignado',
          body: `${data.driverName} está en camino a recoger tu pedido.`,
          data: { orderId: data.orderId, driverId: data.driverId, actionUrl: `/orders/${data.orderId}` },
          priority: 'normal'
        };

      case 'out_for_delivery':
        return {
          type: 'delivery_update',
          title: '¡En camino!',
          body: `Tu pedido #${data.orderId} está en camino. Tiempo estimado: ${data.estimatedTime} min.`,
          data: { orderId: data.orderId, actionUrl: `/orders/${data.orderId}` },
          priority: 'high'
        };

      case 'delivered':
        return {
          type: 'delivery_update',
          title: '¡Pedido entregado!',
          body: `Tu pedido #${data.orderId} ha sido entregado. ¡Disfruta tu comida!`,
          data: { orderId: data.orderId, actionUrl: `/orders/${data.orderId}` },
          priority: 'normal'
        };

      case 'new_message':
        return {
          type: 'message',
          title: `Mensaje de ${data.senderName}`,
          body: data.messagePreview,
          data: { conversationId: data.conversationId, actionUrl: `/messages/${data.conversationId}` },
          priority: 'normal'
        };

      case 'promotion':
        return {
          type: 'promotion',
          title: data.title,
          body: data.description,
          imageUrl: data.imageUrl,
          data: { promotionId: data.promotionId, actionUrl: data.actionUrl },
          priority: 'low'
        };

      case 'new_dish':
        return {
          type: 'new_dish',
          title: '¡Nuevo plato disponible!',
          body: `${data.cookName} ha agregado "${data.dishName}" a su menú.`,
          imageUrl: data.dishImage,
          data: { dishId: data.dishId, cookId: data.cookId, actionUrl: `/dishes/${data.dishId}` },
          priority: 'low'
        };

      default:
        return {
          type: 'system',
          title: 'Notificación',
          body: 'Tienes una nueva notificación en Moai.',
          priority: 'normal'
        };
    }
  }

  // Send order status notifications
  static async sendOrderNotification(userId: string, orderId: string, status: string, additionalData?: any): Promise<void> {
    const template = this.getNotificationTemplate(`order_${status}`, { orderId, ...additionalData });
    await this.sendToUser(userId, template);
  }

  // Send delivery notifications
  static async sendDeliveryNotification(userId: string, orderId: string, status: string, additionalData?: any): Promise<void> {
    const template = this.getNotificationTemplate(status, { orderId, ...additionalData });
    await this.sendToUser(userId, template);
  }
}