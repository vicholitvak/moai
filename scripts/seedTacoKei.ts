// scripts/seedTacoKei.ts
// Script para crear el perfil TacoKei con menú completo personalizable
// Usage: npx tsx scripts/seedTacoKei.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { PRESET_CUSTOMIZATION_GROUPS } from '../types/dishCustomization';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// TacoKei cook profile
const tacoKeiProfile = {
  displayName: 'TacoKei',
  email: 'tacokei@moai.com',
  avatar: '/api/placeholder/200/200',
  coverImage: '/api/placeholder/800/300',
  bio: 'Especialistas en snacks gourmet: popcorn artesanal, choclitos personalizables, sopapillas caseras, rolls de sushi, bowls de gohan y tacos mexicanos. Todo hecho con ingredientes frescos y amor.',
  story: 'TacoKei nació de la pasión por combinar los mejores snacks del mundo. Desde popcorn con sabores únicos hasta sushi personalizable, cada producto es una experiencia única que puedes personalizar a tu gusto.',
  location: {
    coordinates: {
      latitude: -33.4372,
      longitude: -70.6506,
      timestamp: Timestamp.now()
    },
    address: {
      street: 'Av. Italia 1234',
      city: 'Santiago',
      state: 'Región Metropolitana',
      zipCode: '7510000',
      country: 'Chile',
      fullAddress: 'Av. Italia 1234, Ñuñoa, Santiago, Chile'
    },
    isActive: true,
    lastUpdated: Timestamp.now()
  },
  deliveryRadius: 7,
  rating: 4.9,
  reviewCount: 342,
  totalOrders: 1580,
  yearsExperience: 5,
  joinedDate: 'Enero 2024',
  specialties: ['Snacks Gourmet', 'Popcorn Artesanal', 'Sushi Personalizable', 'Comida Mexicana'],
  certifications: ['Certificado en Seguridad Alimentaria', 'Snacks Top Rated'],
  languages: ['Español (Nativo)', 'Inglés (Fluido)'],
  cookingStyle: 'Snacks gourmet personalizables con ingredientes premium',
  favoriteIngredients: ['Maíz Premium', 'Salsas Artesanales', 'Ingredientes Frescos', 'Especias Importadas'],
  achievements: [
    { title: 'Rey del Popcorn', description: 'Más de 8 sabores únicos', icon: '🍿' },
    { title: 'Maestro de Salsas', description: '19 salsas diferentes disponibles', icon: '🌶️' },
    { title: 'Personalizador Pro', description: 'Sistema de personalización completo', icon: '⚙️' },
    { title: '1500+ Clientes Felices', description: 'Más de 1500 pedidos satisfactorios', icon: '⭐' }
  ],
  settings: {
    autoAcceptOrders: false,
    maxOrdersPerDay: 50,
    workingHours: { start: '12:00', end: '23:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    currency: 'CLP',
    timezone: 'America/Santiago',
    language: 'Español',
    selfDelivery: false
  }
};

// TacoKei menu dishes with customization
const tacoKeiDishes = [
  {
    name: 'Popcorn Gourmet',
    description: 'Delicioso popcorn con tu sabor favorito. Elige entre 8 sabores únicos: desde el clásico caramelo hasta opciones premium como caramelo coco o manjar.',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Snacks',
    tags: ['popcorn', 'dulce', 'snack', 'personalizable'],
    rating: 4.8,
    reviewCount: 156,
    prepTime: '10 mins',
    isAvailable: true,
    ingredients: ['Maíz Premium', 'Saborizantes Naturales'],
    allergens: ['Puede contener trazas de lácteos y frutos secos'],
    nutritionInfo: {
      calories: 380,
      protein: '4g',
      carbs: '62g',
      fat: '12g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.popcorn.map((group, index) => ({
        ...group,
        id: `popcorn-group-${index}`
      }))
    }
  },
  {
    name: 'Choclitos Personalizados',
    description: 'Choclitos con sistema de personalización completo: elige 1-2 salsas de 19 opciones y 1-2 toppings de 24 opciones. Crea tu combinación perfecta.',
    price: 6000,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Snacks',
    tags: ['choclitos', 'maíz', 'salsas', 'personalizable'],
    rating: 4.9,
    reviewCount: 203,
    prepTime: '12 mins',
    isAvailable: true,
    ingredients: ['Maíz Tierno', 'Mantequilla', 'Salsas Variadas', 'Toppings Premium'],
    allergens: ['Lácteos', 'Puede contener trazas de frutos secos'],
    nutritionInfo: {
      calories: 320,
      protein: '6g',
      carbs: '48g',
      fat: '14g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.choclitos.map((group, index) => ({
        ...group,
        id: `choclitos-group-${index}`
      }))
    }
  },
  {
    name: 'Sopapillas (6 unidades)',
    description: 'Sopapillas caseras recién hechas. Elige entre 5 estilos diferentes: clásicas, a la chilena, mexicanas, dulces o personaliza las tuyas.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1628191010210-a59de3ba949d?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Snacks',
    tags: ['sopapillas', 'caseras', 'chileno', 'personalizable'],
    rating: 4.7,
    reviewCount: 128,
    prepTime: '15 mins',
    isAvailable: true,
    ingredients: ['Masa Casera', 'Zapallo', 'Ingredientes según estilo elegido'],
    allergens: ['Gluten', 'Según estilo elegido'],
    nutritionInfo: {
      calories: 450,
      protein: '8g',
      carbs: '68g',
      fat: '16g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.sopapillas.map((group, index) => ({
        ...group,
        id: `sopapillas-group-${index}`
      }))
    }
  },
  {
    name: 'Arma tu Roll',
    description: 'Crea tu roll perfecto eligiendo proteína (8 opciones), envoltura (5 tipos), hasta 3 verduras (12 opciones), toppings (8 opciones) y salsa final.',
    price: 8990,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Sushi',
    tags: ['sushi', 'roll', 'personalizable', 'japonés'],
    rating: 5.0,
    reviewCount: 287,
    prepTime: '18 mins',
    isAvailable: true,
    ingredients: ['Arroz para Sushi', 'Nori', 'Proteínas Frescas', 'Verduras', 'Salsas'],
    allergens: ['Pescado', 'Soja', 'Gluten', 'Sésamo'],
    nutritionInfo: {
      calories: 420,
      protein: '22g',
      carbs: '52g',
      fat: '12g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.armaturoll.map((group, index) => ({
        ...group,
        id: `armaturoll-group-${index}`
      }))
    }
  },
  {
    name: 'Gohan Bowl',
    description: 'Bowl de arroz japonés con proteína y exactamente 2 verduras a tu elección de 8 opciones. Simple, delicioso y nutritivo.',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Sushi',
    tags: ['gohan', 'bowl', 'arroz', 'japonés'],
    rating: 4.8,
    reviewCount: 94,
    prepTime: '15 mins',
    isAvailable: true,
    ingredients: ['Arroz Japonés', 'Proteína', 'Verduras Frescas', 'Salsa de Soja'],
    allergens: ['Soja', 'Según proteína elegida'],
    nutritionInfo: {
      calories: 520,
      protein: '28g',
      carbs: '68g',
      fat: '14g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.gohan.map((group, index) => ({
        ...group,
        id: `gohan-group-${index}`
      }))
    }
  },
  {
    name: 'Tacos (3 unidades)',
    description: 'Tres tacos mexicanos auténticos. Elige tu tortilla, proteína (5 opciones), hasta 3 verduras (14 opciones), salsas (14 opciones) y toppings (13 opciones).',
    price: 9500,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    cookerName: 'TacoKei',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.9,
    category: 'Mexicana',
    tags: ['tacos', 'mexicano', 'personalizable', 'auténtico'],
    rating: 4.9,
    reviewCount: 234,
    prepTime: '16 mins',
    isAvailable: true,
    ingredients: ['Tortillas Frescas', 'Proteínas Premium', 'Verduras Frescas', 'Salsas Artesanales'],
    allergens: ['Gluten', 'Según ingredientes elegidos'],
    nutritionInfo: {
      calories: 580,
      protein: '32g',
      carbs: '54g',
      fat: '22g'
    },
    customization: {
      enabled: true,
      groups: PRESET_CUSTOMIZATION_GROUPS.tacos.map((group, index) => ({
        ...group,
        id: `tacos-group-${index}`
      }))
    }
  }
];

