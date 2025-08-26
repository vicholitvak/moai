'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Star, 
  Heart,
  MapPin,
  ChefHat,
  Target,
  Users,
  ArrowRight,
  RefreshCw,
  Zap,
  Award,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DishesService, OrdersService, type Dish } from '@/lib/firebase/dataService';
import { SearchService, type SearchFilters } from '@/lib/services/searchService';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartRecommendationsProps {
  maxItems?: number;
  showCategories?: boolean;
  userId?: string;
}

interface RecommendationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  dishes: Dish[];
}

export function SmartRecommendations({ 
  maxItems = 6, 
  showCategories = true,
  userId 
}: SmartRecommendationsProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('for_you');
  const [refreshing, setRefreshing] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    favoriteCategories: string[];
    averageOrderValue: number;
    preferredPrepTime: string;
    dietaryRestrictions: string[];
    orderHistory: string[];
  }>({
    favoriteCategories: [],
    averageOrderValue: 0,
    preferredPrepTime: '30',
    dietaryRestrictions: [],
    orderHistory: []
  });

  useEffect(() => {
    if (user || userId) {
      loadUserPreferences();
      loadRecommendations();
    }
  }, [user, userId]);

  const loadUserPreferences = async () => {
    try {
      const currentUserId = userId || user?.uid;
      if (!currentUserId) return;

      // Load user's order history to understand preferences
      const orders = await OrdersService.getOrdersByCustomer(currentUserId);
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      
      // Analyze order patterns
      const categoryFrequency: { [key: string]: number } = {};
      const dishIds: string[] = [];
      let totalSpent = 0;
      
      deliveredOrders.forEach(order => {
        totalSpent += order.total;
        order.dishes?.forEach(dish => {
          dishIds.push(dish.dishId);
          // Approximate category from dish name (in real app, we'd have this data)
          const category = dish.dishName?.includes('pizza') ? 'Italiana' :
                          dish.dishName?.includes('burger') ? 'Americana' :
                          dish.dishName?.includes('sushi') ? 'Japonesa' : 'Variada';
          categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        });
      });

      const favoriteCategories = Object.entries(categoryFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const averageOrderValue = deliveredOrders.length > 0 ? totalSpent / deliveredOrders.length : 0;

      setUserPreferences({
        favoriteCategories,
        averageOrderValue,
        preferredPrepTime: '30', // Could be analyzed from order data
        dietaryRestrictions: [], // Would come from user profile
        orderHistory: dishIds.slice(0, 20) // Last 20 dishes
      });
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const allDishes = await DishesService.getAllDishes();
      const availableDishes = allDishes.filter(dish => dish.isAvailable);
      
      const currentTime = new Date();
      const hour = currentTime.getHours();
      
      // Determine time-based context
      const timeOfDay = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner';
      
      // Generate different recommendation categories
      const recommendationCategories: RecommendationCategory[] = [];

      // 1. For You - Personalized recommendations
      const forYou = await generatePersonalizedRecommendations(availableDishes);
      recommendationCategories.push({
        id: 'for_you',
        title: 'Para Ti',
        description: 'Seleccionados especialmente para tus gustos',
        icon: <Target className="h-5 w-5" />,
        color: 'text-purple-600 dark:text-purple-400',
        dishes: forYou.slice(0, maxItems)
      });

      // 2. Trending Now
      const trending = availableDishes
        .sort((a, b) => {
          // Mock trending score based on rating and recent activity
          const scoreA = a.rating * 10 + (a.reviewCount || 0) + Math.random() * 20;
          const scoreB = b.rating * 10 + (b.reviewCount || 0) + Math.random() * 20;
          return scoreB - scoreA;
        })
        .slice(0, maxItems);
        
      recommendationCategories.push({
        id: 'trending',
        title: 'Tendencias',
        description: 'Lo más popular en este momento',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-green-600 dark:text-green-400',
        dishes: trending
      });

      // 3. Quick Bites - Fast preparation
      const quickBites = availableDishes
        .filter(dish => {
          const prepTime = parseInt(dish.prepTime?.replace(/\D/g, '') || '30');
          return prepTime <= 20;
        })
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxItems);
        
      recommendationCategories.push({
        id: 'quick',
        title: 'Rápido y Fácil',
        description: 'Listo en menos de 20 minutos',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        dishes: quickBites
      });

      // 4. Premium Picks
      const premium = availableDishes
        .filter(dish => dish.price > 15000 && dish.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxItems);
        
      if (premium.length > 0) {
        recommendationCategories.push({
          id: 'premium',
          title: 'Selección Premium',
          description: 'Experiencias culinarias excepcionales',
          icon: <Award className="h-5 w-5" />,
          color: 'text-amber-600 dark:text-amber-400',
          dishes: premium
        });
      }

      // 5. Near You (mock location-based)
      const nearYou = availableDishes
        .filter(() => Math.random() < 0.4) // Simulate 40% being nearby
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxItems);
        
      if (nearYou.length > 0) {
        recommendationCategories.push({
          id: 'nearby',
          title: 'Cerca de Ti',
          description: 'Cocineros en tu área',
          icon: <MapPin className="h-5 w-5" />,
          color: 'text-blue-600 dark:text-blue-400',
          dishes: nearYou
        });
      }

      // 6. New & Exciting
      const newDishes = availableDishes
        .filter(dish => {
          if (dish.createdAt) {
            const daysDiff = (Date.now() - dish.createdAt.toMillis()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
          }
          return Math.random() < 0.2; // 20% chance for demo
        })
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxItems);
        
      if (newDishes.length > 0) {
        recommendationCategories.push({
          id: 'new',
          title: 'Nuevos y Emocionantes',
          description: 'Últimas creaciones de nuestros cocineros',
          icon: <Sparkles className="h-5 w-5" />,
          color: 'text-pink-600 dark:text-pink-400',
          dishes: newDishes
        });
      }

      setCategories(recommendationCategories);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Error al cargar las recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedRecommendations = async (dishes: Dish[]): Promise<Dish[]> => {
    // Use search service for advanced filtering
    const filters: SearchFilters = {
      availability: true,
      sortBy: 'rating'
    };

    // Add user preference filters
    if (userPreferences.favoriteCategories.length > 0) {
      // Prioritize dishes from favorite categories
      const favoriteCategory = userPreferences.favoriteCategories[0];
      filters.category = favoriteCategory;
    }

    // Filter by preferred price range
    if (userPreferences.averageOrderValue > 0) {
      const margin = userPreferences.averageOrderValue * 0.3;
      filters.priceRange = {
        min: Math.max(0, userPreferences.averageOrderValue - margin),
        max: userPreferences.averageOrderValue + margin
      };
    }

    // Apply dietary restrictions
    if (userPreferences.dietaryRestrictions.length > 0) {
      filters.dietary = userPreferences.dietaryRestrictions;
    }

    try {
      const searchResult = await SearchService.search(filters);
      let personalizedDishes = searchResult.dishes;

      // If we don't have enough dishes from preferences, add highly rated dishes
      if (personalizedDishes.length < maxItems) {
        const highRated = dishes
          .filter(dish => !personalizedDishes.find(pd => pd.id === dish.id))
          .filter(dish => dish.rating >= 4.0)
          .sort((a, b) => b.rating - a.rating);
        
        personalizedDishes = [...personalizedDishes, ...highRated].slice(0, maxItems);
      }

      return personalizedDishes;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return dishes
        .filter(dish => dish.rating >= 4.0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxItems);
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
    toast.success('Recomendaciones actualizadas');
  };

  const handleAddToCart = async (dish: Dish) => {
    if (!user && !userId) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      return;
    }

    try {
      const cartItem = {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        cookerName: dish.cookerName,
        cookerId: dish.cookerId,
        cookerAvatar: dish.cookerAvatar,
        quantity: 1,
        prepTime: dish.prepTime,
        category: dish.category
      };

      addToCart(cartItem);
      toast.success(`${dish.name} agregado al carrito`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  const DishCard = ({ dish }: { dish: Dish }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        onClick={() => router.push(`/dishes/${dish.id}`)}
      >
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
          <img 
            src={dish.image} 
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              {dish.rating?.toFixed(1) || 'Nuevo'}
            </Badge>
          </div>
          {dish.reviewCount && dish.reviewCount > 10 && (
            <Badge className="absolute top-2 left-2 bg-green-500/90 text-white">
              Popular
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {dish.name}
            </h3>
            <span className="text-lg font-bold text-primary">{formatPrice(dish.price)}</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {dish.description}
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={dish.cookerAvatar} />
              <AvatarFallback>{dish.cookerName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{dish.cookerName}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{dish.prepTime}</span>
            </div>
            <span className="text-xs">{dish.category}</span>
          </div>
          
          <Button 
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(dish);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar al Carrito
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="aspect-[4/3] bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!showCategories && categories.length > 0) {
    // Simple grid view
    const allDishes = categories.flatMap(cat => cat.dishes).slice(0, maxItems);
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AnimatePresence>
          {allDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recomendaciones Inteligentes</h2>
          <p className="text-muted-foreground">
            Descubre platos perfectos para ti basados en tus gustos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRecommendations}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-12 items-center justify-start w-max p-1 bg-muted rounded-lg">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span className={category.color}>{category.icon}</span>
                <span>{category.title}</span>
                <Badge variant="secondary" className="ml-1">
                  {category.dishes.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Content */}
        <AnimatePresence mode="wait">
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className={category.color}>{category.icon}</span>
                      {category.title}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {category.dishes.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <AnimatePresence>
                          {category.dishes.map((dish) => (
                            <DishCard key={dish.id} dish={dish} />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No hay platos disponibles en esta categoría
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}