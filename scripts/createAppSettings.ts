// scripts/createAppSettings.ts
// Run this script to create the app settings document in Firebase
// Usage: npx tsx scripts/createAppSettings.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function createAppSettings() {
  console.log('🔧 Creating app settings document...');
  
  try {
    const settingsRef = db.collection('appSettings').doc('main');
    
    const defaultSettings = {
      deliveryFee: {
        baseRate: 0,
        freeDeliveryThreshold: 25000,
        isEnabled: false
      },
      serviceFee: {
        percentage: 0.12,
        isEnabled: true
      },
      updatedAt: Timestamp.now(),
      updatedBy: 'system'
    };
    
    await settingsRef.set(defaultSettings);
    
    console.log('✅ App settings created successfully!');
    console.log('📊 Settings:', defaultSettings);
    
  } catch (error) {
    console.error('❌ Error creating app settings:', error);
    process.exit(1);
  }
}

// Run the setup
createAppSettings();