import { Timestamp } from 'firebase/firestore';
import { DishesService, CooksService, OrdersService, ReviewsService, type Dish, type Cook, type Order, type Review } from './dataService';

// Initial seed data for development/testing
export const seedCooks: Omit<Cook, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    displayName: 'María Rossi',
    email: 'maria.rossi@moai.com',
    avatar: '/api/placeholder/200/200',
    coverImage: '/api/placeholder/800/300',
    bio: 'Nacida y criada en Roma, me mudé a Chile hace 25 años con las recetas de mi abuela y una pasión por la auténtica cocina italiana. Me especializo en platos de pasta tradicionales, salsas caseras y postres italianos clásicos.',
    story: 'Mi viaje culinario comenzó en la cocina de mi nonna en Trastevere, Roma, donde aprendí los secretos de la auténtica cocina italiana. A los 8 años, ya estaba haciendo pasta a mano y revolviendo el ragú perfecto. Cuando me mudé a Chile, traje conmigo estas preciadas recetas familiares.',
    location: {
      coordinates: {
        latitude: -33.4139,
        longitude: -70.6115,
        timestamp: Timestamp.now()
      },
      address: {
        street: 'Av. Las Condes 9001',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '7550000',
        country: 'Chile',
        fullAddress: 'Av. Las Condes 9001, Las Condes, Santiago, Chile'
      },
      isActive: true,
      lastUpdated: Timestamp.now()
    },
    deliveryRadius: 5,
    rating: 4.8,
    reviewCount: 234,
    totalOrders: 1247,
    yearsExperience: 20,
    joinedDate: 'Marzo 2023',
    specialties: ['Cocina Italiana Tradicional', 'Pasta Casera', 'Salsas Auténticas', 'Postres Italianos'],
    certifications: ['Chef Italiano Certificado', 'Certificado en Seguridad Alimentaria', 'Cocinero Top Rated'],
    languages: ['Italiano (Nativo)', 'Español (Fluido)', 'Inglés (Intermedio)'],
    cookingStyle: 'Italiano tradicional con presentación moderna',
    favoriteIngredients: ['Tomates San Marzano', 'Parmigiano-Reggiano', 'Albahaca Fresca', 'Aceite de Oliva Extra Virgen'],
    achievements: [
      { title: 'Cocinero Top Rated 2024', description: 'Mantuvo calificación 4.8+ por 12 meses', icon: '🏆' },
      { title: '1000+ Clientes Felices', description: 'Sirvió a más de 1000 clientes satisfechos', icon: '👥' },
      { title: 'Insignia Italiano Auténtico', description: 'Recetas italianas tradicionales verificadas', icon: '🇮🇹' },
      { title: 'Campeón de Entrega Rápida', description: 'Tiempo promedio de entrega bajo 30 minutos', icon: '⚡' }
    ],
    settings: {
      autoAcceptOrders: false,
      maxOrdersPerDay: 20,
      workingHours: { start: '09:00', end: '21:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      currency: 'CLP',
      timezone: 'America/Santiago',
      language: 'Español',
      selfDelivery: false
    }
  },
  {
    displayName: 'Carlos Mendoza',
    email: 'carlos.mendoza@moai.com',
    avatar: '/api/placeholder/200/200',
    coverImage: '/api/placeholder/800/300',
    bio: 'Chef especializado en cocina mexicana auténtica con más de 15 años de experiencia. Mis tacos y enchiladas son famosos en todo Santiago por su sabor tradicional y ingredientes frescos.',
    story: 'Aprendí a cocinar de mi madre en Guadalajara, México. Cada receta lleva el amor y la tradición de generaciones de cocineros mexicanos. Mi misión es traer los verdaderos sabores de México a Chile.',
    location: {
      coordinates: {
        latitude: -33.4250,
        longitude: -70.6143,
        timestamp: Timestamp.now()
      },
      address: {
        street: 'Av. Providencia 2222',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '7500000',
        country: 'Chile',
        fullAddress: 'Av. Providencia 2222, Providencia, Santiago, Chile'
      },
      isActive: true,
      lastUpdated: Timestamp.now()
    },
    deliveryRadius: 8,
    rating: 4.7,
    reviewCount: 189,
    totalOrders: 892,
    yearsExperience: 15,
    joinedDate: 'Enero 2023',
    specialties: ['Cocina Mexicana', 'Tacos Artesanales', 'Salsas Picantes', 'Antojitos'],
    certifications: ['Chef Mexicano Certificado', 'Especialista en Chiles'],
    languages: ['Español (Nativo)', 'Inglés (Básico)'],
    cookingStyle: 'Mexicano tradicional con toques modernos',
    favoriteIngredients: ['Chiles Frescos', 'Cilantro', 'Limón', 'Aguacate'],
    achievements: [
      { title: 'Maestro de Tacos', description: 'Especialista en tacos tradicionales', icon: '🌮' },
      { title: 'Rey de las Salsas', description: 'Más de 20 salsas diferentes', icon: '🌶️' }
    ],
    settings: {
      autoAcceptOrders: true,
      maxOrdersPerDay: 25,
      workingHours: { start: '11:00', end: '22:00' },
      workingDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      currency: 'CLP',
      timezone: 'America/Santiago',
      language: 'Español',
      selfDelivery: false
    }
  },
  {
    displayName: 'Astro Chef',
    email: 'astro@gmail.com',
    avatar: '/api/placeholder/200/200',
    coverImage: '/api/placeholder/800/300',
    bio: 'Chef especializado en cocina fusion chilena con técnicas internacionales. Combino ingredientes locales con sabores del mundo para crear experiencias únicas.',
    story: 'Mi pasión por la cocina comenzó explorando los mercados locales de Santiago. Cada plato cuenta una historia que une tradiciones culinarias de diferentes culturas.',
    location: {
      coordinates: {
        latitude: -33.4489,
        longitude: -70.6693,
        timestamp: Timestamp.now()
      },
      address: {
        street: 'Av. Providencia 1234',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '7500000',
        country: 'Chile',
        fullAddress: 'Av. Providencia 1234, Santiago, Región Metropolitana, Chile'
      },
      isActive: true,
      lastUpdated: Timestamp.now()
    },
    deliveryRadius: 6,
    rating: 4.6,
    reviewCount: 95,
    totalOrders: 324,
    yearsExperience: 8,
    joinedDate: 'Abril 2023',
    specialties: ['Cocina Fusion', 'Platos Chilenos', 'Técnicas Internacionales'],
    certifications: ['Chef Profesional', 'Certificado en Seguridad Alimentaria'],
    languages: ['Español (Nativo)', 'Inglés (Fluido)'],
    cookingStyle: 'Fusion moderna con ingredientes locales',
    favoriteIngredients: ['Merkén', 'Quinoa', 'Palta', 'Productos del Mar'],
    achievements: [
      { title: 'Chef Innovador', description: 'Creaciones únicas y populares', icon: '⭐' },
      { title: 'Sabores Locales', description: 'Especialista en ingredientes chilenos', icon: '🇨🇱' }
    ],
    settings: {
      autoAcceptOrders: false,
      maxOrdersPerDay: 15,
      workingHours: { start: '10:00', end: '20:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      currency: 'CLP',
      timezone: 'America/Santiago',
      language: 'Español',
      selfDelivery: true
    }
  }
];

