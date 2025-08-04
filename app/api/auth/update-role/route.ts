import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();
    
    if (!role || !['Client', 'Cooker', 'Driver', 'Admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    // Verify the session token
    let userId: string;
    try {
      const decoded = verify(sessionToken, JWT_SECRET) as { uid: string };
      userId = decoded.uid;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session token' },
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