// scripts/setupFirebase.ts
// Run this script to seed initial data into Firebase
// Usage: npx tsx scripts/setupFirebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { DataSeeder } from '../lib/firebase/seedData';

// Firebase config - make sure these environment variables are set
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function setupFirebase() {
  console.log('🔥 Setting up Firebase...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // If running locally, you might want to use the emulator
    // Uncomment the next line if using Firebase emulator
    // connectFirestoreEmulator(db, 'localhost', 8080);
    
    console.log('✅ Firebase initialized successfully');
    
    // Seed initial data
    console.log('🌱 Seeding initial data...');
    const result = await DataSeeder.seedAllData();
    
    console.log('✅ Data seeding completed!');
    console.log('📊 Seeded data:', {
      cooks: result.cookIds.length,
      dishes: result.dishIds.length,
      orders: result.orderIds.length,
      reviews: result.reviewIds.length
    });
    
    console.log('\n🎉 Firebase setup complete!');
    console.log('You can now use the app with real Firebase data.');
    
  } catch (error) {
    console.error('❌ Error setting up Firebase:', error);
    process.exit(1);
  }
}

// Run the setup
setupFirebase();
