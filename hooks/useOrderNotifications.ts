'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrdersService } from '@/lib/firebase/dataService';
import { PushNotificationService } from '@/lib/services/pushNotificationService';
import type { Order } from '@/lib/firebase/dataService';

interface UseOrderNotificationsOptions {
  enabled?: boolean;
  enabledStatuses?: Order['status'][];
}

interface OrderStatusChange {
  orderId: string;
  oldStatus: Order['status'];
  newStatus: Order['status'];
  order: Order;
}

export function useOrderNotifications(options: UseOrderNotificationsOptions = {}) {
  const { user } = useAuth();
  const {
    enabled = true,
    enabledStatuses = ['accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
  } = options;

  const previousOrdersRef = useRef<Map<string, Order['status']>>(new Map());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);

  // Initialize notifications
  useEffect(() => {
    if (enabled && user) {
      PushNotificationService.initialize();
    }
  }, [enabled, user]);

  // Handle order status changes
  const handleOrderStatusChange = useCallback(async (change: OrderStatusChange) => {
    try {
      if (!enabled || !PushNotificationService.areNotificationsEnabled()) {
        return;
      }

      if (!enabledStatuses.includes(change.newStatus)) {
        return;
      }

      // Don't notify on initial load or if status didn't actually change
      if (isInitialLoadRef.current || change.oldStatus === change.newStatus) {
        return;
      }

      console.log('Order status changed:', change);

      // Get additional data for the notification
      let cookerName = '';
      let driverName = '';
      let eta = '';

      // Get cooker name if available
      if (change.order.cookerId) {
        try {
          const cook = await import('@/lib/firebase/dataService').then(({ CooksService }) => 
            CooksService.getCookById(change.order.cookerId)
          );
          cookerName = cook?.displayName || '';
        } catch (error) {
          console.error('Error getting cooker name:', error);
        }
      }

      // Get driver name and ETA if in delivery status
      if (change.newStatus === 'delivering' && change.order.driverId) {
        try {
          const [driver, tracking] = await Promise.all([
            import('@/lib/firebase/dataService').then(({ DriversService }) => 
              DriversService.getDriverById(change.order.driverId!)
            ),
            import('@/lib/services/deliveryTrackingService').then(({ DeliveryTrackingService }) => 
              new Promise(resolve => {
                const unsubscribe = DeliveryTrackingService.subscribeToDeliveryTracking(
                  change.orderId,
                  (tracking) => {
                    unsubscribe();
                    resolve(tracking);
                  }
                );
              })
            )
          ]);

          driverName = driver?.displayName || '';
          eta = (tracking as any)?.estimatedDeliveryTime || '';
        } catch (error) {
          console.error('Error getting driver data:', error);
        }
      }

      // Show notification
      await PushNotificationService.showOrderNotification({
        orderId: change.orderId,
        orderStatus: change.newStatus,
        cookerName,
        driverName,
        eta,
        url: `/orders/${change.orderId}/tracking`
      });

    } catch (error) {
      console.error('Error handling order status change:', error);
    }
  }, [enabled, enabledStatuses]);

  // Subscribe to order updates
  useEffect(() => {
    if (!user || !enabled) {
      return;
    }

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to order updates
    unsubscribeRef.current = OrdersService.subscribeToOrderUpdates(user.uid, (orders) => {
      const currentOrders = new Map<string, Order['status']>();
      
      orders.forEach(order => {
        const previousStatus = previousOrdersRef.current.get(order.id);
        currentOrders.set(order.id, order.status);
        
        // If we have a previous status and it's different, trigger notification
        if (previousStatus && previousStatus !== order.status) {
          handleOrderStatusChange({
            orderId: order.id,
            oldStatus: previousStatus,
            newStatus: order.status,
            order
          });
        }
      });

      // Update the reference for next comparison
      previousOrdersRef.current = currentOrders;
      
      // After first load, we can start showing notifications
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, enabled, handleOrderStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    // Methods to control notifications
    showTestNotification: () => PushNotificationService.showTestNotification(),
    requestPermission: () => PushNotificationService.requestPermission(),
    getPermissionStatus: () => PushNotificationService.getPermissionStatus(),
    
    // Manual notification trigger (for testing or special cases)
    showOrderNotification: (orderId: string, status: Order['status'], customData?: any) => {
      return PushNotificationService.showOrderNotification({
        orderId,
        orderStatus: status,
        ...customData
      });
    }
  };
}

// Hook specifically for the tracking page to show arrival notifications
export function useDeliveryNotifications(orderId: string, enabled = true) {
  const arrivedNotificationShown = useRef(false);

  useEffect(() => {
    if (!enabled || !orderId) return;

    let unsubscribe: (() => void) | null = null;

    // Subscribe to delivery tracking for this specific order
    import('@/lib/services/deliveryTrackingService').then(({ DeliveryTrackingService }) => {
      unsubscribe = DeliveryTrackingService.subscribeToDeliveryTracking(
        orderId,
        async (tracking) => {
          if (!tracking) return;

          // Show notification when driver is very close (less than 2-3 minutes away)
          if (
            tracking.currentStep === 'heading_to_delivery' &&
            tracking.estimatedDeliveryTime &&
            !arrivedNotificationShown.current
          ) {
            // Parse ETA and check if it's less than 3 minutes
            const etaText = tracking.estimatedDeliveryTime.toLowerCase();
            const isCloseToArrival = 
              etaText.includes('1 min') || 
              etaText.includes('2 min') || 
              etaText.includes('llegando') ||
              etaText.includes('cerca');

            if (isCloseToArrival) {
              arrivedNotificationShown.current = true;
              
              await PushNotificationService.showOrderNotification({
                orderId,
                orderStatus: 'arriving',
                driverName: tracking.driverName,
                eta: tracking.estimatedDeliveryTime,
                message: `${tracking.driverName} está llegando a tu ubicación. ¡Prepárate para recibir tu pedido!`
              });
            }
          }
        }
      );
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId, enabled]);

  return {
    resetArrivedNotification: () => {
      arrivedNotificationShown.current = false;
    }
  };
}