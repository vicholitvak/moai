import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

const messaging = admin.messaging();

export async function POST(request: NextRequest) {
  try {
    const { topic, notification, data } = await request.json();

    if (!topic || !notification) {
      return NextResponse.json(
        { error: 'topic and notification are required' },
        { status: 400 }
      );
    }

    // Create the message for topic
    const message = {
      topic,
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
          channelId: 'moai_promotions',
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
              title: 'Ver oferta'
            },
            {
              action: 'dismiss',
              title: 'Descartar'
            }
          ]
        }
      }
    };

    // Send message to topic
    const messageId = await messaging.send(message);

    console.log(`Message sent to topic ${topic}: ${messageId}`);

    return NextResponse.json({
      success: true,
      messageId,
      topic
    });

  } catch (error) {
    console.error('Error sending message to topic:', error);
    return NextResponse.json(
      { error: 'Failed to send message to topic' },
      { status: 500 }
    );
  }
}