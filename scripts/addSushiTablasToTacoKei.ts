// scripts/addSushiTablasToTacoKei.ts
// Script para agregar las 5 tablas de sushi a TacoKei
// Usage: npx tsx scripts/addSushiTablasToTacoKei.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as admin from 'firebase-admin';

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { PRESET_CUSTOMIZATION_GROUPS } from '../types/dishCustomization';

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

// Tablas de Sushi
const sushiTablas = [
  {
    name: 'Tabla Sushi 1',
    description: '3 rolls personalizables + 10 bolitas de arroz. Incluye: Roll Avocado (Camarón, queso crema y ciboullette), Roll Panko (Pollo Teriyaki, queso crema y cebollín), Roll Hosomaki (Kanikama y queso crema). Elige 1 topping por roll.',
    price: 19000,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    category: 'Sushi',
    tags: ['sushi', 'tabla', 'rolls', 'personalizable'],
    rating: 4.9,
    reviewCount: 89,
    prepTime: '25 mins',
    ingredients: ['Arroz de Sushi', 'Nori', 'Camarón', 'Pollo Teriyaki', 'Kanikama', 'Queso Crema', 'Toppings Variados'],
    allergens: ['Pescado', 'Mariscos', 'Lácteos', 'Gluten'],
    nutritionInfo: {
      calories: 620,
      protein: '28g',
      carbs: '78g',
      fat: '18g'
    },
    preset: 'tabla1'
  },
  {
    name: 'Tabla Sushi 2',
    description: '3 rolls panko personalizables + 10 bolitas de arroz. Incluye: Roll Panko (Camarón, queso crema y palta), Roll Panko (Pollo Teriyaki, queso crema y cebollín), Roll Panko (Salmón, queso crema, cebollín). Elige 1 topping por roll.',
    price: 24000,
    image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400',
    category: 'Sushi',
    tags: ['sushi', 'tabla', 'panko', 'premium'],
    rating: 5.0,
    reviewCount: 124,
    prepTime: '30 mins',
    ingredients: ['Arroz de Sushi', 'Nori', 'Camarón', 'Pollo Teriyaki', 'Salmón', 'Queso Crema', 'Palta', 'Panko', 'Toppings'],
    allergens: ['Pescado', 'Mariscos', 'Lácteos', 'Gluten'],
    nutritionInfo: {
      calories: 780,
      protein: '35g',
      carbs: '82g',
      fat: '28g'
    },
    preset: 'tabla2'
  },
  {
    name: 'Tabla Sushi 3',
    description: '4 rolls variados personalizables + 10 bolitas de arroz. Incluye: Roll Avocado (Camarón, queso crema y ciboullette), Roll Hosomaki (Palta, queso crema), Roll California (Pollo Teriyaki, queso crema, cebollín), Roll Panko (Salmón, queso crema, cebollín). Elige 1 topping por roll.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400',
    category: 'Sushi',
    tags: ['sushi', 'tabla', 'premium', 'variado'],
    rating: 4.9,
    reviewCount: 167,
    prepTime: '35 mins',
    ingredients: ['Arroz de Sushi', 'Nori', 'Camarón', 'Salmón', 'Pollo Teriyaki', 'Palta', 'Queso Crema', 'Toppings'],
    allergens: ['Pescado', 'Mariscos', 'Lácteos', 'Gluten'],
    nutritionInfo: {
      calories: 920,
      protein: '42g',
      carbs: '98g',
      fat: '32g'
    },
    preset: 'tabla3'
  },
  {
    name: 'Tabla Sushi 4 VEGAN',
    description: '3 rolls veganos personalizables + 10 bolitas de arroz. Incluye: Roll Panko (Maní, queso crema, cebollín), Roll California (Seitán, queso crema, ciboullette), Roll Hosomaki (Champiñón, queso crema). Elige 1 topping por roll. 100% vegano.',
    price: 19000,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    category: 'Sushi',
    tags: ['sushi', 'vegan', 'tabla', 'vegano'],
    rating: 4.8,
    reviewCount: 92,
    prepTime: '25 mins',
    ingredients: ['Arroz de Sushi', 'Nori', 'Maní', 'Seitán', 'Champiñón', 'Queso Crema Vegano', 'Toppings Veganos'],
    allergens: ['Frutos secos', 'Soja', 'Gluten'],
    nutritionInfo: {
      calories: 560,
      protein: '22g',
      carbs: '74g',
      fat: '20g'
    },
    preset: 'tabla4vegan'
  },
  {
    name: 'Tabla Sushi 5 VEGAN',
    description: '4 rolls veganos premium personalizables + 10 bolitas de arroz. Incluye: Roll Panko (Maní, queso crema, cebollín), Roll California (Seitán, queso crema, ciboullette), Roll Avocado (Zuccini furay, mango), Roll Hosomaki (Champiñón, queso crema). Elige 1 topping por roll. 100% vegano.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400',
    category: 'Sushi',
    tags: ['sushi', 'vegan', 'premium', 'vegano'],
    rating: 4.9,
    reviewCount: 118,
    prepTime: '35 mins',
    ingredients: ['Arroz de Sushi', 'Nori', 'Maní', 'Seitán', 'Zuccini', 'Mango', 'Champiñón', 'Queso Crema Vegano', 'Toppings'],
    allergens: ['Frutos secos', 'Soja', 'Gluten'],
    nutritionInfo: {
      calories: 680,
      protein: '26g',
      carbs: '88g',
      fat: '24g'
    },
    preset: 'tabla5vegan'
  }
];

async function addSushiTablas() {
  console.log('🍱 Agregando tablas de sushi a TacoKei...');

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

    // Create sushi tabla dishes
    console.log('🍽️  Creando tablas de sushi...');
    const dishIds: string[] = [];

    for (const tablaData of sushiTablas) {
      const { preset, ...dishInfo } = tablaData;

      const completeDishData = {
        ...dishInfo,
        cookerId: cookId,
        cookerName: 'TacoKei',
        cookerAvatar: '/api/placeholder/50/50',
        cookerRating: 4.9,
        isAvailable: true,
        customization: {
          enabled: true,
          groups: (PRESET_CUSTOMIZATION_GROUPS as any)[preset].map((group: any, index: number) => ({
            ...group,
            id: `${preset}-group-${index}`,
            options: group.options.map((opt: any, optIndex: number) => ({
              ...opt,
              id: `${preset}-opt-${index}-${optIndex}`,
              available: true
            }))
          }))
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };

      const dishRef = await db.collection('dishes').add(completeDishData);
      const dishId = dishRef.id;

      dishIds.push(dishId);
      console.log(`  ✓ ${tablaData.name} creada (${dishId})`);
    }

    console.log('\n🎉 ¡Tablas de sushi agregadas exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Tablas creadas: ${dishIds.length}`);
    console.log('\n🍱 Tablas disponibles:');
    sushiTablas.forEach((tabla, i) => {
      console.log(`   ${i + 1}. ${tabla.name} - $${tabla.price.toLocaleString('es-CL')}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error agregando tablas:', error);
    process.exit(1);
  }
}

// Run the script
addSushiTablas();