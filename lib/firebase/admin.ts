// lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin only if credentials are available
let isInitialized = false;

if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Only initialize if all credentials are present
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
    }
  } else {
    console.warn('⚠️ Firebase Admin credentials not available - running in build mode or missing env vars');
    console.warn('Missing:', {
      projectId: !serviceAccount.projectId,
      clientEmail: !serviceAccount.clientEmail,
      privateKey: !serviceAccount.privateKey,
    });
  }
}

export { admin };

// Helper to get admin app safely
export function getAdminApp() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin is not initialized. Check environment variables.');
  }
  return admin.app();
}

// Helper to check if admin is initialized
export function isAdminInitialized() {
  return admin.apps.length > 0;
}

// Export adminApp but handle the case where it might not be initialized
export const adminApp = admin.apps.length > 0 ? admin.app() : null;
