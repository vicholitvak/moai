// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';
import { authRateLimiter } from '@/lib/middleware/rateLimiter';
import { signInWithTokenSchema } from '@/lib/schemas/authSchema';
import { validateAndSanitize } from '@/lib/utils/validation';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Apply rate limiting first
  const rateLimitResponse = await authRateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    
    // Validate input data
    const validation = validateAndSanitize(signInWithTokenSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validation.errors 
        }, 
        { status: 400 }
      );
    }

    const { idToken } = body;

    // Verify the ID token first
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (verifyError) {
      console.error('Invalid ID token:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' }, 
        { status: 401 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}
