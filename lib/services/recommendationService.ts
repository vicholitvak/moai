export interface UserPreferences {
  userId: string;
  favoriteCategories: string[];
  favoriteIngredients: string[];
  dietaryRestrictions: string[];
  priceRange: {
    min: number;
    max: number;
  };
  preferredCooks: string[];
  ratingThreshold: number;
  maxPrepTime: number;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  lastUpdated: Date;
}

export interface DishRecommendation {
  dishId: string;
  score: number;
  reasons: string[];
  matchType: 'category' | 'ingredient' | 'cook' | 'trending' | 'similar';
}

export interface CookRecommendation {
  cookId: string;
  score: number;
  reasons: string[];
  matchType: 'rating' | 'cuisine' | 'location' | 'trending';
}

export class RecommendationService {
  private static userPreferences = new Map<string, UserPreferences>();
  private static dishScores = new Map<string, number>();
  private static cookScores = new Map<string, number>();

  // Inicializar preferencias del usuario
  static async initializeUserPreferences(userId: string): Promise<UserPreferences> {
    const defaultPreferences: UserPreferences = {
      userId,
      favoriteCategories: [],
      favoriteIngredients: [],
      dietaryRestrictions: [],
      priceRange: { min: 0, max: 50000 },
      preferredCooks: [],
      ratingThreshold: 4.0,
      maxPrepTime: 60,
      location: { latitude: 0, longitude: 0, radius: 10000 },
      lastUpdated: new Date()
    };

    this.userPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  // Actualizar preferencias basado en comportamiento
  static async updatePreferencesFromBehavior(
    userId: string, 
    action: 'view' | 'order' | 'favorite' | 'review',
    data: any
  ): Promise<void> {
    const preferences = this.userPreferences.get(userId) || await this.initializeUserPreferences(userId);

    switch (action) {
      case 'view':
        this.updateFromView(preferences, data);
        break;
      case 'order':
        this.updateFromOrder(preferences, data);
        break;
      case 'favorite':
        this.updateFromFavorite(preferences, data);
        break;
      case 'review':
        this.updateFromReview(preferences, data);
        break;
    }

    preferences.lastUpdated = new Date();
    this.userPreferences.set(userId, preferences);
    this.persistPreferences(userId, preferences);
  }

  private static updateFromView(preferences: UserPreferences, data: any) {
    // Incrementar score de categoría vista
    if (data.category && !preferences.favoriteCategories.includes(data.category)) {
      preferences.favoriteCategories.push(data.category);
    }

    // Actualizar rango de precios si es consistente
    if (data.price) {
      const currentRange = preferences.priceRange;
      if (data.price < currentRange.min) {
        currentRange.min = Math.max(0, data.price - 2000);
      }
      if (data.price > currentRange.max) {
        currentRange.max = data.price + 2000;
      }
    }
  }

  private static updateFromOrder(preferences: UserPreferences, data: any) {
    // Añadir cocinero a preferidos si no está
    if (data.cookId && !preferences.preferredCooks.includes(data.cookId)) {
      preferences.preferredCooks.push(data.cookId);
    }

    // Actualizar ingredientes favoritos
    if (data.ingredients) {
      data.ingredients.forEach((ingredient: string) => {
        if (!preferences.favoriteIngredients.includes(ingredient)) {
          preferences.favoriteIngredients.push(ingredient);
        }
      });
    }

    // Ajustar rango de precios basado en pedidos
    if (data.total) {
      const currentRange = preferences.priceRange;
      currentRange.max = Math.max(currentRange.max, data.total * 1.2);
    }
  }

  private static updateFromFavorite(preferences: UserPreferences, data: any) {
    // Añadir categoría a favoritas
    if (data.category && !preferences.favoriteCategories.includes(data.category)) {
      preferences.favoriteCategories.unshift(data.category);
      // Mantener solo las 10 categorías más recientes
      preferences.favoriteCategories = preferences.favoriteCategories.slice(0, 10);
    }

    // Añadir ingredientes favoritos
    if (data.ingredients) {
      data.ingredients.forEach((ingredient: string) => {
        if (!preferences.favoriteIngredients.includes(ingredient)) {
          preferences.favoriteIngredients.unshift(ingredient);
        }
      });
      // Mantener solo los 20 ingredientes más recientes
      preferences.favoriteIngredients = preferences.favoriteIngredients.slice(0, 20);
    }
  }

  private static updateFromReview(preferences: UserPreferences, data: any) {
    // Ajustar rating threshold basado en reviews del usuario
    if (data.rating) {
      preferences.ratingThreshold = Math.max(3.5, data.rating - 0.5);
    }

    // Actualizar preferencias de cocineros basado en rating
    if (data.cookId && data.rating >= 4.0) {
      if (!preferences.preferredCooks.includes(data.cookId)) {
        preferences.preferredCooks.push(data.cookId);
      }
    }
  }

  // Generar recomendaciones de platos
  static async getDishRecommendations(
    userId: string, 
    limit: number = 20,
    filters?: {
      category?: string;
      maxPrice?: number;
      maxPrepTime?: number;
      location?: { latitude: number; longitude: number; radius: number };
    }
  ): Promise<DishRecommendation[]> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) {
      await this.initializeUserPreferences(userId);
    }

