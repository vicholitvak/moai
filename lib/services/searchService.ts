'use client';

import { DishesService, CooksService, type Dish, type Cook } from '@/lib/firebase/dataService';
import { LocationService, type Coordinates } from '@/lib/services/locationService';

export interface SearchFilters {
  query?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  prepTime?: string; // "15 min", "30 min", "45 min", "60+ min"
  dietary?: string[]; // "vegetarian", "vegan", "gluten-free", "keto", etc.
  allergens?: string[]; // allergens to exclude
  cookingStyle?: string;
  location?: Coordinates;
  maxDistance?: number; // in km
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'prep_time' | 'distance';
  availability?: boolean;
}

export interface SearchResult {
  dishes: (Dish & {
    score?: number;
    distance?: number;
    deliveryFee?: number;
    estimatedDeliveryTime?: number;
    matchReasons?: string[];
  })[];
  totalResults: number;
  facets: SearchFacets;
  suggestions?: string[];
  searchTime: number;
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  priceRanges: { range: string; min: number; max: number; count: number }[];
  ratings: { rating: number; count: number }[];
  cookingStyles: { style: string; count: number }[];
  dietary: { type: string; count: number }[];
  prepTimes: { time: string; count: number }[];
}

export interface RecommendationOptions {
  userId?: string;
  dishId?: string;
  cookId?: string;
  location?: Coordinates;
  orderHistory?: string[];
  favoriteCategories?: string[];
  dietaryPreferences?: string[];
  pricePreference?: 'budget' | 'mid' | 'premium';
  limit?: number;
}

export interface RecommendationResult {
  dishes: (Dish & {
    recommendationScore: number;
    recommendationReason: string;
    distance?: number;
    deliveryFee?: number;
  })[];
  reasons: string[];
}

export class SearchService {
  private static searchHistory: string[] = [];
  private static popularSearches: { [key: string]: number } = {};

  // Advanced search with filters
  static async search(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Get all dishes initially
      let dishes = await DishesService.getAllDishes();
      
      // Apply availability filter first
      if (filters.availability !== false) {
        dishes = dishes.filter(dish => dish.isAvailable);
      }

      // Apply text search
      if (filters.query) {
        dishes = this.applyTextSearch(dishes, filters.query);
        this.trackSearch(filters.query);
      }

      // Apply category filter
      if (filters.category) {
        dishes = dishes.filter(dish => 
          dish.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }

      // Apply price range filter
      if (filters.priceRange) {
        dishes = dishes.filter(dish => 
          dish.price >= filters.priceRange!.min && 
          dish.price <= filters.priceRange!.max
        );
      }

      // Apply rating filter
      if (filters.rating) {
        dishes = dishes.filter(dish => dish.rating >= filters.rating!);
      }

      // Apply prep time filter
      if (filters.prepTime) {
        dishes = this.applyPrepTimeFilter(dishes, filters.prepTime);
      }

      // Apply dietary filters
      if (filters.dietary && filters.dietary.length > 0) {
        dishes = this.applyDietaryFilters(dishes, filters.dietary);
      }

      // Exclude allergens
      if (filters.allergens && filters.allergens.length > 0) {
        dishes = dishes.filter(dish => 
          !dish.allergens.some(allergen => 
            filters.allergens!.includes(allergen.toLowerCase())
          )
        );
      }

      // Apply cooking style filter
      if (filters.cookingStyle) {
        dishes = await this.applyCookingStyleFilter(dishes, filters.cookingStyle);
      }

      // Apply location-based filtering
      if (filters.location) {
        dishes = await this.applyLocationFilter(dishes, filters.location, filters.maxDistance);
      }

      // Calculate search scores for relevance
      dishes = this.calculateSearchScores(dishes, filters);

      // Apply sorting
      dishes = this.applySorting(dishes, filters.sortBy || 'relevance');

      // Generate facets
      const facets = await this.generateFacets(dishes);

      // Generate search suggestions
      const suggestions = this.generateSuggestions(filters.query);

      const searchTime = Date.now() - startTime;

      return {
        dishes,
        totalResults: dishes.length,
        facets,
        suggestions,
        searchTime
      };

    } catch (error) {
      console.error('Search error:', error);
      return {
        dishes: [],
        totalResults: 0,
        facets: this.getEmptyFacets(),
        searchTime: Date.now() - startTime
      };
    }
  }

