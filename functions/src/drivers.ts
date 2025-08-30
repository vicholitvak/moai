import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });
const db = admin.firestore();

// Update driver location
export const updateDriverLocation = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { driverId, latitude, longitude, accuracy, heading, speed } = req.body;

      if (!driverId || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      const locationData = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update driver's current location
      await db.collection('drivers').doc(driverId).update({
        currentLocation: locationData,
        lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp(),
        isOnline: true
      });

      // If driver has an active order, update order's driver location
      const driverDoc = await db.collection('drivers').doc(driverId).get();
      const driver = driverDoc.data();

      if (driver?.currentOrderId) {
        await db.collection('orders').doc(driver.currentOrderId).update({
          driverLocation: locationData
        });

        // Estimate arrival time based on distance (simplified)
        const order = await db.collection('orders').doc(driver.currentOrderId).get();
        const orderData = order.data();

        if (orderData?.deliveryInfo?.coordinates) {
          const distance = calculateDistance(
            locationData.latitude,
            locationData.longitude,
            orderData.deliveryInfo.coordinates.latitude,
            orderData.deliveryInfo.coordinates.longitude
          );

          // Estimate time: distance (km) / average speed (25 km/h) * 60 = minutes
          const estimatedMinutes = Math.round((distance / 25) * 60);

          await db.collection('orders').doc(driver.currentOrderId).update({
            estimatedArrivalTime: new Date(Date.now() + estimatedMinutes * 60000),
            distanceToCustomer: distance
          });
        }
      }

      // Store location history for analytics
      await db.collection('driverLocationHistory').add({
        driverId,
        location: locationData,
        orderId: driver?.currentOrderId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ 
        success: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating driver location:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get driver location
export const getDriverLocation = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { driverId } = req.query;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID required' });
      }

      const driverDoc = await db.collection('drivers').doc(driverId as string).get();

      if (!driverDoc.exists) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = driverDoc.data()!;
      const location = driver.currentLocation;

      if (!location) {
        return res.status(404).json({ error: 'Location not available' });
      }

      return res.status(200).json({
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        timestamp: location.timestamp,
        isOnline: driver.isOnline || false
      });

    } catch (error) {
      console.error('Error getting driver location:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get available drivers
export const getAvailableDrivers = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { latitude, longitude, radius = 10 } = req.query;

      // Get all available drivers
      const driversSnapshot = await db.collection('drivers')
        .where('isAvailable', '==', true)
        .where('isOnline', '==', true)
        .get();

      const availableDrivers = [];

      for (const doc of driversSnapshot.docs) {
        const driverData = doc.data();
        const driver = { id: doc.id, ...driverData };
        
        // If location is provided, filter by distance
        if (latitude && longitude && driverData.currentLocation) {
          const distance = calculateDistance(
            parseFloat(latitude as string),
            parseFloat(longitude as string),
            driverData.currentLocation.latitude,
            driverData.currentLocation.longitude
          );

          if (distance <= parseFloat(radius as string)) {
            availableDrivers.push({
              ...driver,
              distance: distance.toFixed(2)
            });
          }
        } else {
          availableDrivers.push(driver);
        }
      }

      // Sort by distance if location provided
      if (latitude && longitude) {
        availableDrivers.sort((a: any, b: any) => parseFloat(a.distance || '0') - parseFloat(b.distance || '0'));
      }

      return res.status(200).json({
        drivers: availableDrivers,
        count: availableDrivers.length
      });

    } catch (error) {
      console.error('Error getting available drivers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Toggle driver online/offline status
export const toggleDriverStatus = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { driverId, isOnline } = req.body;

      if (!driverId || typeof isOnline !== 'boolean') {
        return res.status(400).json({ error: 'Missing or invalid fields' });
      }

      // Check if driver has active orders
      const driverDoc = await db.collection('drivers').doc(driverId).get();
      if (!driverDoc.exists) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = driverDoc.data()!;

      // Prevent going offline with active orders
      if (!isOnline && driver.currentOrderId) {
        return res.status(400).json({ 
          error: 'Cannot go offline with active orders' 
        });
      }

      // Update driver status
      const updateData: any = {
        isOnline,
        lastStatusChange: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!isOnline) {
        updateData.isAvailable = false;
        updateData.currentLocation = null;
      } else {
        updateData.isAvailable = true;
      }

      await db.collection('drivers').doc(driverId).update(updateData);

      // Log status change
      await db.collection('driverStatusLogs').add({
        driverId,
        status: isOnline ? 'online' : 'offline',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ 
        success: true,
        status: isOnline ? 'online' : 'offline'
      });

    } catch (error) {
      console.error('Error toggling driver status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Complete delivery
export const completeDelivery = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { driverId, orderId, deliveryCode, customerSignature } = req.body;

      if (!driverId || !orderId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify driver is assigned to this order
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderDoc.data()!;
      if (order.driverId !== driverId) {
        return res.status(403).json({ error: 'Driver not assigned to this order' });
      }

      // Verify delivery code if provided
      if (deliveryCode && order.deliveryCode !== deliveryCode) {
        return res.status(400).json({ error: 'Invalid delivery code' });
      }

      // Mark order as delivered
      await db.collection('orders').doc(orderId).update({
        status: 'delivered',
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryCode: deliveryCode || null,
        customerSignature: customerSignature || null
      });

      // Make driver available again
      await db.collection('drivers').doc(driverId).update({
        isAvailable: true,
        currentOrderId: null,
        completedDeliveries: admin.firestore.FieldValue.increment(1),
        totalEarnings: admin.firestore.FieldValue.increment(order.deliveryFee || 0)
      });

      // Send completion notifications
      await Promise.all([
        sendNotificationToUser(order.customerId, {
          title: '🎉 ¡Pedido Entregado!',
          body: 'Tu pedido ha sido entregado exitosamente. ¡Que lo disfrutes!',
          data: {
            type: 'order_delivered',
            orderId,
            actionUrl: `/orders/${orderId}`
          }
        }),
        sendNotificationToUser(order.cookerId, {
          title: '✅ Entrega Completada',
          body: `El pedido #${orderId.slice(-6)} ha sido entregado exitosamente`,
          data: {
            type: 'delivery_completed',
            orderId
          }
        })
      ]);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Error completing delivery:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get driver performance metrics
export const getDriverMetrics = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { driverId, startDate, endDate } = req.query;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID required' });
      }

      // Get driver info
      const driverDoc = await db.collection('drivers').doc(driverId as string).get();
      if (!driverDoc.exists) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = driverDoc.data()!;

      // Get driver's orders in date range
      let ordersQuery = db.collection('orders').where('driverId', '==', driverId);

      if (startDate) {
        ordersQuery = ordersQuery.where('createdAt', '>=', new Date(startDate as string));
      }
      if (endDate) {
        ordersQuery = ordersQuery.where('createdAt', '<=', new Date(endDate as string));
      }

      const ordersSnapshot = await ordersQuery.get();
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate metrics
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
      const totalEarnings = deliveredOrders.reduce((sum: number, order: any) => sum + (order.deliveryFee || 0), 0);
      
      const avgDeliveryTime = deliveredOrders.length > 0 ? 
        deliveredOrders.reduce((sum: number, order: any) => {
          if (order.deliveredAt && order.assignedAt) {
            return sum + (order.deliveredAt.toDate() - order.assignedAt.toDate());
          }
          return sum;
        }, 0) / deliveredOrders.length / (1000 * 60) : 0; // minutes

      const metrics = {
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        totalEarnings,
        avgEarnings: deliveredOrders.length > 0 ? totalEarnings / deliveredOrders.length : 0,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        rating: driver.rating || 0,
        completionRate: orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0,
        hoursOnline: await calculateHoursOnline(driverId as string, startDate as string, endDate as string)
      };

      return res.status(200).json(metrics);

    } catch (error) {
      console.error('Error getting driver metrics:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

async function calculateHoursOnline(driverId: string, startDate?: string, endDate?: string): Promise<number> {
  try {
    let query = db.collection('driverStatusLogs').where('driverId', '==', driverId);
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    const logsSnapshot = await query.orderBy('timestamp').get();
    const logs = logsSnapshot.docs.map(doc => doc.data());

    let totalHours = 0;
    let lastOnlineTime: Date | null = null;

    for (const log of logs) {
      if (log.status === 'online') {
        lastOnlineTime = log.timestamp.toDate();
      } else if (log.status === 'offline' && lastOnlineTime) {
        const sessionHours = (log.timestamp.toDate().getTime() - lastOnlineTime.getTime()) / (1000 * 60 * 60);
        totalHours += sessionHours;
        lastOnlineTime = null;
      }
    }

    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating hours online:', error);
    return 0;
  }
}

export const driverFunctions = {
  updateDriverLocation,
  getDriverLocation,
  getAvailableDrivers,
  toggleDriverStatus,
  completeDelivery,
  getDriverMetrics
};