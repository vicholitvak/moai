import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '../lib/firebase/admin';

interface CreateAdminOptions {
  email: string;
  password: string;
  displayName?: string;
}

async function createAdminUser(options: CreateAdminOptions) {
  const { email, password, displayName } = options;
  
  try {
    console.log('Creating admin user...');
    
    // Create the user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: displayName || 'Admin User',
      emailVerified: true
    });
    
    console.log('User created in Firebase Auth:', userRecord.uid);
    
    // Set custom claims
    await getAuth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });
    
    console.log('Custom claims set');
    
    // Create admin record in Firestore
    const db = getFirestore();
    
    // Add to admins collection
    await db.collection('admins').doc(userRecord.uid).set({
      email,
      isActive: true,
      isSuperAdmin: true,
      createdAt: new Date()
    });
    
    // Add to users collection
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || 'Admin User',
      role: 'admin',
      isSuperAdmin: true,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔐 Password:', password);
    console.log('🆔 UID:', userRecord.uid);
    console.log('\nYou can now log in to the admin panel at /admin/dashboard');
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    if (error.code === 'auth/email-already-exists') {
      console.log('Email already exists. If you need to make this user an admin, run the promote script instead.');
    }
  }
}

// Example usage
const adminOptions: CreateAdminOptions = {
  email: 'admin@moai.com',
  password: 'admin123456', // Change this to a secure password
  displayName: 'Moai Admin'
};

// Run the script
createAdminUser(adminOptions)
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });