import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

const messaging = admin.messaging();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: 'token and topic are required' },
        { status: 400 }
      );
    }

    // Subscribe token to topic
    await messaging.subscribeToTopic([token], topic);

    console.log(`Token subscribed to topic: ${topic}`);

    return NextResponse.json({ 
      success: true, 
      message: `Subscribed to topic: ${topic}` 
    });

  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to topic' },
      { status: 500 }
    );
  }
}