async function seedTacoKei() {
  console.log('🌮 Creando perfil de TacoKei...');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('✅ Firebase inicializado');

    // Create TacoKei cook profile
    console.log('👨‍🍳 Creando perfil de cocinero TacoKei...');

    const cookData = {
      ...tacoKeiProfile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const cookRef = await addDoc(collection(db, 'cooks'), cookData);
    const cookId = cookRef.id;

    console.log(`✅ Perfil TacoKei creado con ID: ${cookId}`);

    // Create all dishes with customization
    console.log('🍽️  Creando platos del menú...');
    const dishIds: string[] = [];

    for (const dishData of tacoKeiDishes) {
      const completeDishData = {
        ...dishData,
        cookerId: cookId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const dishRef = await addDoc(collection(db, 'dishes'), completeDishData);
      const dishId = dishRef.id;

      dishIds.push(dishId);
      console.log(`  ✓ ${dishData.name} creado (${dishId})`);
    }

    console.log('\n🎉 ¡TacoKei configurado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Cocinero: TacoKei (${cookId})`);
    console.log(`   - Platos creados: ${dishIds.length}`);
    console.log('\n🍿 Platos disponibles:');
    tacoKeiDishes.forEach((dish, i) => {
      console.log(`   ${i + 1}. ${dish.name} - $${dish.price.toLocaleString('es-CL')}`);
    });
    console.log('\n✨ Todos los platos tienen personalización completa activada');

  } catch (error) {
    console.error('❌ Error creando TacoKei:', error);
    process.exit(1);
  }
}

// Run the seed
seedTacoKei();