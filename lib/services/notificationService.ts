'use client';

import { toast } from 'sonner';
import { messagingPromise } from '@/lib/firebase/client';
import { getToken, onMessage } from 'firebase/messaging';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  priority: 'low' | 'medium' | 'high';
  category: 'order' | 'payment' | 'delivery' | 'system' | 'promotion';
  metadata?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

export class NotificationService {
  private static notifications: NotificationData[] = [];
  private static listeners: Set<(notifications: NotificationData[]) => void> = new Set();
  private static soundEnabled = true;
  private static pushEnabled = false;
  private static fcmToken: string | null = null;

  // Configuración de notificaciones
  static async initialize(userId?: string) {
    await this.requestPermission();
    await this.registerServiceWorker();
    await this.loadFCMToken(userId);
    this.loadPreferences();
    this.listenForegroundMessages();
  }

  private static async requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      this.pushEnabled = permission === 'granted';
    } else {
      this.pushEnabled = Notification.permission === 'granted';
    }
  }

  private static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }
    }
  }

  private static async loadFCMToken(userId?: string) {
    try {
      if (!this.pushEnabled) return;
      const messaging = await messagingPromise;
      if (!messaging) return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const token = await getToken(messaging, { vapidKey });
      if (!token) return;

      this.fcmToken = token;
      if (userId) {
        await fetch('/api/fcm/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token })
        });
      }
    } catch (error) {
      console.error('Error loading FCM token', error);
    }
  }

  private static listenForegroundMessages() {
    messagingPromise.then((messaging) => {
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'Moai';
        const body = payload.notification?.body || '';

        this.create({
          title,
          message: body,
          type: 'info',
          priority: payload.data?.priority === 'high' ? 'high' : 'medium',
          category: (payload.data?.category as NotificationData['category']) || 'system',
          metadata: payload.data ? { ...payload.data } : undefined
        });
      });
    });
  }

  private static loadPreferences() {
    const preferences = localStorage.getItem('notificationPreferences');
    if (preferences) {
      const { soundEnabled } = JSON.parse(preferences);
      this.soundEnabled = soundEnabled;
    }
  }

  static async sendPushNotification(payload: Omit<NotificationData, 'id' | 'timestamp' | 'read'> & { userId?: string; token?: string }) {
    try {
      await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Crear notificaciones
  static create(data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    const notification: NotificationData = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification);
    this.notifyListeners();
    this.showToast(notification);
    this.playSound(notification);
    this.persistNotifications();

    if (this.pushEnabled) {
      this.sendPushNotification(data);
    }

    return notification.id;
  }

  // Notificaciones específicas por rol
  static notifyOrderReceived(orderId: string, customerName: string, total: number) {
    return this.create({
      title: '¡Nuevo Pedido Recibido!',
      message: `${customerName} ha realizado un pedido por $${total.toLocaleString('es-CL')}`,
      type: 'success',
      priority: 'high',
      category: 'order',
      action: {
        label: 'Ver Pedido',
        onClick: () => window.location.href = `/cooker/dashboard?order=${orderId}`
      },
      metadata: { orderId, customerName, total }
    });
  }

  static notifyOrderStatusChange(orderId: string, status: string, role: 'cook' | 'driver' | 'customer') {
    const statusMessages = {
      accepted: 'Tu pedido ha sido aceptado y está siendo preparado',
      preparing: 'Tu pedido está siendo preparado',
      ready: '¡Tu pedido está listo para recoger!',
      delivering: 'Tu pedido está en camino',
      delivered: '¡Tu pedido ha sido entregado!'
    };

    return this.create({
      title: 'Estado del Pedido Actualizado',
      message: statusMessages[status as keyof typeof statusMessages] || `Estado: ${status}`,
      type: 'info',
      priority: 'medium',
      category: 'order',
      metadata: { orderId, status, role }
    });
  }

  static notifyPaymentSuccess(orderId: string, amount: number) {
    return this.create({
      title: 'Pago Exitoso',
      message: `Tu pago de $${amount.toLocaleString('es-CL')} ha sido procesado correctamente`,
      type: 'success',
      priority: 'high',
      category: 'payment',
      metadata: { orderId, amount }
    });
  }

  static notifyPaymentFailed(orderId: string, reason: string) {
    return this.create({
      title: 'Error en el Pago',
      message: `No se pudo procesar tu pago: ${reason}`,
      type: 'error',
      priority: 'high',
      category: 'payment',
      action: {
        label: 'Reintentar',
        onClick: () => window.location.href = `/payment/retry?order=${orderId}`
      },
      metadata: { orderId, reason }
    });
  }

  static notifyDriverAssigned(orderId: string, driverName: string) {
    return this.create({
      title: 'Repartidor Asignado',
      message: `${driverName} ha sido asignado a tu pedido`,
      type: 'info',
      priority: 'medium',
      category: 'delivery',
      metadata: { orderId, driverName }
    });
  }

  static notifyDeliveryUpdate(orderId: string, message: string) {
    return this.create({
      title: 'Actualización de Entrega',
      message,
      type: 'info',
      priority: 'medium',
      category: 'delivery',
      metadata: { orderId }
    });
  }

  static notifyPromotion(title: string, message: string, discount: number) {
    return this.create({
      title,
      message: `${message} - ${discount}% de descuento`,
      type: 'info',
      priority: 'low',
      category: 'promotion',
      action: {
        label: 'Ver Oferta',
        onClick: () => window.location.href = '/promotions'
      },
      metadata: { discount }
    });
  }

  // Gestión de notificaciones
  static markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
      this.persistNotifications();
    }
  }

  static markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
    this.persistNotifications();
  }

  static delete(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
    this.persistNotifications();
  }

  static clearAll() {
    this.notifications = [];
    this.notifyListeners();
    this.persistNotifications();
  }

  static getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  static getNotifications(filter?: {
    category?: string;
    read?: boolean;
    priority?: string;
  }): NotificationData[] {
    let filtered = this.notifications;

    if (filter?.category) {
      filtered = filtered.filter(n => n.category === filter.category);
    }

    if (filter?.read !== undefined) {
      filtered = filtered.filter(n => n.read === filter.read);
    }

    if (filter?.priority) {
      filtered = filtered.filter(n => n.priority === filter.priority);
    }

    return filtered;
  }

  // Suscripción a cambios
  static subscribe(callback: (notifications: NotificationData[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notifyListeners() {
    this.listeners.forEach(callback => callback([...this.notifications]));
  }

  // Persistencia
  private static persistNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }

  static loadPersistedNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
  }

  // Utilidades
  private static generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static showToast(notification: NotificationData) {
    const toastOptions = {
      duration: notification.duration || (notification.priority === 'high' ? 5000 : 3000),
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      default:
        toast.info(notification.title, {
          description: notification.message,
          ...toastOptions
        });
    }
  }

  private static playSound(notification: NotificationData) {
    if (!this.soundEnabled || notification.priority === 'low') return;

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  private static showPushNotification(notification: NotificationData) {
    if (!this.pushEnabled || notification.priority === 'low') return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });
    }
  }

  // Configuración
  static setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('notificationPreferences', JSON.stringify({ soundEnabled: enabled }));
  }

  static isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  static setPushEnabled(enabled: boolean) {
    this.pushEnabled = enabled;
    if (enabled) {
      this.requestPermission();
    }
  }

  static isPushEnabled(): boolean {
    return this.pushEnabled;
  }

  // Limpieza automática
  static cleanup() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    this.notifications = this.notifications.filter(n => 
      n.timestamp > oneWeekAgo || n.priority === 'high'
    );

    this.notifyListeners();
    this.persistNotifications();
  }

  // Métricas
  static getMetrics() {
    const total = this.notifications.length;
    const unread = this.getUnreadCount();
    const byCategory = this.notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byCategory };
  }
}