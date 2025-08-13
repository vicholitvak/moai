// lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Validate required fields
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.error('Missing Firebase service account credentials:', {
      project_id: !!serviceAccount.project_id,
      client_email: !!serviceAccount.client_email,
      private_key: !!serviceAccount.private_key,
    });
    throw new Error('Missing Firebase service account credentials');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export { admin };
export const adminApp = admin.app();
