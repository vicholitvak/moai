// scripts/deleteTacoKei.ts
// Script para eliminar el perfil TacoKei y sus platos
// Usage: npx tsx scripts/deleteTacoKei.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as admin from 'firebase-admin';

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function deleteTacoKei() {
  console.log('🗑️  Eliminando datos de TacoKei...');

  try {
    // Find TacoKei cook
    const cooksSnapshot = await db.collection('cooks')
      .where('displayName', '==', 'TacoKei')
      .get();

    if (cooksSnapshot.empty) {
      console.log('⚠️  No se encontró el perfil de TacoKei');
      process.exit(0);
    }

    const cookDoc = cooksSnapshot.docs[0];
    const cookId = cookDoc.id;

    console.log(`📍 Encontrado TacoKei con ID: ${cookId}`);

    // Delete all dishes from this cook
    console.log('🍽️  Eliminando platos de TacoKei...');
    const dishesSnapshot = await db.collection('dishes')
      .where('cookerId', '==', cookId)
      .get();

    let deletedDishes = 0;
    const batch = db.batch();

    dishesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedDishes++;
    });

    await batch.commit();
    console.log(`✅ ${deletedDishes} platos eliminados`);

    // Delete cook profile
    console.log('👨‍🍳 Eliminando perfil de cocinero...');
    await db.collection('cooks').doc(cookId).delete();
    console.log('✅ Perfil eliminado');

    console.log('\n🎉 TacoKei eliminado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error eliminando TacoKei:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteTacoKei();