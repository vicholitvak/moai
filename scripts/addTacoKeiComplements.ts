// scripts/addTacoKeiComplements.ts
// Script para agregar bebidas y acompañamientos a TacoKei
// Usage: npx tsx scripts/addTacoKeiComplements.ts

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

const complements = [
  // Bebidas
  {
    name: 'Coca Cola 350ml',
    description: 'Bebida gaseosa clásica, perfecta para acompañar tu pedido',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 42,
    prepTime: '0 mins',
    ingredients: ['Agua', 'Azúcar', 'CO2'],
    allergens: [],
    nutritionInfo: {
      calories: 140,
      protein: '0g',
      carbs: '35g',
      fat: '0g'
    }
  },
  {
    name: 'Sprite 350ml',
    description: 'Bebida gaseosa de lima-limón, refrescante y ligera',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1625740460058-f04862efd3c8?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 38,
    prepTime: '0 mins',
    ingredients: ['Agua', 'Azúcar', 'CO2', 'Extracto de Limón'],
    allergens: [],
    nutritionInfo: {
      calories: 140,
      protein: '0g',
      carbs: '35g',
      fat: '0g'
    }
  },
  {
    name: 'Fanta 350ml',
    description: 'Bebida gaseosa sabor naranja',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.4,
    reviewCount: 35,
    prepTime: '0 mins',
    ingredients: ['Agua', 'Azúcar', 'CO2', 'Extracto de Naranja'],
    allergens: [],
    nutritionInfo: {
      calories: 150,
      protein: '0g',
      carbs: '38g',
      fat: '0g'
    }
  },
  {
    name: 'Agua Mineral 500ml',
    description: 'Agua purificada sin gas',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'agua'],
    rating: 4.7,
    reviewCount: 28,
    prepTime: '0 mins',
    ingredients: ['Agua'],
    allergens: [],
    nutritionInfo: {
      calories: 0,
      protein: '0g',
      carbs: '0g',
      fat: '0g'
    }
  },
  // Acompañamientos
  {
    name: 'Papas Fritas',
    description: 'Porción de papas fritas crocantes con sal',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    category: 'Acompañamientos',
    tags: ['acompañamiento', 'papas'],
    rating: 4.8,
    reviewCount: 56,
    prepTime: '8 mins',
    ingredients: ['Papas', 'Aceite vegetal', 'Sal'],
    allergens: [],
    nutritionInfo: {
      calories: 320,
      protein: '4g',
      carbs: '42g',
      fat: '15g'
    }
  },
  {
    name: 'Ensalada Verde',
    description: 'Mix de lechugas frescas con tomate cherry y aderezo',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    category: 'Acompañamientos',
    tags: ['acompañamiento', 'ensalada', 'vegano'],
    rating: 4.6,
    reviewCount: 31,
    prepTime: '5 mins',
    ingredients: ['Lechuga', 'Tomate cherry', 'Zanahoria', 'Aderezo vinagreta'],
    allergens: [],
    nutritionInfo: {
      calories: 120,
      protein: '2g',
      carbs: '8g',
      fat: '9g'
    }
  }
];

async function addComplements() {
  console.log('🍹 Agregando bebidas y acompañamientos a TacoKei...');

  try {
    // Find TacoKei cook
    const cooksSnapshot = await db.collection('cooks')
      .where('displayName', '==', 'TacoKei')
      .get();

    if (cooksSnapshot.empty) {
      console.log('❌ No se encontró el perfil de TacoKei');
      process.exit(1);
    }

    const cookDoc = cooksSnapshot.docs[0];
    const cookId = cookDoc.id;

    console.log(`✅ Encontrado TacoKei con ID: ${cookId}`);

    // Create complement dishes
    console.log('🍽️  Creando complementos...');
    const dishIds: string[] = [];

    for (const complementData of complements) {
      const completeDishData = {
        ...complementData,
        cookerId: cookId,
        cookerName: 'TacoKei',
        cookerAvatar: '/api/placeholder/50/50',
        cookerRating: 4.9,
        isAvailable: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };

      const dishRef = await db.collection('dishes').add(completeDishData);
      const dishId = dishRef.id;

      dishIds.push(dishId);
      console.log(`  ✓ ${complementData.name} creado (${dishId})`);
    }

    console.log('\n🎉 ¡Complementos agregados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Bebidas: 4`);
    console.log(`   - Acompañamientos: 2`);
    console.log(`   - Total: ${dishIds.length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error agregando complementos:', error);
    process.exit(1);
  }
}

// Run the script
addComplements();