import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeAppSettings() {
  try {
    const settingsRef = doc(db, 'appSettings', 'main');
    
    // Check if settings already exist
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      console.log('Creating default app settings...');
      
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
        updatedAt: new Date(),
        updatedBy: 'system'
      };
      
      await setDoc(settingsRef, defaultSettings);
      console.log('✅ Default app settings created successfully!');
    } else {
      console.log('ℹ️  App settings already exist, skipping initialization');
      console.log('Current settings:', settingsSnap.data());
    }
  } catch (error) {
    console.error('❌ Error initializing app settings:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeAppSettings().then(() => {
  console.log('🎉 App settings initialization complete!');
  process.exit(0);
});