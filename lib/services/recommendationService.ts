import { Dish, Cook } from '@/lib/firebase/dataService';

// Export interfaces for RecommendationDashboard compatibility
export interface DishRecommendation {
  dishId: string;
  score: number;
  matchType: string;
  reasons: string[];
  confidence: number;
}

export interface CookRecommendation {
  cookId: string;
  score: number;
  matchType: string;
  reasons: string[];
  confidence: number;
}

interface DishWithCook extends Dish {
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
  distance: string;
  isFavorite: boolean;
  cookerSelfDelivery: boolean;
}

interface RecommendationFilters {
  timeOfDay: 'desayuno' | 'almuerzo' | 'cena' | 'bajón';
  userPreferences?: string[];
  location?: { lat: number; lng: number };
  budget?: { min: number; max: number };
  dietaryRestrictions?: string[];
  previousOrders?: string[];
}

interface RecommendationResult {
  featured: DishWithCook[];
  trending: DishWithCook[];
  popular: DishWithCook[];
  nearYou: DishWithCook[];
  forYou: DishWithCook[];
  newAndExciting: DishWithCook[];
  quickBites: DishWithCook[];
  premiumPicks: DishWithCook[];
}

export class RecommendationService {
  
  static getTimeOfDay(): 'desayuno' | 'almuerzo' | 'cena' | 'bajón' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 11) {
      return 'desayuno';
    } else if (hour >= 11 && hour < 16) {
      return 'almuerzo';
    } else if (hour >= 16 && hour < 23) {
      return 'cena';
    } else {
      return 'bajón'; // 23:00 - 6:00
    }
  }

  static getTimeBasedCategories(timeOfDay: string): string[] {
    const categoryMapping = {
      desayuno: ['Desayuno', 'Para Tomar', 'Saludable', 'Vegana'],
      almuerzo: ['Italiana', 'Mexicana', 'Americana', 'China', 'Saludable'],
      cena: ['Francesa', 'Italiana', 'Japonesa', 'Mediterránea', 'India'],
      bajón: ['Acompañamientos', 'Para Tomar', 'Americana', 'Mexicana']
    };

    return categoryMapping[timeOfDay as keyof typeof categoryMapping] || [];
  }

  static calculatePopularityScore(dish: DishWithCook): number {
    // Mock calculation based on rating, review count, and randomness for demo
    const ratingScore = dish.rating * 20;
    const reviewScore = Math.min(dish.reviewCount * 2, 40);
    const randomBoost = Math.random() * 40; // Simulate real-time popularity
    
    return Math.round(ratingScore + reviewScore + randomBoost);
  }

  static calculateTrendingScore(dish: DishWithCook): number {
    // Mock trending calculation - in real app, this would be based on recent order velocity
    const recentPopularity = Math.random() * 100;
    const ratingBonus = dish.rating >= 4.5 ? 20 : 0;
    const newBonus = this.isDishNew(dish) ? 30 : 0;
    
    return Math.round(recentPopularity + ratingBonus + newBonus);
  }

  static isDishNew(dish: DishWithCook): boolean {
    // Mock new dish detection - in real app, compare with createdAt timestamp
    if (dish.createdAt) {
      const daysDiff = (new Date().getTime() - dish.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // New if created within 7 days
    }
    return Math.random() < 0.1; // 10% chance for demo
  }

  static isPremiumDish(dish: DishWithCook): boolean {
    return dish.price > 15000 && dish.rating >= 4.5;
  }

  static isQuickBite(dish: DishWithCook): boolean {
    const prepTime = typeof dish.prepTime === 'string' 
      ? parseInt(dish.prepTime.replace(/\D/g, '')) 
      : dish.prepTime as number;
    return prepTime <= 20;
  }

  static filterByTimeOfDay(dishes: DishWithCook[], timeOfDay: string): DishWithCook[] {
    const relevantCategories = this.getTimeBasedCategories(timeOfDay);
    
    return dishes.filter(dish => {
      // Check if dish category matches time of day
      if (relevantCategories.includes(dish.category)) {
        return true;
      }
      
      // Check tags for time-relevant keywords
      const timeKeywords = {
        desayuno: ['desayuno', 'morning', 'café', 'breakfast'],
        almuerzo: ['almuerzo', 'lunch', 'completo', 'main'],
        cena: ['cena', 'dinner', 'evening', 'elegant'],
        bajón: ['snack', 'late', 'quick', 'comfort']
      };
      
      const keywords = timeKeywords[timeOfDay as keyof typeof timeKeywords] || [];
      return keywords.some(keyword => 
        dish.tags?.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())) ||
        dish.name.toLowerCase().includes(keyword.toLowerCase()) ||
        dish.description.toLowerCase().includes(keyword.toLowerCase())
      );
    });
  }

  static generateRecommendations(
    allDishes: DishWithCook[], 
    filters: RecommendationFilters
  ): RecommendationResult {
    
    // Filter available dishes
    const availableDishes = allDishes.filter(dish => dish.isAvailable);
    
    // Time-based filtering
    const timeRelevantDishes = this.filterByTimeOfDay(availableDishes, filters.timeOfDay);
    
    // Calculate scores for all dishes
    const dishesWithScores = availableDishes.map(dish => ({
      ...dish,
      popularityScore: this.calculatePopularityScore(dish),
      trendingScore: this.calculateTrendingScore(dish),
      isNew: this.isDishNew(dish),
      isPremium: this.isPremiumDish(dish),
      isQuickBite: this.isQuickBite(dish)
    }));

    // Generate different recommendation categories
    
    // Featured: High-quality dishes relevant to time of day
    const featured = timeRelevantDishes
      .filter(dish => dish.rating >= 4.0)
      .sort((a, b) => {
        // Prioritize by rating and review count
        const scoreA = a.rating * 100 + a.reviewCount;
        const scoreB = b.rating * 100 + b.reviewCount;
        return scoreB - scoreA;
      })
      .slice(0, 6);

    // Trending: Dishes with high recent popularity
    const trending = dishesWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 8);

    // Popular: Overall most popular dishes
    const popular = dishesWithScores
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 8);

    // Near you: Mock location-based (in real app, would use actual distance)
    const nearYou = availableDishes
      .filter(dish => Math.random() < 0.3) // Simulate 30% being nearby
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    // For you: Personalized based on preferences and time
    const forYou = timeRelevantDishes
      .filter(dish => {
        // Mock personalization - in real app, use user history
        if (filters.userPreferences) {
          return filters.userPreferences.some(pref => 
            dish.category.toLowerCase().includes(pref.toLowerCase()) ||
            dish.tags?.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
          );
        }
        return dish.rating >= 4.2; // Fallback to high-rated dishes
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    // New and exciting: Recently added dishes
    const newAndExciting = dishesWithScores
      .filter(dish => dish.isNew)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    // Quick bites: Fast preparation dishes
    const quickBites = dishesWithScores
      .filter(dish => dish.isQuickBite)
      .sort((a, b) => {
        const prepTimeA = typeof a.prepTime === 'string' ? parseInt(a.prepTime.replace(/\D/g, '')) : a.prepTime as number;
        const prepTimeB = typeof b.prepTime === 'string' ? parseInt(b.prepTime.replace(/\D/g, '')) : b.prepTime as number;
        return prepTimeA - prepTimeB;
      })
      .slice(0, 6);

    // Premium picks: High-end dishes
    const premiumPicks = dishesWithScores
      .filter(dish => dish.isPremium)
      .sort((a, b) => b.price - a.price)
      .slice(0, 6);

    return {
      featured: featured.slice(0, 6),
      trending: trending.slice(0, 8),
      popular: popular.slice(0, 8),
      nearYou: nearYou.slice(0, 6),
      forYou: forYou.slice(0, 6),
      newAndExciting: newAndExciting.slice(0, 6),
      quickBites: quickBites.slice(0, 6),
      premiumPicks: premiumPicks.slice(0, 6)
    };
  }

  static getRecommendationSections(timeOfDay: string) {
    const commonSections = [
      {
        key: 'featured',
        title: 'Destacados para Ti',
        subtitle: 'Los mejores platos seleccionados',
        icon: '⭐',
        priority: 1
      },
      {
        key: 'trending',
        title: 'Tendencia Ahora',
        subtitle: 'Lo que está pidiendo todo el mundo',
        icon: '🔥',
        priority: 2
      },
      {
        key: 'popular',
        title: 'Más Populares',
        subtitle: 'Los favoritos de nuestros usuarios',
        icon: '❤️',
        priority: 3
      }
    ];

    const timeSpecificSections = {
      desayuno: [
        {
          key: 'quickBites',
          title: 'Desayuno Rápido',
          subtitle: 'Para empezar el día sin demora',
          icon: '⚡',
          priority: 2
        }
      ],
      almuerzo: [
        {
          key: 'forYou',
          title: 'Almuerzos',
          subtitle: 'Comidas completas y nutritivas',
          icon: '🍽️',
          priority: 2
        }
      ],
      cena: [
        {
          key: 'premiumPicks',
          title: 'Cena Premium',
          subtitle: 'Experiencias culinarias especiales',
          icon: '👑',
          priority: 2
        },
        {
          key: 'forYou',
          title: 'Ideal para tu Cena',
          subtitle: 'Sabores perfectos para cerrar el día',
          icon: '🌙',
          priority: 3
        }
      ],
      bajón: [
        {
          key: 'quickBites',
          title: 'Bajón Nocturno',
          subtitle: 'Antojos que llegan de madrugada',
          icon: '🌙',
          priority: 2
        },
        {
          key: 'forYou',
          title: 'Comfort Food',
          subtitle: 'Para esas ganas de comer algo rico',
          icon: '🤤',
          priority: 3
        }
      ]
    };

    const specificSections = timeSpecificSections[timeOfDay as keyof typeof timeSpecificSections] || [];
    
    const additionalSections = [
      {
        key: 'nearYou',
        title: 'Cerca de Ti',
        subtitle: 'Entrega más rápida',
        icon: '📍',
        priority: 5
      },
      {
        key: 'newAndExciting',
        title: 'Nuevo',
        subtitle: 'Descubre sabores únicos',
        icon: '✨',
        priority: 6
      }
    ];

    return [...commonSections, ...specificSections, ...additionalSections]
      .sort((a, b) => a.priority - b.priority);
  }

  static getDishCounts(dishes: DishWithCook[]): { [key: string]: number } {
    const counts: { [key: string]: number } = { 'All': dishes.length };
    
    dishes.forEach(dish => {
      if (dish.category) {
        counts[dish.category] = (counts[dish.category] || 0) + 1;
      }
    });

    return counts;
  }

  // Methods for RecommendationDashboard compatibility
  static async getDishRecommendations(userId: string, limit: number = 12): Promise<DishRecommendation[]> {
    try {
      const { collection, getDocs, query, orderBy, limit: firestoreLimit, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/client');
      
      // Get user preferences and order history
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get recent dishes ordered by rating and availability
      const dishesQuery = query(
        collection(db, 'dishes'),
        where('isAvailable', '==', true),
        orderBy('rating', 'desc'),
        firestoreLimit(limit * 2) // Get more to filter and score
      );
      
      const dishesSnapshot = await getDocs(dishesQuery);
      const dishes = dishesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Calculate recommendations based on user data
      const recommendations: DishRecommendation[] = [];
      
      for (const dish of dishes.slice(0, limit)) {
        let score = (dish.rating || 0) * 20; // Base score from rating (0-100)
        let matchType = 'similar';
        let reasons: string[] = ['Recomendado para ti'];
        
        // Category matching
        if (userData?.favoriteCategories?.includes(dish.category)) {
          score += 30;
          matchType = 'category';
          reasons = [`Te gusta la cocina ${dish.category.toLowerCase()}`];
        }
        
        // Cook preference matching
        if (userData?.favoriteCooks?.includes(dish.cookerId)) {
          score += 25;
          matchType = 'cook';
          reasons = ['De uno de tus cocineros favoritos'];
        }
        
        // Time of day relevance
        const timeOfDay = this.getTimeOfDay();
        const timeCategories = this.getTimeBasedCategories(timeOfDay);
        if (timeCategories.includes(dish.category)) {
          score += 15;
          reasons.push(`Perfecto para ${timeOfDay}`);
        }
        
        // Trending based on recent popularity
        if (dish.reviewCount > 20 && dish.rating >= 4.5) {
          matchType = 'trending';
          reasons = ['Muy popular esta semana'];
          score += 20;
        }
        
        recommendations.push({
          dishId: dish.id,
          score: Math.min(score, 100), // Cap at 100
          matchType,
          reasons,
          confidence: score > 80 ? 0.9 : score > 60 ? 0.8 : 0.7
        });
      }
      
      // Sort by score and return
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting dish recommendations:', error);
      // Fallback to simplified recommendations
      return [];
    }
  }

  static async getCookRecommendations(userId: string, limit: number = 6): Promise<CookRecommendation[]> {
    try {
      const { collection, getDocs, query, orderBy, limit: firestoreLimit, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/client');
      
      // Get user preferences
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get active cooks ordered by rating
      const cooksQuery = query(
        collection(db, 'cooks'),
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        firestoreLimit(limit * 2)
      );
      
      const cooksSnapshot = await getDocs(cooksQuery);
      const cooks = cooksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Calculate cook recommendations
      const recommendations: CookRecommendation[] = [];
      
      for (const cook of cooks.slice(0, limit)) {
        let score = (cook.rating || 0) * 18; // Base score from rating
        let matchType = 'similar';
        let reasons: string[] = ['Recomendado para ti'];
        
        // Check if user has ordered from this cook before
        if (userData?.favoriteCooks?.includes(cook.id)) {
          score += 35;
          matchType = 'cook';
          reasons = ['Uno de tus cocineros favoritos'];
        }
        
        // Category specialization matching
        if (userData?.favoriteCategories && cook.specialties) {
          const matchingSpecialties = cook.specialties.filter((specialty: string) => 
            userData.favoriteCategories.includes(specialty)
          );
          if (matchingSpecialties.length > 0) {
            score += 25;
            matchType = 'category';
            reasons = [`Especialista en ${matchingSpecialties[0].toLowerCase()}`];
          }
        }
        
        // High rating bonus
        if (cook.rating >= 4.7 && cook.reviewCount >= 20) {
          score += 20;
          matchType = 'trending';
          reasons = ['Cocinero muy valorado'];
        }
        
        // Self delivery preference
        if (cook.settings?.selfDelivery && userData?.preferences?.selfDelivery) {
          score += 10;
          reasons.push('Entrega directa disponible');
        }
        
        recommendations.push({
          cookId: cook.id,
          score: Math.min(score, 100),
          matchType,
          reasons,
          confidence: score > 80 ? 0.9 : score > 70 ? 0.8 : 0.75
        });
      }
      
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting cook recommendations:', error);
      return [];
    }
  }

  static async getRecommendationInsights(userId: string) {
    try {
      const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/client');
      
      // Get user's order history
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('status', '==', 'delivered'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      
      if (orders.length === 0) {
        return {
          topCategories: [],
          topIngredients: [],
          averageOrderValue: 0,
          preferredCooks: [],
          totalOrders: 0,
          averageRating: 0
        };
      }
      
      // Analyze order patterns
      const categoryCount: { [key: string]: number } = {};
      const cookCount: { [key: string]: number } = {};
      let totalValue = 0;
      let totalRatings = 0;
      let ratingSum = 0;
      
      for (const order of orders) {
        totalValue += order.total || 0;
        
        // Count categories from order items
        if (order.items) {
          for (const item of order.items) {
            if (item.category) {
              categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
            }
            if (item.cookerId) {
              cookCount[item.cookerId] = (cookCount[item.cookerId] || 0) + 1;
            }
          }
        }
        
        // Collect ratings
        if (order.rating) {
          ratingSum += order.rating;
          totalRatings++;
        }
      }
      
      // Get top categories
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);
      
      // Get preferred cooks
      const preferredCooks = Object.entries(cookCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cookId]) => cookId);
      
      return {
        topCategories,
        topIngredients: [], // Would need ingredient tracking in orders
        averageOrderValue: orders.length > 0 ? Math.round(totalValue / orders.length) : 0,
        preferredCooks,
        totalOrders: orders.length,
        averageRating: totalRatings > 0 ? ratingSum / totalRatings : 0
      };
      
    } catch (error) {
      console.error('Error getting recommendation insights:', error);
      return {
        topCategories: [],
        topIngredients: [],
        averageOrderValue: 0,
        preferredCooks: [],
        totalOrders: 0,
        averageRating: 0
      };
    }
  }
}
