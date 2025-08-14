import { Dish } from '@/lib/firebase/dataService';
import { 
  Zap, 
  TrendingUp, 
  Flame, 
  Crown, 
  Award, 
  Clock,
  Truck,
  Leaf,
  Star
} from 'lucide-react';

export interface SmartBadge {
  id: string;
  label: string;
  icon: any;
  color: string;
  priority: number;
  condition: (dish: Dish & any) => boolean;
  animated?: boolean;
}

export interface DishWithBadges extends Dish {
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
  distance: string;
  isFavorite: boolean;
  cookerSelfDelivery: boolean;
  badges?: SmartBadge[];
}

export class SmartBadgeService {
  
  // Definición central de todas las etiquetas inteligentes
  private static badgeDefinitions: SmartBadge[] = [
    {
      id: 'new',
      label: 'Nuevo',
      icon: Zap,
      color: 'bg-green-500/90',
      priority: 1,
      animated: true,
      condition: (dish) => {
        if (dish.createdAt) {
          const daysDiff = (new Date().getTime() - dish.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }
        return false;
      }
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: TrendingUp,
      color: 'bg-red-500/90',
      priority: 2,
      condition: (dish) => {
        // Real trending logic based on recent popularity metrics
        const hasGoodRating = dish.rating >= 4.3 && dish.reviewCount >= 15;
        const hasRecentActivity = dish.reviewCount >= 10; // Minimum activity threshold
        const isRecentlyCreated = dish.createdAt ? 
          (new Date().getTime() - dish.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24) <= 30 
          : false; // Created within 30 days
        
        return hasGoodRating && (hasRecentActivity || isRecentlyCreated);
      }
    },
    {
      id: 'popular',
      label: 'Popular',
      icon: Flame,
      color: 'bg-purple-500/90',
      priority: 3,
      condition: (dish) => {
        return dish.rating >= 4.5 && dish.reviewCount >= 25;
      }
    },
    {
      id: 'top_rated',
      label: 'Top Rated',
      icon: Crown,
      color: 'bg-yellow-500/90',
      priority: 4,
      condition: (dish) => {
        return dish.rating >= 4.8;
      }
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: Award,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      priority: 5,
      condition: (dish) => {
        return dish.price > 15000 && dish.rating >= 4.5;
      }
    },
    {
      id: 'quick',
      label: 'Rápido',
      icon: Clock,
      color: 'bg-blue-500/90',
      priority: 6,
      condition: (dish) => {
        const prepTime = typeof dish.prepTime === 'string' 
          ? parseInt(dish.prepTime.replace(/\\D/g, '')) 
          : dish.prepTime as number;
        return prepTime <= 20;
      }
    },
    {
      id: 'direct_delivery',
      label: 'Entrega Directa',
      icon: Truck,
      color: 'bg-green-600/90',
      priority: 7,
      condition: (dish) => {
        return dish.cookerSelfDelivery === true;
      }
    },
    {
      id: 'healthy',
      label: 'Saludable',
      icon: Leaf,
      color: 'bg-emerald-500/90',
      priority: 8,
      condition: (dish) => {
        return dish.tags?.some((tag: string) => 
          ['saludable', 'healthy', 'vegano', 'vegan', 'sin gluten', 'gluten-free'].includes(tag.toLowerCase())
        ) || dish.category === 'Saludable';
      }
    }
  ];

  /**
   * Calcula qué badges mostrar para un plato específico
   */
  static calculateBadges(
    dish: DishWithBadges,
    context?: {
      isFromRecommendation?: boolean;
      recommendationType?: string;
      maxBadges?: number;
    }
  ): SmartBadge[] {
    const maxBadges = context?.maxBadges || 3;
    
    // Evaluar todas las condiciones
    const applicableBadges = this.badgeDefinitions
      .filter(badge => badge.condition(dish))
      .sort((a, b) => a.priority - b.priority);

    // Si viene de una recomendación específica, añadir badge contextual
    if (context?.isFromRecommendation && context?.recommendationType) {
      const recommendationBadge = this.getRecommendationBadge(context.recommendationType);
      if (recommendationBadge) {
        applicableBadges.unshift(recommendationBadge);
      }
    }

    // Aplicar lógica de prioridad y límites
    return this.applyDisplayLogic(applicableBadges, maxBadges);
  }

  /**
   * Lógica inteligente para determinar qué badges mostrar
   */
  private static applyDisplayLogic(badges: SmartBadge[], maxBadges: number): SmartBadge[] {
    // Reglas de negocio para badges
    const result: SmartBadge[] = [];
    
    // Siempre mostrar "Nuevo" si aplica
    const newBadge = badges.find(b => b.id === 'new');
    if (newBadge) {
      result.push(newBadge);
    }
    
    // Para el resto, seguir prioridades pero evitar redundancia
    const remainingBadges = badges.filter(b => b.id !== 'new');
    
    // No mostrar "Popular" y "Top Rated" juntos
    const hasTopRated = remainingBadges.some(b => b.id === 'top_rated');
    const filteredBadges = hasTopRated 
      ? remainingBadges.filter(b => b.id !== 'popular')
      : remainingBadges;
    
    // Completar hasta el límite
    const remaining = maxBadges - result.length;
    result.push(...filteredBadges.slice(0, remaining));
    
    return result;
  }

  /**
   * Obtiene badge contextual para recomendaciones
   */
  private static getRecommendationBadge(type: string): SmartBadge | null {
    const recommendationBadges: { [key: string]: SmartBadge } = {
      'trending': {
        id: 'rec_trending',
        label: 'En Tendencia',
        icon: TrendingUp,
        color: 'bg-orange-500/90',
        priority: 0,
        condition: () => true
      },
      'featured': {
        id: 'rec_featured',
        label: 'Destacado',
        icon: Star,
        color: 'bg-indigo-500/90',
        priority: 0,
        condition: () => true
      }
    };

    return recommendationBadges[type] || null;
  }

  /**
   * Obtiene estadísticas de badges para analytics
   */
  static getBadgeStats(dishes: DishWithBadges[]): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    dishes.forEach(dish => {
      const badges = this.calculateBadges(dish);
      badges.forEach(badge => {
        stats[badge.id] = (stats[badge.id] || 0) + 1;
      });
    });
    
    return stats;
  }

  /**
   * Filtra platos por tipo de badge
   */
  static filterByBadge(dishes: DishWithBadges[], badgeId: string): DishWithBadges[] {
    return dishes.filter(dish => {
      const badges = this.calculateBadges(dish);
      return badges.some(badge => badge.id === badgeId);
    });
  }

  /**
   * Obtiene la configuración de un badge específico
   */
  static getBadgeConfig(badgeId: string): SmartBadge | undefined {
    return this.badgeDefinitions.find(badge => badge.id === badgeId);
  }

  /**
   * Obtiene todos los tipos de badges disponibles
   */
  static getAllBadgeTypes(): SmartBadge[] {
    return [...this.badgeDefinitions];
  }
}