export const seedDishes: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Spaghetti Carbonara',
    description: 'Auténtica carbonara romana con huevos, pecorino, panceta y pimienta negra. Hecha fresca diariamente con técnicas tradicionales transmitidas por generaciones.',
    price: 10990,
    image: '/api/placeholder/400/300',
    cookerId: 'maria-rossi', // Will be replaced with actual ID
    cookerName: 'María Rossi',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.8,
    category: 'Italiana',
    tags: ['pasta', 'auténtica', 'tradicional', 'cremosa'],
    rating: 4.9,
    reviewCount: 127,
    prepTime: '25 mins',
    isAvailable: true,
    ingredients: ['Pasta Spaghetti', 'Huevos Frescos', 'Queso Pecorino Romano', 'Panceta', 'Pimienta Negra', 'Sal Marina'],
    allergens: ['Gluten', 'Huevos', 'Lácteos'],
    nutritionInfo: {
      calories: 580,
      protein: '22g',
      carbs: '65g',
      fat: '26g'
    }
  },
  {
    name: 'Lasagna Casera',
    description: 'Lasagna tradicional en capas con salsa de carne, bechamel y mozzarella. Horneada a la perfección con ingredientes importados de Italia.',
    price: 15990,
    image: '/api/placeholder/400/300',
    cookerId: 'maria-rossi',
    cookerName: 'María Rossi',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.8,
    category: 'Italiana',
    tags: ['pasta', 'horneada', 'familiar', 'abundante'],
    rating: 4.8,
    reviewCount: 89,
    prepTime: '45 mins',
    isAvailable: true,
    ingredients: ['Pasta Lasagna', 'Carne Molida', 'Salsa de Tomate', 'Bechamel', 'Mozzarella', 'Parmesano'],
    allergens: ['Gluten', 'Lácteos'],
    nutritionInfo: {
      calories: 650,
      protein: '28g',
      carbs: '45g',
      fat: '32g'
    }
  },
  {
    name: 'Tacos al Pastor',
    description: 'Auténticos tacos al pastor con carne marinada, piña, cebolla y cilantro. Servidos con tortillas de maíz hechas a mano y salsa verde.',
    price: 8990,
    image: '/api/placeholder/400/300',
    cookerId: 'carlos-mendoza',
    cookerName: 'Carlos Mendoza',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.7,
    category: 'Mexicana',
    tags: ['tacos', 'pastor', 'picante', 'tradicional'],
    rating: 4.9,
    reviewCount: 156,
    prepTime: '20 mins',
    isAvailable: true,
    ingredients: ['Tortillas de Maíz', 'Carne de Cerdo', 'Piña', 'Cebolla', 'Cilantro', 'Salsa Verde'],
    allergens: ['Puede contener trazas de gluten'],
    nutritionInfo: {
      calories: 420,
      protein: '25g',
      carbs: '35g',
      fat: '18g'
    }
  },
  {
    name: 'Enchiladas Rojas',
    description: 'Enchiladas tradicionales bañadas en salsa roja de chiles, rellenas de pollo deshebrado y cubiertas con queso fresco y crema.',
    price: 11990,
    image: '/api/placeholder/400/300',
    cookerId: 'carlos-mendoza',
    cookerName: 'Carlos Mendoza',
    cookerAvatar: '/api/placeholder/50/50',
    cookerRating: 4.7,
    category: 'Mexicana',
    tags: ['enchiladas', 'pollo', 'picante', 'tradicional'],
    rating: 4.6,
    reviewCount: 73,
    prepTime: '30 mins',
    isAvailable: true,
    ingredients: ['Tortillas de Maíz', 'Pollo', 'Chiles Rojos', 'Queso Fresco', 'Crema', 'Cebolla'],
    allergens: ['Lácteos'],
    nutritionInfo: {
      calories: 520,
      protein: '30g',
      carbs: '40g',
      fat: '22g'
    }
  }
];

export const seedOrders: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    customerId: 'customer-1',
    customerName: 'Juan Pérez',
    cookerId: 'maria-rossi',
    dishes: [
      { dishId: 'dish-1', dishName: 'Spaghetti Carbonara', quantity: 2, price: 10990 }
    ],
    subtotal: 21980,
    deliveryFee: 2500,
    serviceFee: 1200,
    total: 25680,
    status: 'preparing',
    deliveryInfo: {
      address: 'Av. Providencia 1234, Providencia',
      phone: '+56912345678',
      instructions: 'Departamento 501, tocar timbre'
    },
    orderTime: Timestamp.now()
  },
  {
    customerId: 'customer-2',
    customerName: 'Ana García',
    cookerId: 'carlos-mendoza',
    dishes: [
      { dishId: 'dish-3', dishName: 'Tacos al Pastor', quantity: 1, price: 8990 }
    ],
    subtotal: 8990,
    deliveryFee: 2500,
    serviceFee: 900,
    total: 12390,
    status: 'ready',
    deliveryInfo: {
      address: 'Los Leones 1456, Las Condes',
      phone: '+56987654321'
    },
    orderTime: Timestamp.now()
  }
];

export const seedReviews: Omit<Review, 'id' | 'createdAt'>[] = [
  {
    customerId: 'customer-1',
    customerName: 'Juan P.',
    customerAvatar: '/api/placeholder/50/50',
    cookerId: 'maria-rossi',
    dishId: 'dish-1',
    dishName: 'Spaghetti Carbonara',
    rating: 5,
    comment: '¡Absolutamente increíble! La carbonara más auténtica que he probado fuera de Italia. La técnica de María es impecable.',
    verified: true
  },
  {
    customerId: 'customer-2',
    customerName: 'Ana G.',
    customerAvatar: '/api/placeholder/50/50',
    cookerId: 'maria-rossi',
    dishId: 'dish-2',
    dishName: 'Lasagna Casera',
    rating: 5,
    comment: 'Textura y sabor perfectos. Se nota la calidad de los ingredientes. María es una verdadera artista en la cocina.',
    verified: true
  },
  {
    customerId: 'customer-3',
    customerName: 'Miguel R.',
    customerAvatar: '/api/placeholder/50/50',
    cookerId: 'carlos-mendoza',
    dishId: 'dish-3',
    dishName: 'Tacos al Pastor',
    rating: 5,
    comment: 'Los mejores tacos al pastor de Santiago. El sabor es exactamente como en México. ¡Definitivamente volveré a pedir!',
    verified: true
  }
];