    // Obtener todos los platos disponibles
    const dishes = await this.getAllAvailableDishes();
    
    // Calcular scores para cada plato
    const scoredDishes = dishes.map(dish => ({
      dishId: dish.id,
      score: this.calculateDishScore(dish, preferences!, userId),
      reasons: this.getDishReasons(dish, preferences!),
      matchType: this.getDishMatchType(dish, preferences!)
    }));

    // Aplicar filtros
    let filteredDishes = scoredDishes;
    if (filters) {
      filteredDishes = this.applyDishFilters(scoredDishes, filters);
    }

    // Ordenar por score y retornar top N
    return filteredDishes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Generar recomendaciones de cocineros
  static async getCookRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<CookRecommendation[]> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) {
      await this.initializeUserPreferences(userId);
    }

    const cooks = await this.getAllActiveCooks();
    
    const scoredCooks = cooks.map(cook => ({
      cookId: cook.id,
      score: this.calculateCookScore(cook, preferences!),
      reasons: this.getCookReasons(cook, preferences!),
      matchType: this.getCookMatchType(cook, preferences!)
    }));

    return scoredCooks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calcular score de un plato
  private static calculateDishScore(dish: any, preferences: UserPreferences, userId: string): number {
    let score = 0;

    // Score por categoría favorita
    if (preferences.favoriteCategories.includes(dish.category)) {
      score += 50;
    }

    // Score por ingredientes favoritos
    const matchingIngredients = dish.ingredients?.filter((ing: string) => 
      preferences.favoriteIngredients.includes(ing)
    ) || [];
    score += matchingIngredients.length * 10;

    // Score por cocinero preferido
    if (preferences.preferredCooks.includes(dish.cookerId)) {
      score += 30;
    }

    // Score por rating
    if (dish.rating >= preferences.ratingThreshold) {
      score += (dish.rating - preferences.ratingThreshold) * 20;
    }

    // Score por precio (preferir dentro del rango)
    if (dish.price >= preferences.priceRange.min && dish.price <= preferences.priceRange.max) {
      score += 25;
    } else if (dish.price > preferences.priceRange.max) {
      score -= 15;
    }

    // Score por tiempo de preparación
    const prepTimeMinutes = parseInt(dish.prepTime) || 30;
    if (prepTimeMinutes <= preferences.maxPrepTime) {
      score += 15;
    } else {
      score -= 10;
    }

    // Score por popularidad (reviews)
    score += Math.min(dish.reviewCount * 0.5, 20);

    // Score por trending (platos nuevos o populares recientemente)
    const daysSinceCreated = (Date.now() - dish.createdAt.toDate()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated <= 7) {
      score += 10; // Plato nuevo
    }

    // Score por disponibilidad
    if (dish.isAvailable) {
      score += 10;
    }

    return Math.max(0, score);
  }

  // Calcular score de un cocinero
  private static calculateCookScore(cook: any, preferences: UserPreferences): number {
    let score = 0;

    // Score por rating
    if (cook.rating >= preferences.ratingThreshold) {
      score += (cook.rating - preferences.ratingThreshold) * 30;
    }

    // Score por especialidades que coinciden con categorías favoritas
    const matchingSpecialties = cook.specialties?.filter((spec: string) =>
      preferences.favoriteCategories.includes(spec)
    ) || [];
    score += matchingSpecialties.length * 20;

    // Score por experiencia
    score += Math.min(cook.yearsExperience * 5, 25);

    // Score por total de pedidos (popularidad)
    score += Math.min(cook.totalOrders * 0.1, 20);

    // Score por distancia (si hay ubicación)
    if (cook.location && preferences.location.latitude !== 0) {
      const distance = this.calculateDistance(
        preferences.location.latitude,
        preferences.location.longitude,
        cook.location.coordinates.latitude,
        cook.location.coordinates.longitude
      );
      
      if (distance <= preferences.location.radius) {
        score += Math.max(0, 30 - (distance / 1000) * 2); // Más puntos por estar más cerca
      }
    }

    // Score por disponibilidad
    if (cook.isActive) {
      score += 15;
    }

    return Math.max(0, score);
  }

  // Obtener razones de recomendación para platos
  private static getDishReasons(dish: any, preferences: UserPreferences): string[] {
    const reasons = [];

    if (preferences.favoriteCategories.includes(dish.category)) {
      reasons.push(`Te gusta la categoría ${dish.category}`);
    }

    const matchingIngredients = dish.ingredients?.filter((ing: string) =>
      preferences.favoriteIngredients.includes(ing)
    ) || [];
    if (matchingIngredients.length > 0) {
      reasons.push(`Contiene ingredientes que te gustan: ${matchingIngredients.join(', ')}`);
    }

    if (preferences.preferredCooks.includes(dish.cookerId)) {
      reasons.push('De un cocinero que te gusta');
    }

    if (dish.rating >= 4.5) {
      reasons.push('Excelente calificación');
    }

    if (dish.reviewCount > 50) {
      reasons.push('Muy popular');
    }

    return reasons;
  }

  // Obtener razones de recomendación para cocineros
  private static getCookReasons(cook: any, preferences: UserPreferences): string[] {
    const reasons = [];

    if (cook.rating >= 4.5) {
      reasons.push('Excelente calificación');
    }

    const matchingSpecialties = cook.specialties?.filter((spec: string) =>
      preferences.favoriteCategories.includes(spec)
    ) || [];
    if (matchingSpecialties.length > 0) {
      reasons.push(`Especializado en: ${matchingSpecialties.join(', ')}`);
    }

    if (cook.yearsExperience >= 5) {
      reasons.push('Mucha experiencia');
    }

    if (cook.totalOrders > 100) {
      reasons.push('Muy popular');
    }

    return reasons;
  }

  // Determinar tipo de match para platos
  private static getDishMatchType(dish: any, preferences: UserPreferences): DishRecommendation['matchType'] {
    if (preferences.favoriteCategories.includes(dish.category)) {
      return 'category';
    }
    if (preferences.preferredCooks.includes(dish.cookerId)) {
      return 'cook';
    }
    if (dish.ingredients?.some((ing: string) => preferences.favoriteIngredients.includes(ing))) {
      return 'ingredient';
    }
    if (dish.reviewCount > 100 && dish.rating >= 4.5) {
      return 'trending';
    }
    return 'similar';
  }

  // Determinar tipo de match para cocineros
  private static getCookMatchType(cook: any, preferences: UserPreferences): CookRecommendation['matchType'] {
    if (cook.rating >= 4.5) {
      return 'rating';
    }
    if (cook.specialties?.some((spec: string) => preferences.favoriteCategories.includes(spec))) {
      return 'cuisine';
    }
    if (cook.location && preferences.location.latitude !== 0) {
      const distance = this.calculateDistance(
        preferences.location.latitude,
        preferences.location.longitude,
        cook.location.coordinates.latitude,
        cook.location.coordinates.longitude
      );
      if (distance <= 5000) {
        return 'location';
      }
    }
    return 'trending';
  }

  // Aplicar filtros a recomendaciones
  private static applyDishFilters(
    dishes: DishRecommendation[],
    filters: any
  ): DishRecommendation[] {
    return dishes.filter(dish => {
      // Implementar filtros específicos aquí
      return true;
    });
  }

  // Calcular distancia entre dos puntos
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convertir a metros
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Obtener platos disponibles (mock - implementar con Firebase)
  private static async getAllAvailableDishes(): Promise<any[]> {
    // Implementar con Firebase
    return [];
  }

  // Obtener cocineros activos (mock - implementar con Firebase)
  private static async getAllActiveCooks(): Promise<any[]> {
    // Implementar con Firebase
    return [];
  }

  // Persistir preferencias
  private static persistPreferences(userId: string, preferences: UserPreferences): void {
    try {
      localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error persisting user preferences:', error);
    }
  }

  // Cargar preferencias
  static loadPreferences(userId: string): UserPreferences | null {
    try {
      const stored = localStorage.getItem(`user_preferences_${userId}`);
      if (stored) {
        const preferences = JSON.parse(stored);
        preferences.lastUpdated = new Date(preferences.lastUpdated);
        this.userPreferences.set(userId, preferences);
        return preferences;
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
    return null;
  }

  // Limpiar preferencias
  static clearPreferences(userId: string): void {
    this.userPreferences.delete(userId);
    localStorage.removeItem(`user_preferences_${userId}`);
  }

  // Obtener insights de recomendaciones
  static getRecommendationInsights(userId: string): {
    topCategories: string[];
    topIngredients: string[];
    averageOrderValue: number;
    preferredCooks: string[];
  } {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) {
      return {
        topCategories: [],
        topIngredients: [],
        averageOrderValue: 0,
        preferredCooks: []
      };
    }

    return {
      topCategories: preferences.favoriteCategories.slice(0, 5),
      topIngredients: preferences.favoriteIngredients.slice(0, 10),
      averageOrderValue: (preferences.priceRange.min + preferences.priceRange.max) / 2,
      preferredCooks: preferences.preferredCooks
    };
  }
}
