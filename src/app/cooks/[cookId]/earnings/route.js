import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import earningsService from '../../../../../services/earningsService'; // Adjust path if needed

// This is a placeholder for your actual token verification logic.
// In a real app, you would use a library like 'jose' or 'firebase-admin'
// to verify the token and get the user's ID.
async function getUserIdFromToken(token) {
    // In a Firebase app, you'd verify the ID token here.
    // For now, we'll assume a mock verification.
    // Replace this with your actual Firebase Admin SDK verification.
    if (token) {
        // Mock user ID, replace with real one from verified token
        return "mock-user-id-from-token"; 
    }
    throw new Error("Invalid token");
}

export async function GET(request, { params }) {
    try {
        const token = headers().get('authorization')?.split(' ')[1];
        const authenticatedUserId = await getUserIdFromToken(token);
        const { cookId } = params;

        // Security Check: Ensure the authenticated user is requesting their own earnings.
        if (authenticatedUserId !== cookId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly';
        const earningsData = await earningsService.calculateEarnings(cookId, period);

        return NextResponse.json(earningsData);
    } catch (error) {
        console.error('Error in earnings API route:', error);
        return NextResponse.json({ message: 'Failed to fetch earnings data.' }, { status: 500 });
    }
}