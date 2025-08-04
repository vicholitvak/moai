import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { admin } from '@/lib/firebase/admin';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();
    
    if (!role || !['Client', 'Cooker', 'Driver', 'Admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    // Get session cookie from cookies
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session cookie found' },
        { status: 401 }
      );
    }

    // Verify the session cookie using Firebase Admin
    let userId: string;
    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
    } catch (error) {
      console.error('Session verification error:', error);
      return NextResponse.json(
        { error: 'Invalid session cookie' },
        { status: 401 }
      );
    }

    // Update user role in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role }, { merge: true });

    return NextResponse.json(
      { message: 'Role updated successfully', role },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}