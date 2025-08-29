import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({ origin: true });
const db = admin.firestore();

// Trigger when new order is created
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    try {
      // Notify cook about new order
      await sendNotificationToUser(order.cookerId, {
        title: '🔔 ¡Nuevo Pedido!',
        body: `Tienes un nuevo pedido de ${order.customerName} por ${formatPrice(order.total)}`,
        data: {
          type: 'new_order',
          orderId: orderId,
          priority: 'high',
          actionUrl: `/cooker/dashboard?order=${orderId}`
        }
      });

      // Update cook's order statistics
      await db.collection('cooks').doc(order.cookerId).update({
        pendingOrders: admin.firestore.FieldValue.increment(1),
        lastOrderAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log order creation
      await db.collection('orderLogs').add({
        orderId,
        action: 'created',
        userId: order.customerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          total: order.total,
          itemCount: order.dishes?.length || 0
        }
      });

      console.log(`Order ${orderId} created and notifications sent`);

    } catch (error) {
      console.error('Error processing new order:', error);
    }
  });

// Trigger when order status changes
export const onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;

    // Check if status changed
    if (beforeData.status === afterData.status) {
      return;
    }

    try {
      const statusMessages = {
        accepted: {
          title: '✅ ¡Pedido Aceptado!',
          body: 'Tu pedido ha sido aceptado y está siendo preparado'
        },
        preparing: {
          title: '👨‍🍳 Preparando tu pedido',
          body: 'Tu deliciosa comida está siendo preparada con amor'
        },
        ready: {
          title: '📦 ¡Pedido Listo!',
          body: 'Tu pedido está listo. El repartidor lo recogerá pronto'
        },
        delivering: {
          title: '🚚 En camino',
          body: 'Tu pedido está en camino. ¡Prepárate para disfrutar!'
        },
        delivered: {
          title: '🎉 ¡Entregado!',
          body: 'Tu pedido ha sido entregado. ¡Que lo disfrutes!'
        },
        cancelled: {
          title: '❌ Pedido Cancelado',
          body: 'Tu pedido ha sido cancelado. Contacta soporte si necesitas ayuda'
        }
      };

      const statusMessage = statusMessages[afterData.status as keyof typeof statusMessages];
      
      if (statusMessage) {
        // Notify customer
        await sendNotificationToUser(afterData.customerId, {
          ...statusMessage,
          data: {
            type: `order_${afterData.status}`,
            orderId: orderId,
            priority: 'high',
            actionUrl: `/orders/${orderId}`
          }
        });
      }

      // Special handling for specific status changes
      if (afterData.status === 'ready' && !afterData.driverId) {
        // Find available driver
        await findAndAssignDriver(orderId, afterData);
      }

      if (afterData.status === 'delivered') {
        // Process loyalty points
        await processOrderCompletion(orderId, afterData);
      }

      // Update analytics
      await updateOrderAnalytics(afterData.status, beforeData.status);

      // Log status change
      await db.collection('orderLogs').add({
        orderId,
        action: 'status_changed',
        fromStatus: beforeData.status,
        toStatus: afterData.status,
        userId: afterData.customerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error processing order status change:', error);
    }
  });

