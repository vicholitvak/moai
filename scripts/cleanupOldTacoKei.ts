// scripts/cleanupOldTacoKei.ts
// Script para limpiar el perfil viejo de TacoKei y dejar solo el nuevo
// Usage: npx tsx scripts/cleanupOldTacoKei.ts

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

async function cleanup() {
  console.log('🧹 Limpiando perfiles duplicados de TacoKei...');

  try {
    // Find all TacoKei cooks
    const cooksSnapshot = await db.collection('cooks')
      .where('displayName', '==', 'TacoKei')
      .get();

    console.log(`📍 Encontrados ${cooksSnapshot.docs.length} perfiles de TacoKei`);

    if (cooksSnapshot.docs.length <= 1) {
      console.log('✅ Solo hay un perfil, no hay nada que limpiar');
      process.exit(0);
    }

    // Keep the most recent one (last created)
    const sortedDocs = cooksSnapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis() || 0;
      const bTime = b.data().createdAt?.toMillis() || 0;
      return bTime - aTime; // Newest first
    });

    const keepDoc = sortedDocs[0];
    const deleteIds = sortedDocs.slice(1).map(doc => doc.id);

    console.log(`\n✅ Mantener perfil: ${keepDoc.id}`);
    console.log(`🗑️  Eliminar perfiles: ${deleteIds.join(', ')}`);

    // Delete old profiles and their dishes
    for (const oldId of deleteIds) {
      console.log(`\n🗑️  Eliminando perfil ${oldId}...`);

      // Delete dishes
      const dishesSnapshot = await db.collection('dishes')
        .where('cookerId', '==', oldId)
        .get();

      const batch = db.batch();
      dishesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`  ✓ ${dishesSnapshot.size} platos eliminados`);

      // Delete cook profile
      await db.collection('cooks').doc(oldId).delete();
      console.log(`  ✓ Perfil eliminado`);
    }

    console.log('\n🎉 Limpieza completada!');
    console.log(`✅ Perfil activo: ${keepDoc.id}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  }
}

cleanup();