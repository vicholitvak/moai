// lib/firebase/firebaseAdminConfig.ts
// This file should NOT be committed to Git.
// It is populated from environment variables.

interface ServiceAccount {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
};

export { serviceAccount };

