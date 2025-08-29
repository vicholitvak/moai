import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({ origin: true });

// Save FCM token for user
export const saveFCMToken = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { userId, token, platform } = req.body;

      if (!userId || !token) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Save token to Firestore
      await admin.firestore()
        .collection('fcmTokens')
        .doc(userId)
        .set({
          token,
          platform: platform || 'web',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        }, { merge: true });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Send notification to specific user
export const sendNotification = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { userId, notification, data } = req.body;

      if (!userId || !notification) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get user's FCM token
      const tokenDoc = await admin.firestore()
        .collection('fcmTokens')
        .doc(userId)
        .get();

      if (!tokenDoc.exists) {
        return res.status(404).json({ error: 'User token not found' });
      }

      const tokenData = tokenDoc.data();
      if (!tokenData?.isActive) {
        return res.status(400).json({ error: 'User token is inactive' });
      }

      // Send notification
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          image: notification.image
        },
        data: {
          ...data,
          timestamp: Date.now().toString()
        },
        token: tokenData.token
      };

      const response = await admin.messaging().send(message);

      // Log notification
      await admin.firestore()
        .collection('notificationLogs')
        .add({
          userId,
          messageId: response,
          notification,
          data,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          platform: tokenData.platform
        });

      return res.status(200).json({ 
        success: true, 
        messageId: response 
      });

    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered') {
        // Mark token as inactive
        await admin.firestore()
          .collection('fcmTokens')
          .doc(req.body.userId)
          .update({ isActive: false });
      }

      return res.status(500).json({ error: 'Failed to send notification' });
    }
  });
});

// Send notification to topic
export const sendToTopic = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { topic, notification, data } = req.body;

      if (!topic || !notification) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          image: notification.image
        },
        data: {
          ...data,
          timestamp: Date.now().toString()
        },
        topic: topic
      };

      const response = await admin.messaging().send(message);

      // Log topic notification
      await admin.firestore()
        .collection('topicNotificationLogs')
        .add({
          topic,
          messageId: response,
          notification,
          data,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return res.status(200).json({ 
        success: true, 
        messageId: response 
      });

    } catch (error) {
      console.error('Error sending topic notification:', error);
      return res.status(500).json({ error: 'Failed to send topic notification' });
    }
  });
});

// Subscribe user to topic
export const subscribeToTopic = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { token, topic } = req.body;

      if (!token || !topic) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await admin.messaging().subscribeToTopic([token], topic);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return res.status(500).json({ error: 'Failed to subscribe to topic' });
    }
  });
});

export const fcmFunctions = {
  saveFCMToken,
  sendNotification,
  sendToTopic,
  subscribeToTopic
};