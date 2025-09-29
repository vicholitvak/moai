// scripts/addFullTacoKeiMenu.ts
// Script para agregar el menú completo de TacoKei
// Usage: npx tsx scripts/addFullTacoKeiMenu.ts

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

const fullMenu = [
  // BEBIDAS
  {
    name: 'Coca Cola 350cc',
    description: 'Bebida gaseosa clásica',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 42,
    prepTime: '0 mins',
    ingredients: ['Coca Cola'],
    allergens: [],
    nutritionInfo: { calories: 140, protein: '0g', carbs: '35g', fat: '0g' }
  },
  {
    name: 'Coca Cola Zero 350cc',
    description: 'Bebida gaseosa sin azúcar',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa', 'zero'],
    rating: 4.4,
    reviewCount: 38,
    prepTime: '0 mins',
    ingredients: ['Coca Cola Zero'],
    allergens: [],
    nutritionInfo: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' }
  },
  {
    name: 'Sprite 350cc',
    description: 'Bebida gaseosa de lima-limón',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1625740460058-f04862efd3c8?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 35,
    prepTime: '0 mins',
    ingredients: ['Sprite'],
    allergens: [],
    nutritionInfo: { calories: 140, protein: '0g', carbs: '35g', fat: '0g' }
  },
  {
    name: 'Fanta 350cc',
    description: 'Bebida gaseosa sabor naranja',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.4,
    reviewCount: 32,
    prepTime: '0 mins',
    ingredients: ['Fanta'],
    allergens: [],
    nutritionInfo: { calories: 150, protein: '0g', carbs: '38g', fat: '0g' }
  },
  {
    name: 'Bilz 350cc',
    description: 'Bebida gaseosa sabor cereza',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.6,
    reviewCount: 28,
    prepTime: '0 mins',
    ingredients: ['Bilz'],
    allergens: [],
    nutritionInfo: { calories: 145, protein: '0g', carbs: '36g', fat: '0g' }
  },
  {
    name: 'Pap 350cc',
    description: 'Bebida gaseosa sabor papaya',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1603833797131-3c0a75d1e3a6?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 25,
    prepTime: '0 mins',
    ingredients: ['Pap'],
    allergens: [],
    nutritionInfo: { calories: 145, protein: '0g', carbs: '36g', fat: '0g' }
  },
  {
    name: 'Kem Piña 350cc',
    description: 'Bebida gaseosa sabor piña',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1589203760299-f1b2f42e92a6?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.4,
    reviewCount: 22,
    prepTime: '0 mins',
    ingredients: ['Kem Piña'],
    allergens: [],
    nutritionInfo: { calories: 140, protein: '0g', carbs: '35g', fat: '0g' }
  },
  {
    name: 'Kem Extrema 350cc',
    description: 'Bebida gaseosa sabor frutilla',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'gaseosa'],
    rating: 4.5,
    reviewCount: 20,
    prepTime: '0 mins',
    ingredients: ['Kem Extrema'],
    allergens: [],
    nutritionInfo: { calories: 140, protein: '0g', carbs: '35g', fat: '0g' }
  },
  {
    name: 'Agua Mineral 500cc',
    description: 'Agua purificada sin gas',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'agua'],
    rating: 4.7,
    reviewCount: 45,
    prepTime: '0 mins',
    ingredients: ['Agua'],
    allergens: [],
    nutritionInfo: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' }
  },
  {
    name: 'Agua con Gas 500cc',
    description: 'Agua mineral con gas',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f0d?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'agua'],
    rating: 4.6,
    reviewCount: 38,
    prepTime: '0 mins',
    ingredients: ['Agua con Gas'],
    allergens: [],
    nutritionInfo: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' }
  },

  // BEBIDAS ENERGÉTICAS
  {
    name: 'Powerade Mora 500cc',
    description: 'Bebida isotónica sabor mora',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1622484211904-38e9f8c4d48f?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'isotónica', 'energética'],
    rating: 4.5,
    reviewCount: 32,
    prepTime: '0 mins',
    ingredients: ['Powerade'],
    allergens: [],
    nutritionInfo: { calories: 80, protein: '0g', carbs: '21g', fat: '0g' }
  },
  {
    name: 'Powerade Naranja 500cc',
    description: 'Bebida isotónica sabor naranja',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'isotónica', 'energética'],
    rating: 4.5,
    reviewCount: 30,
    prepTime: '0 mins',
    ingredients: ['Powerade'],
    allergens: [],
    nutritionInfo: { calories: 80, protein: '0g', carbs: '21g', fat: '0g' }
  },
  {
    name: 'Gatorade 500cc',
    description: 'Bebida isotónica para deportistas',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1622543925917-763c34f6f001?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'isotónica', 'energética'],
    rating: 4.6,
    reviewCount: 35,
    prepTime: '0 mins',
    ingredients: ['Gatorade'],
    allergens: [],
    nutritionInfo: { calories: 90, protein: '0g', carbs: '23g', fat: '0g' }
  },
  {
    name: 'Monster 350cc',
    description: 'Bebida energética',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1622543925917-763c34f6f001?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'energética'],
    rating: 4.4,
    reviewCount: 28,
    prepTime: '0 mins',
    ingredients: ['Monster Energy'],
    allergens: [],
    nutritionInfo: { calories: 160, protein: '0g', carbs: '40g', fat: '0g' }
  },
  {
    name: 'Red Bull 250cc',
    description: 'Bebida energética',
    price: 2200,
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'energética'],
    rating: 4.5,
    reviewCount: 40,
    prepTime: '0 mins',
    ingredients: ['Red Bull'],
    allergens: [],
    nutritionInfo: { calories: 110, protein: '0g', carbs: '28g', fat: '0g' }
  },

  // CERVEZAS
  {
    name: 'Cerveza Cristal Lata',
    description: 'Cerveza nacional',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'cerveza', 'alcohol'],
    rating: 4.3,
    reviewCount: 25,
    prepTime: '0 mins',
    ingredients: ['Cerveza'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 150, protein: '1g', carbs: '12g', fat: '0g' }
  },
  {
    name: 'Cerveza Escudo Lata',
    description: 'Cerveza nacional',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'cerveza', 'alcohol'],
    rating: 4.3,
    reviewCount: 22,
    prepTime: '0 mins',
    ingredients: ['Cerveza'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 150, protein: '1g', carbs: '12g', fat: '0g' }
  },
  {
    name: 'Cerveza Becker Lata',
    description: 'Cerveza nacional',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'cerveza', 'alcohol'],
    rating: 4.2,
    reviewCount: 20,
    prepTime: '0 mins',
    ingredients: ['Cerveza'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 150, protein: '1g', carbs: '12g', fat: '0g' }
  },
  {
    name: 'Cerveza Heineken Lata',
    description: 'Cerveza importada',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1632759495920-f00e38c8e0a3?w=400',
    category: 'Bebidas',
    tags: ['bebida', 'cerveza', 'alcohol', 'premium'],
    rating: 4.6,
    reviewCount: 30,
    prepTime: '0 mins',
    ingredients: ['Cerveza'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 150, protein: '1g', carbs: '12g', fat: '0g' }
  },

  // SOPAPILLAS
  {
    name: 'Sopapilla Chancho en Piedra',
    description: 'Sopapilla tradicional con pebre chancho en piedra',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'tradicional'],
    rating: 4.8,
    reviewCount: 65,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Pebre chancho en piedra'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 280, protein: '6g', carbs: '42g', fat: '10g' }
  },
  {
    name: 'Sopapilla Mostaza',
    description: 'Sopapilla con mostaza',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'mostaza'],
    rating: 4.7,
    reviewCount: 58,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Mostaza'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 290, protein: '6g', carbs: '43g', fat: '11g' }
  },
  {
    name: 'Sopapilla Ketchup',
    description: 'Sopapilla con ketchup',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'ketchup'],
    rating: 4.6,
    reviewCount: 52,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Ketchup'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 300, protein: '6g', carbs: '45g', fat: '11g' }
  },
  {
    name: 'Sopapilla Mayo',
    description: 'Sopapilla con mayonesa',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'mayonesa'],
    rating: 4.7,
    reviewCount: 60,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Mayonesa'],
    allergens: ['Gluten', 'Huevo'],
    nutritionInfo: { calories: 320, protein: '6g', carbs: '42g', fat: '14g' }
  },
  {
    name: 'Sopapilla Palta',
    description: 'Sopapilla con palta',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'palta'],
    rating: 4.9,
    reviewCount: 72,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Palta'],
    allergens: ['Gluten'],
    nutritionInfo: { calories: 340, protein: '7g', carbs: '44g', fat: '16g' }
  },
  {
    name: 'Sopapilla Manjar',
    description: 'Sopapilla con manjar',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    category: 'Sopapillas',
    tags: ['sopapilla', 'dulce', 'manjar'],
    rating: 4.8,
    reviewCount: 68,
    prepTime: '10 mins',
    ingredients: ['Masa de zapallo', 'Manjar'],
    allergens: ['Gluten', 'Lácteos'],
    nutritionInfo: { calories: 350, protein: '7g', carbs: '52g', fat: '12g' }
  },
];

async function addFullMenu() {
  console.log('🍽️  Agregando menú completo a TacoKei...');

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

    // Create menu items
    console.log('📝 Creando items del menú...');
    const dishIds: string[] = [];

    for (const item of fullMenu) {
      const completeDishData = {
        ...item,
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
      console.log(`  ✓ ${item.name} (${dishId})`);
    }

    console.log('\n🎉 ¡Menú completo agregado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Total items: ${dishIds.length}`);
    console.log(`   - Bebidas: ${fullMenu.filter(i => i.category === 'Bebidas').length}`);
    console.log(`   - Sopapillas: ${fullMenu.filter(i => i.category === 'Sopapillas').length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error agregando menú:', error);
    process.exit(1);
  }
}

// Run the script
addFullMenu();