// Update order status
export const updateOrderStatus = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { orderId, status, userId, userRole } = req.body;

      if (!orderId || !status || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify user has permission to update this order
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderDoc.data()!;

      // Check permissions
      const hasPermission = 
        (userRole === 'Cook' && order.cookerId === userId) ||
        (userRole === 'Driver' && order.driverId === userId) ||
        (userRole === 'Admin') ||
        (userRole === 'Client' && order.customerId === userId && status === 'cancelled');

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        pending: ['accepted', 'cancelled'],
        accepted: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['delivering'],
        delivering: ['delivered'],
        delivered: [],
        cancelled: []
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${order.status} to ${status}` 
        });
      }

      // Update order
      const updateData: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
      };

      if (status === 'accepted') {
        updateData.estimatedReadyTime = new Date(Date.now() + (order.estimatedPrepTime || 30) * 60000);
      }

      await orderRef.update(updateData);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Assign driver to order
export const assignDriver = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { orderId, driverId } = req.body;

      if (!orderId || !driverId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify driver is available
      const driverDoc = await db.collection('drivers').doc(driverId).get();
      if (!driverDoc.exists || !driverDoc.data()?.isAvailable) {
        return res.status(400).json({ error: 'Driver not available' });
      }

      // Update order with driver
      await db.collection('orders').doc(orderId).update({
        driverId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update driver status
      await db.collection('drivers').doc(driverId).update({
        isAvailable: false,
        currentOrderId: orderId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer and driver
      const order = (await db.collection('orders').doc(orderId).get()).data()!;
      const driver = driverDoc.data()!;

      await Promise.all([
        sendNotificationToUser(order.customerId, {
          title: '🚚 Repartidor Asignado',
          body: `${driver.displayName} ha sido asignado a tu pedido`,
          data: {
            type: 'driver_assigned',
            orderId,
            driverId,
            actionUrl: `/orders/${orderId}`
          }
        }),
        sendNotificationToUser(driverId, {
          title: '📦 Nuevo Pedido Asignado',
          body: `Tienes un nuevo pedido para entregar`,
          data: {
            type: 'order_assigned',
            orderId,
            actionUrl: `/driver/dashboard?order=${orderId}`
          }
        })
      ]);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Error assigning driver:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get order analytics
export const getOrderAnalytics = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { startDate, endDate, cookId, driverId } = req.query;

      let query: any = db.collection('orders');

      // Apply filters
      if (startDate) {
        query = query.where('createdAt', '>=', new Date(startDate as string));
      }
      if (endDate) {
        query = query.where('createdAt', '<=', new Date(endDate as string));
      }
      if (cookId) {
        query = query.where('cookerId', '==', cookId);
      }
      if (driverId) {
        query = query.where('driverId', '==', driverId);
      }

      const snapshot = await query.get();
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Calculate analytics
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        avgOrderValue: orders.length > 0 ? 
          orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) / orders.length : 0,
        statusBreakdown: orders.reduce((acc: any, order: any) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        ordersByDay: groupOrdersByDay(orders),
        topCooks: getTopCooks(orders),
        avgDeliveryTime: calculateAvgDeliveryTime(orders)
      };

      return res.status(200).json(analytics);

    } catch (error) {
      console.error('Error getting order analytics:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Helper functions
async function sendNotificationToUser(userId: string, notification: any) {
  try {
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    if (tokenDoc.exists && tokenDoc.data()?.isActive) {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data,
        token: tokenDoc.data()!.token
      };
      await admin.messaging().send(message);
    }
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

async function findAndAssignDriver(orderId: string, order: any) {
  try {
    // Find available drivers near the cook location
    const driversSnapshot = await db.collection('drivers')
      .where('isAvailable', '==', true)
      .where('isOnline', '==', true)
      .limit(5)
      .get();

    if (!driversSnapshot.empty) {
      // For now, assign the first available driver
      // In production, you'd implement distance-based assignment
      const driver = driversSnapshot.docs[0];
      
      await db.collection('orders').doc(orderId).update({
        driverId: driver.id,
        status: 'delivering',
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('drivers').doc(driver.id).update({
        isAvailable: false,
        currentOrderId: orderId
      });
    }
  } catch (error) {
    console.error('Error finding driver:', error);
  }
}

async function processOrderCompletion(orderId: string, order: any) {
  try {
    // Award loyalty points
    const basePoints = Math.floor(order.total / 100);
    
    await db.collection('pointsTransactions').add({
      userId: order.customerId,
      type: 'earned',
      points: basePoints,
      orderId,
      description: `Puntos ganados por pedido #${orderId.slice(-6)}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user loyalty points
    await db.collection('loyaltyPoints').doc(order.customerId).update({
      totalPoints: admin.firestore.FieldValue.increment(basePoints),
      availablePoints: admin.firestore.FieldValue.increment(basePoints),
      totalOrders: admin.firestore.FieldValue.increment(1),
      lifetimeSpent: admin.firestore.FieldValue.increment(order.total)
    });

  } catch (error) {
    console.error('Error processing order completion:', error);
  }
}

async function updateOrderAnalytics(newStatus: string, oldStatus: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await db.collection('dailyAnalytics').doc(today).set({
      [`orders_${newStatus}`]: admin.firestore.FieldValue.increment(1),
      [`orders_${oldStatus}`]: admin.firestore.FieldValue.increment(-1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

function groupOrdersByDay(orders: any[]) {
  return orders.reduce((acc, order) => {
    const date = new Date(order.createdAt.toDate()).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getTopCooks(orders: any[]) {
  const cookStats = orders.reduce((acc, order) => {
    if (!acc[order.cookerId]) {
      acc[order.cookerId] = { orders: 0, revenue: 0 };
    }
    acc[order.cookerId].orders += 1;
    acc[order.cookerId].revenue += order.total || 0;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  return Object.entries(cookStats)
    .sort(([,a]: [string, any], [,b]: [string, any]) => b.revenue - a.revenue)
    .slice(0, 10);
}

function calculateAvgDeliveryTime(orders: any[]) {
  const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.deliveredAt && o.createdAt);
  if (deliveredOrders.length === 0) return 0;

  const totalTime = deliveredOrders.reduce((sum, order) => {
    const deliveryTime = order.deliveredAt.toDate() - order.createdAt.toDate();
    return sum + deliveryTime;
  }, 0);

  return Math.round(totalTime / deliveredOrders.length / (1000 * 60)); // minutes
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount);
}

export const orderFunctions = {
  onOrderCreated,
  onOrderStatusChanged,
  updateOrderStatus,
  assignDriver,
  getOrderAnalytics
};