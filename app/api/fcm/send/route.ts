import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

const db = admin.firestore();
const messaging = admin.messaging();

export async function POST(request: NextRequest) {
  try {
    const { userId, notification, data } = await request.json();

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'userId and notification are required' },
        { status: 400 }
      );
    }

    // Get user's FCM tokens
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || {};
    
    // Get all available tokens for the user
    const tokens = Object.values(fcmTokens)
      .map((tokenData: any) => tokenData.token)
      .filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found for user' },
        { status: 404 }
      );
    }

    // Send notification to all user's devices
    const messages = tokens.map(token => ({
      token: token as string,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image
      },
      data: {
        ...data,
        clickAction: data?.actionUrl || '/',
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#F57C00',
          channelId: 'moai_orders',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          vibrate: [200, 100, 200],
          requireInteraction: data?.priority === 'high',
          actions: [
            {
              action: 'view',
              title: 'Ver detalles'
            },
            {
              action: 'dismiss',
              title: 'Descartar'
            }
          ]
        }
      }
    }));

    // Send messages
    const responses = await Promise.allSettled(
      messages.map(message => messaging.send(message))
    );

    // Count successful sends
    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    const failedCount = responses.filter(r => r.status === 'rejected').length;

    // Log failed sends for debugging
    responses.forEach((response, index) => {
      if (response.status === 'rejected') {
        console.error(`Failed to send to token ${tokens[index]}:`, response.reason);
      }
    });

    console.log(`Notification sent: ${successCount} successful, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      totalTokens: tokens.length
    });

  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}