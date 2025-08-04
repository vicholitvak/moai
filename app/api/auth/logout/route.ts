// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: true, message: 'No session to clear' });
    }

    // Revoke the session cookie
    await admin.auth().verifySessionCookie(sessionCookie);
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    await admin.auth().revokeRefreshTokens(decodedClaims.sub);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error revoking session cookie:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