// Seeding functions
export class DataSeeder {
  static async seedAllData() {
    console.log('Starting data seeding...');
    
    try {
      // Seed cooks first
      const cookIds = await this.seedCooks();
      console.log('Cooks seeded:', cookIds);
      
      // Update dish data with actual cook IDs and seed dishes
      const dishIds = await this.seedDishes(cookIds);
      console.log('Dishes seeded:', dishIds);
      
      // Seed orders with actual IDs
      const orderIds = await this.seedOrders(cookIds, dishIds);
      console.log('Orders seeded:', orderIds);
      
      // Seed reviews with actual IDs
      const reviewIds = await this.seedReviews(cookIds, dishIds);
      console.log('Reviews seeded:', reviewIds);
      
      console.log('Data seeding completed successfully!');
      return { cookIds, dishIds, orderIds, reviewIds };
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }

  static async seedCooks(): Promise<string[]> {
    const cookIds: string[] = [];
    
    for (const cookData of seedCooks) {
      const cookId = await CooksService.createCookProfile(cookData);
      if (cookId) {
        cookIds.push(cookId);
      }
    }
    
    return cookIds;
  }

  static async seedDishes(cookIds: string[]): Promise<string[]> {
    const dishIds: string[] = [];
    
    for (let i = 0; i < seedDishes.length; i++) {
      const dishData = { ...seedDishes[i] };
      
      // Assign actual cook IDs
      if (i < 2) {
        dishData.cookerId = cookIds[0]; // María Rossi
      } else {
        dishData.cookerId = cookIds[1]; // Carlos Mendoza
      }
      
      const dishId = await DishesService.createDish(dishData);
      if (dishId) {
        dishIds.push(dishId);
      }
    }
    
    return dishIds;
  }

  static async seedOrders(cookIds: string[], dishIds: string[]): Promise<string[]> {
    const orderIds: string[] = [];
    
    for (let i = 0; i < seedOrders.length; i++) {
      const orderData = { ...seedOrders[i] };
      
      // Assign actual cook and dish IDs
      orderData.cookerId = cookIds[i % cookIds.length];
      orderData.dishes[0].dishId = dishIds[i % dishIds.length];
      
      const orderId = await OrdersService.createOrder(orderData);
      if (orderId) {
        orderIds.push(orderId);
      }
    }
    
    return orderIds;
  }

  static async seedReviews(cookIds: string[], dishIds: string[]): Promise<string[]> {
    const reviewIds: string[] = [];
    
    for (let i = 0; i < seedReviews.length; i++) {
      const reviewData = { ...seedReviews[i] };
      
      // Assign actual cook and dish IDs
      if (i < 2) {
        reviewData.cookerId = cookIds[0]; // María Rossi
        reviewData.dishId = dishIds[i];
      } else {
        reviewData.cookerId = cookIds[1]; // Carlos Mendoza
        reviewData.dishId = dishIds[2];
      }
      
      const reviewId = await ReviewsService.createReview(reviewData);
      if (reviewId) {
        reviewIds.push(reviewId);
      }
    }
    
    return reviewIds;
  }

  static async clearAllData() {
    console.log('Clearing all data...');
    // Note: This would require additional delete functions in the services
    // For now, you would need to manually clear the Firestore collections
    console.log('Please manually clear Firestore collections: dishes, cooks, orders, reviews');
  }
}
