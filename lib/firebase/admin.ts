// lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Helper to validate if a private key looks legitimate
function isValidPrivateKey(key: string | undefined): boolean {
  if (!key) return false;
  
  // Check for mock/placeholder values
  if (key.includes('MockKeyForBuildOnly') || 
      key.includes('mock-') || 
      key.length < 100) {
    return false;
  }
  
  // Check for proper PEM format
  return key.includes('-----BEGIN PRIVATE KEY-----') && 
         key.includes('-----END PRIVATE KEY-----');
}

// Initialize Firebase Admin only if credentials are available
let isInitialized = false;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Validate all credentials are present and legitimate (not mock values)
  const hasValidProjectId = projectId && !projectId.includes('mock');
  const hasValidClientEmail = clientEmail && !clientEmail.includes('mock') && clientEmail.includes('@');
  const hasValidPrivateKey = isValidPrivateKey(privateKey);

  if (hasValidProjectId && hasValidClientEmail && hasValidPrivateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        } as admin.ServiceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
      console.error('This is likely due to invalid credentials. Server-side features will be unavailable.');
    }
  } else {
    console.warn('⚠️ Firebase Admin credentials not available or are mock values');
    console.warn('Server-side Firebase features will be unavailable during this build.');
    console.warn('Status:', {
      projectId: hasValidProjectId ? '✓' : '✗',
      clientEmail: hasValidClientEmail ? '✓' : '✗',
      privateKey: hasValidPrivateKey ? '✓' : '✗',
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
