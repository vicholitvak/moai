import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

const messaging = admin.messaging();

export async function POST(request: NextRequest) {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: 'token and topic are required' },
        { status: 400 }
      );
    }

    // Unsubscribe token from topic
    await messaging.unsubscribeFromTopic([token], topic);

    console.log(`Token unsubscribed from topic: ${topic}`);

    return NextResponse.json({ 
      success: true, 
      message: `Unsubscribed from topic: ${topic}` 
    });

  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from topic' },
      { status: 500 }
    );
  }
}