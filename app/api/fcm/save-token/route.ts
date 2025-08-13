import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const { userId, token, platform } = await request.json();

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'userId and token are required' },
        { status: 400 }
      );
    }

    // Save the FCM token to the user's document
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      fcmTokens: {
        [platform || 'web']: {
          token,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    }, { merge: true });

    console.log(`FCM token saved for user ${userId} on platform ${platform}`);

    return NextResponse.json({ 
      success: true, 
      message: 'FCM token saved successfully' 
    });

  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to save FCM token' },
      { status: 500 }
    );
  }
}