  // Text search implementation
  private static applyTextSearch(dishes: Dish[], query: string): Dish[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return dishes.filter(dish => {
      const searchableText = [
        dish.name,
        dish.description,
        dish.category,
        ...dish.tags,
        ...dish.ingredients,
        dish.cookerName
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  // Prep time filter
  private static applyPrepTimeFilter(dishes: Dish[], prepTime: string): Dish[] {
    const timeValue = parseInt(prepTime);
    
    return dishes.filter(dish => {
      const dishPrepTime = parseInt(dish.prepTime);
      
      if (prepTime.includes('60+')) {
        return dishPrepTime >= 60;
      } else {
        return dishPrepTime <= timeValue;
      }
    });
  }

  // Dietary filters
  private static applyDietaryFilters(dishes: Dish[], dietary: string[]): Dish[] {
    return dishes.filter(dish => {
      return dietary.some(diet => 
        dish.tags.some(tag => tag.toLowerCase().includes(diet.toLowerCase())) ||
        dish.description.toLowerCase().includes(diet.toLowerCase())
      );
    });
  }

  // Cooking style filter
  private static async applyCookingStyleFilter(dishes: Dish[], cookingStyle: string): Promise<Dish[]> {
    try {
      const cooks = await CooksService.getAllCooks();
      const styleMatches = cooks
        .filter(cook => cook.cookingStyle?.toLowerCase() === cookingStyle.toLowerCase())
        .map(cook => cook.id);

      return dishes.filter(dish => styleMatches.includes(dish.cookerId));
    } catch (error) {
      console.error('Error applying cooking style filter:', error);
      return dishes;
    }
  }

  // Location-based filtering
  private static async applyLocationFilter(
    dishes: Dish[], 
    location: Coordinates, 
    maxDistance: number = 15
  ): Promise<Dish[]> {
    try {
      const nearbyCooks = await LocationService.getNearbyCooks(
        location.latitude,
        location.longitude,
        maxDistance
      );

      const nearbyDishes = dishes
        .filter(dish => nearbyCooks.find(cook => cook.id === dish.cookerId))
        .map(dish => {
          const cook = nearbyCooks.find(cook => cook.id === dish.cookerId);
          const deliveryInfo = LocationService.calculateDeliveryFee(
            location,
            cook!.location.coordinates
          );
          
          return {
            ...dish,
            distance: cook?.distance,
            deliveryFee: deliveryInfo.totalFee,
            estimatedDeliveryTime: deliveryInfo.estimatedTime
          };
        });

      return nearbyDishes;
    } catch (error) {
      console.error('Error applying location filter:', error);
      return dishes;
    }
  }

  // Calculate search relevance scores
  private static calculateSearchScores(dishes: Dish[], filters: SearchFilters): Dish[] {
    return dishes.map(dish => {
      let score = 0;
      const matchReasons: string[] = [];

      // Base score from rating and review count
      score += dish.rating * 10;
      score += Math.min(dish.reviewCount * 0.5, 20);

      // Query relevance
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const dishText = dish.name.toLowerCase();
        
        if (dishText.includes(query)) {
          score += 50;
          matchReasons.push('Nombre del plato');
        }
        
        if (dish.description.toLowerCase().includes(query)) {
          score += 30;
          matchReasons.push('Descripción');
        }
        
        if (dish.tags.some(tag => tag.toLowerCase().includes(query))) {
          score += 20;
          matchReasons.push('Categoría');
        }
      }

      // Category match bonus
      if (filters.category && dish.category.toLowerCase() === filters.category.toLowerCase()) {
        score += 25;
        matchReasons.push('Categoría exacta');
      }

      // High rating bonus
      if (dish.rating >= 4.5) {
        score += 15;
        matchReasons.push('Muy bien valorado');
      }

      // Popular dish bonus
      if (dish.reviewCount >= 20) {
        score += 10;
        matchReasons.push('Muy popular');
      }

      return {
        ...dish,
        score,
        matchReasons
      };
    });
  }

  // Apply sorting
  private static applySorting(dishes: Dish[], sortBy: string): Dish[] {
    switch (sortBy) {
      case 'price_low':
        return dishes.sort((a, b) => a.price - b.price);
      case 'price_high':
        return dishes.sort((a, b) => b.price - a.price);
      case 'rating':
        return dishes.sort((a, b) => b.rating - a.rating);
      case 'prep_time':
        return dishes.sort((a, b) => parseInt(a.prepTime) - parseInt(b.prepTime));
      case 'distance':
        return dishes.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'relevance':
      default:
        return dishes.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }

  // Generate search facets
  private static async generateFacets(dishes: Dish[]): Promise<SearchFacets> {
    // Categories
    const categoryCount: { [key: string]: number } = {};
    dishes.forEach(dish => {
      categoryCount[dish.category] = (categoryCount[dish.category] || 0) + 1;
    });

    // Price ranges
    const prices = dishes.map(dish => dish.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRanges = this.generatePriceRanges(dishes, minPrice, maxPrice);

    // Ratings
    const ratingCount: { [key: number]: number } = {};
    dishes.forEach(dish => {
      const rating = Math.floor(dish.rating);
      ratingCount[rating] = (ratingCount[rating] || 0) + 1;
    });

    // Cooking styles
    const cookingStyleCount: { [key: string]: number } = {};
    try {
      const cooks = await CooksService.getAllCooks();
      dishes.forEach(dish => {
        const cook = cooks.find(c => c.id === dish.cookerId);
        if (cook?.cookingStyle) {
          cookingStyleCount[cook.cookingStyle] = (cookingStyleCount[cook.cookingStyle] || 0) + 1;
        }
      });
    } catch (error) {
      console.error('Error generating cooking style facets:', error);
    }

    // Dietary options
    const dietaryCount: { [key: string]: number } = {};
    const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo'];
    dishes.forEach(dish => {
      const dishText = `${dish.description} ${dish.tags.join(' ')}`.toLowerCase();
      dietaryOptions.forEach(option => {
        if (dishText.includes(option)) {
          dietaryCount[option] = (dietaryCount[option] || 0) + 1;
        }
      });
    });

    // Prep times
    const prepTimeCount: { [key: string]: number } = {};
    dishes.forEach(dish => {
      const prepTime = parseInt(dish.prepTime);
      let timeRange = '60+ min';
      if (prepTime <= 15) timeRange = '15 min';
      else if (prepTime <= 30) timeRange = '30 min';
      else if (prepTime <= 45) timeRange = '45 min';
      
      prepTimeCount[timeRange] = (prepTimeCount[timeRange] || 0) + 1;
    });

    return {
      categories: Object.entries(categoryCount).map(([name, count]) => ({ name, count })),
      priceRanges,
      ratings: Object.entries(ratingCount).map(([rating, count]) => ({ 
        rating: parseInt(rating), 
        count 
      })),
      cookingStyles: Object.entries(cookingStyleCount).map(([style, count]) => ({ 
        style, 
        count 
      })),
      dietary: Object.entries(dietaryCount).map(([type, count]) => ({ type, count })),
      prepTimes: Object.entries(prepTimeCount).map(([time, count]) => ({ time, count }))
    };
  }

  // Generate price ranges
  private static generatePriceRanges(dishes: Dish[], min: number, max: number) {
    const ranges = [
      { range: 'Hasta $5.000', min: 0, max: 5000 },
      { range: '$5.000 - $10.000', min: 5000, max: 10000 },
      { range: '$10.000 - $15.000', min: 10000, max: 15000 },
      { range: '$15.000 - $20.000', min: 15000, max: 20000 },
      { range: 'Más de $20.000', min: 20000, max: Infinity }
    ];

    return ranges.map(range => ({
      ...range,
      count: dishes.filter(dish => dish.price >= range.min && dish.price < range.max).length
    })).filter(range => range.count > 0);
  }

  // Generate search suggestions
  private static generateSuggestions(query?: string): string[] {
    const popularSearches = [
      'pizza', 'empanadas', 'sushi', 'hamburguesa', 'pasta', 'ensalada',
      'pollo', 'vegetariano', 'vegan', 'sin gluten', 'postre', 'comida casera'
    ];

    if (!query) return popularSearches.slice(0, 5);

    // Filter suggestions based on query
    return popularSearches
      .filter(suggestion => suggestion.includes(query.toLowerCase()))
      .slice(0, 5);
  }

  // Track search queries
  private static trackSearch(query: string) {
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 100); // Keep last 100 searches
    
    this.popularSearches[query] = (this.popularSearches[query] || 0) + 1;
  }

  // Get empty facets structure
  private static getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      priceRanges: [],
      ratings: [],
      cookingStyles: [],
      dietary: [],
      prepTimes: []
    };
  }

  // RECOMMENDATION ENGINE
  static async getRecommendations(options: RecommendationOptions): Promise<RecommendationResult> {
    try {
      let dishes = await DishesService.getAllDishes();
      dishes = dishes.filter(dish => dish.isAvailable);

      // Get user location-based dishes if location provided
      if (options.location) {
        const nearbyDishes = await LocationService.getDishesForLocation(options.location, 15);
        dishes = nearbyDishes.length > 0 ? nearbyDishes : dishes;
      }

      const recommendations = dishes.map(dish => {
        let score = 0;
        const reasons: string[] = [];

        // Base popularity score
        score += dish.rating * 10;
        score += Math.min(dish.reviewCount * 0.5, 20);

        // Category preference matching
        if (options.favoriteCategories?.includes(dish.category)) {
          score += 40;
          reasons.push(`Te gusta ${dish.category}`);
        }

        // Dietary preference matching
        if (options.dietaryPreferences) {
          const dishText = `${dish.description} ${dish.tags.join(' ')}`.toLowerCase();
          options.dietaryPreferences.forEach(pref => {
            if (dishText.includes(pref.toLowerCase())) {
              score += 30;
              reasons.push(`Coincide con tu preferencia: ${pref}`);
            }
          });
        }

        // Price preference matching
        if (options.pricePreference) {
          if (options.pricePreference === 'budget' && dish.price <= 8000) {
            score += 20;
            reasons.push('Precio económico');
          } else if (options.pricePreference === 'mid' && dish.price > 8000 && dish.price <= 15000) {
            score += 20;
            reasons.push('Precio moderado');
          } else if (options.pricePreference === 'premium' && dish.price > 15000) {
            score += 20;
            reasons.push('Opción premium');
          }
        }

        // High rating bonus
        if (dish.rating >= 4.5) {
          score += 15;
          reasons.push('Muy bien valorado');
        }

        // New dish bonus (created in last 7 days)
        if (dish.createdAt && dish.createdAt.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          score += 10;
          reasons.push('Plato nuevo');
        }

        // Exclude dishes from order history
        if (options.orderHistory?.includes(dish.id)) {
          score -= 20;
        }

        return {
          ...dish,
          recommendationScore: score,
          recommendationReason: reasons[0] || 'Recomendado para ti'
        };
      });

      // Sort by recommendation score and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, options.limit || 10);

      // Extract unique reasons
      const allReasons = Array.from(new Set(
        sortedRecommendations.flatMap(dish => 
          dish.recommendationReason ? [dish.recommendationReason] : []
        )
      ));

      return {
        dishes: sortedRecommendations,
        reasons: allReasons
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        dishes: [],
        reasons: []
      };
    }
  }

  // Get similar dishes
  static async getSimilarDishes(dishId: string, limit: number = 6): Promise<Dish[]> {
    try {
      const dishes = await DishesService.getAllDishes();
      const targetDish = dishes.find(dish => dish.id === dishId);
      
      if (!targetDish) return [];

      const similarDishes = dishes
        .filter(dish => dish.id !== dishId && dish.isAvailable)
        .map(dish => {
          let similarity = 0;
          
          // Category match
          if (dish.category === targetDish.category) similarity += 40;
          
          // Tag overlap
          const tagOverlap = dish.tags.filter(tag => targetDish.tags.includes(tag)).length;
          similarity += tagOverlap * 10;
          
          // Price similarity (within 30%)
          const priceDiff = Math.abs(dish.price - targetDish.price) / targetDish.price;
          if (priceDiff <= 0.3) similarity += 20;
          
          // Same cook
          if (dish.cookerId === targetDish.cookerId) similarity += 30;
          
          // Ingredient overlap
          const ingredientOverlap = dish.ingredients.filter(ing => 
            targetDish.ingredients.includes(ing)
          ).length;
          similarity += ingredientOverlap * 5;

          return { ...dish, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return similarDishes;
    } catch (error) {
      console.error('Error getting similar dishes:', error);
      return [];
    }
  }

  // Get trending dishes
  static async getTrendingDishes(limit: number = 10): Promise<Dish[]> {
    try {
      const dishes = await DishesService.getAllDishes();
      
      return dishes
        .filter(dish => dish.isAvailable)
        .map(dish => {
          let trendScore = 0;
          
          // Recent reviews boost
          trendScore += dish.reviewCount * 2;
          
          // High rating boost
          trendScore += dish.rating * 10;
          
          // Recent creation boost
          if (dish.createdAt && dish.createdAt.toDate() > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) {
            trendScore += 50;
          }
          
          return { ...dish, trendScore };
        })
        .sort((a, b) => (b as any).trendScore - (a as any).trendScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting trending dishes:', error);
      return [];
    }
  }

  // Get popular categories
  static async getPopularCategories(): Promise<{ category: string; count: number; avgRating: number }[]> {
    try {
      const dishes = await DishesService.getAllDishes();
      const categoryStats: { [key: string]: { count: number; totalRating: number } } = {};
      
      dishes.filter(dish => dish.isAvailable).forEach(dish => {
        if (!categoryStats[dish.category]) {
          categoryStats[dish.category] = { count: 0, totalRating: 0 };
        }
        categoryStats[dish.category].count++;
        categoryStats[dish.category].totalRating += dish.rating;
      });

      return Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          avgRating: stats.totalRating / stats.count
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting popular categories:', error);
      return [];
    }
  }

  // Get search analytics
  static getSearchAnalytics() {
    return {
      recentSearches: this.searchHistory.slice(0, 10),
      popularSearches: Object.entries(this.popularSearches)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }))
    };
  }
}