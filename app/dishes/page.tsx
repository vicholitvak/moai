'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { DishesService, CooksService } from '@/lib/firebase/dataService';
import { OptimizedDishesService } from '@/lib/services/optimizedFirebaseService';
import { LazyImage } from '@/components/ui/lazy-wrapper';
import { Dish, Cook } from '@/lib/firebase/dataService';
import DishesHeroSection from '@/components/DishesHeroSection';
import EnhancedDishCard from '@/components/EnhancedDishCard';
import CategoriesCarousel from '@/components/CategoriesCarousel';
import { RecommendationService } from '@/lib/services/recommendationService';
import { SmartBadgeService, type DishWithBadges } from '@/lib/services/smartBadgeService';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Heart,
  ShoppingCart,
  ChefHat,
  Utensils,
  SlidersHorizontal,
  Grid3X3,
  List,
  LogOut,
  Loader2,
  RefreshCw,
  Truck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
// import RoleSwitcher from '@/components/RoleSwitcher'; // Removed for testing

// Categories for filtering
const categories = [
  'All', 
  'Italiana', 'Mexicana', 'Japonesa', 'India', 'Americana', 'Francesa', 'China', 'Tailandesa', 'Mediterránea', 
  'Vegana', 'Saludable', 'Acompañamientos', 'Para Tomar'
];

// Using DishWithBadges from SmartBadgeService instead

const ClientDishesPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [dishes, setDishes] = useState<DishWithBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Simple pagination state
  const [hasMoreDishes, setHasMoreDishes] = useState(false);
  const pageSize = 20;
  
  // Intelligent features state
  const [timeOfDay, setTimeOfDay] = useState<'desayuno' | 'almuerzo' | 'cena' | 'bajón'>('almuerzo');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [dishCounts, setDishCounts] = useState<{ [key: string]: number }>({});
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Initialize intelligent features
  useEffect(() => {
    // Set current time of day
    const currentTime = RecommendationService.getTimeOfDay();
    setTimeOfDay(currentTime);
    
    // Fetch dishes
    fetchDishes();
  }, []);
  
  // Generate recommendations when dishes change
  useEffect(() => {
    if (dishes.length > 0) {
      const filters = {
        timeOfDay,
        userPreferences: user?.preferences || [],
        location: user?.location,
        previousOrders: user?.orderHistory || []
      };
      
      const recs = RecommendationService.generateRecommendations(dishes, filters);
      setRecommendations(recs);
      
      // Calculate dish counts for categories carousel
      const counts = RecommendationService.getDishCounts(dishes);
      setDishCounts(counts);
    }
  }, [dishes, timeOfDay, user]);

  // Add refresh functionality - check for data changes periodically or on window focus
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when user returns to the tab
      fetchDishes();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also refresh every 2 minutes to catch any updates
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchDishes(true);
      }
    }, 120000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loading]);

  const fetchDishes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching dishes...');
      
      // Use optimized service (simplified without pagination)
      const dishesResult = await OptimizedDishesService.getDishes({
        pageSize,
        useCache: !isRefresh // Skip cache on manual refresh
      });
      
      // Get cooks data (this could also be optimized)
      const cooksData = await CooksService.getAllCooks();
      const cooksMap = new Map(cooksData.map(cook => [cook.id, cook]));
      
      console.log('Number of cooks found:', cooksData.length);
      
      // Combine dish data with cook information
      const dishesWithCookInfo: DishWithBadges[] = dishesResult.data
        .map(dish => {
          const cook = cooksMap.get(dish.cookerId);
          return {
            ...dish,
            cookerName: cook?.displayName || 'Cocinero Desconocido',
            cookerAvatar: cook?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo=',
            cookerRating: cook?.rating || 4.0,
            distance: cook?.distance || 'Nearby',
            cookerSelfDelivery: cook?.settings?.selfDelivery || false,
            isFavorite: favorites.includes(dish.id)
          };
        });
      
      setDishes(dishesWithCookInfo);
      
      setHasMoreDishes(dishesResult.hasMore);
      setLastUpdated(new Date());
      
      console.log(`Loaded ${dishesWithCookInfo.length} dishes`);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      
      // Fallback to regular service if optimized service fails
      try {
        console.log('Attempting fallback to regular DishesService...');
        const fallbackDishes = await DishesService.getAllDishes();
        const cooksData = await CooksService.getAllCooks();
        const cooksMap = new Map(cooksData.map(cook => [cook.id, cook]));
        
        console.log('Fallback dishes found:', fallbackDishes.length);
        
        const dishesWithCookInfo: DishWithBadges[] = fallbackDishes
          .map(dish => {
            const cook = cooksMap.get(dish.cookerId);
            return {
              ...dish,
              cookerName: cook?.displayName || 'Cocinero Desconocido',
              cookerAvatar: cook?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo=',
              cookerRating: cook?.rating || 4.0,
              distance: cook?.distance || 'Nearby',
              cookerSelfDelivery: cook?.settings?.selfDelivery || false,
              isFavorite: favorites.includes(dish.id)
            };
          });
        
        setDishes(dishesWithCookInfo);
        
        setHasMoreDishes(false); // No pagination for fallback
        setLastUpdated(new Date());
        
        console.log(`Fallback loaded ${dishesWithCookInfo.length} dishes`);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load more dishes (simplified)
  const loadMoreDishes = async () => {
    if (!hasMoreDishes || loading) return;
    
    // For now, just refresh to get more dishes
    // In a real app, you'd implement cursor-based pagination here
    await fetchDishes(true);
  };

  const handleRefresh = () => {
    fetchDishes(true);
  };

  const filteredDishes = dishes
    .filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.cookerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (dish.ingredients && dish.ingredients.some(ingredient => 
                            ingredient.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'time':
          return parseInt(a.prepTime.toString()) - parseInt(b.prepTime.toString());
        default:
          return 0;
      }
    });

  const toggleFavorite = (dishId: string) => {
    if (!user) {
      // Redirect to login if trying to favorite without account
      router.push(`/login?returnUrl=/dishes&action=favorite&dishId=${dishId}`);
      return;
    }
    
    const updatedFavorites = favorites.includes(dishId)
      ? favorites.filter(id => id !== dishId)
      : [...favorites, dishId];
    
    setFavorites(updatedFavorites);
    setDishes(dishes.map(dish => 
      dish.id === dishId ? { ...dish, isFavorite: !dish.isFavorite } : dish
    ));
  };

  // Function to handle dish clicks - redirect to login if not authenticated
  const handleDishClick = (dishId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!user) {
      // Show a modal or redirect to login with return URL
      router.push(`/login?returnUrl=/dishes/${dishId}`);
      return;
    }
    
    // User is authenticated, proceed to dish page
    router.push(`/dishes/${dishId}`);
  };
  
  // Get recommendation sections based on time of day
  const getRecommendationSections = () => {
    if (!recommendations) return [];
    return RecommendationService.getRecommendationSections(timeOfDay);
  };

  const DishCard = ({ dish, isListView = false }: { dish: Dish; isListView?: boolean }) => (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${!dish.isAvailable ? 'opacity-60' : ''} ${isListView ? 'flex' : ''} border-0 shadow-sm hover:shadow-xl hover:scale-[1.02]`}
          onClick={() => handleDishClick(dish.id)}>
      <div className={`relative ${isListView ? 'w-48 flex-shrink-0' : 'aspect-[4/3]'}`}>
        <LazyImage
          src={dish.image} 
          alt={dish.name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Error al cargar imagen</span>
            </div>
          }
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(dish.id);
            }}
          >
            <Heart className={`h-4 w-4 ${dish.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant={dish.isAvailable ? 'default' : 'secondary'}>
            {dish.isAvailable ? 'Disponible' : 'Agotado'}
          </Badge>
        </div>
      </div>
      
      <CardContent className={`p-4 ${isListView ? 'flex-1' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{dish.name}</h3>
          <span className="text-xl font-bold text-primary">{formatPrice(dish.price)}</span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{dish.description}</p>
        
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={dish.cookerAvatar} />
            <AvatarFallback>
              <ChefHat className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <button 
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/cooks/${dish.cookerName.toLowerCase().replace(' ', '-')}`);
            }}
          >
            {dish.cookerName}
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-sm">{dish.cookerRating}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{dish.distance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{dish.prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{dish.rating} ({dish.reviewCount})</span>
          </div>
        </div>
        
        {dish.cookerSelfDelivery && (
          <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
            <Truck className="h-4 w-4" />
            <span>Entrega por el cocinero</span>
          </div>
        )}
        
        <div className="flex gap-2 mb-3">
          {dish.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Button 
          className="w-full" 
          disabled={!dish.isAvailable}
          onClick={(e) => handleDishClick(dish.id, e)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {dish.isAvailable ? (user ? 'View Details' : 'Crear Cuenta para Pedir') : 'Sold Out'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>
                  <Utensils className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl xl:text-2xl font-bold">Discover Dishes</h1>
                <p className="text-sm text-muted-foreground hidden lg:block">Fresh homemade food from local cooks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden lg:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="hidden lg:flex">
                    <Heart className="h-4 w-4 mr-2" />
                    Favorites
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/cart')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Cart</span> ({itemCount})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/login')}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/login')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Crear Cuenta
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback>
                    <Utensils className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-bold">Explorar Platos</h1>
              </div>
              <div className="flex items-center gap-1">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/cart')}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span className="ml-1">({itemCount})</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={logout}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/login')}
                    >
                      Login
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/login')}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Role Switcher for Testing - Removed */}
      {/* <div className="container mx-auto px-4 py-2">
        <RoleSwitcher />
      </div> */}

      <div className="container mx-auto px-4 py-6">
        {/* Hero Section with Time-based Recommendations */}
        {showRecommendations && recommendations && (
          <DishesHeroSection
            featuredDishes={recommendations.featured}
            onDishClick={handleDishClick}
            onFavoriteToggle={toggleFavorite}
            timeOfDay={timeOfDay}
            user={user}
          />
        )}
        
        
        
        {/* Intelligent Recommendation Sections */}
        {showRecommendations && recommendations && (
          <div className="mb-8 space-y-8">
            {getRecommendationSections().map((section) => {
              const sectionDishes = recommendations[section.key as keyof typeof recommendations] || [];
              if (sectionDishes.length === 0) return null;
              
              return (
                <div key={section.key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                        <p className="text-sm text-gray-600">{section.subtitle}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Scroll to main dishes section
                        document.getElementById('main-dishes')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Ver todos
                      <TrendingUp className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 auto-rows-max">
                    {sectionDishes.slice(0, 8).map((dish: DishWithBadges, index: number) => {
                      // Create adaptive grid with featured cards
                      let cardSize: 'small' | 'medium' | 'large' | 'featured' = 'medium';
                      let gridClass = '';
                      
                      if (section.key === 'featured') {
                        // First card is featured (larger)
                        if (index === 0) {
                          cardSize = 'featured';
                          gridClass = 'sm:col-span-2 lg:col-span-2 xl:col-span-3 lg:row-span-2';
                        } else {
                          cardSize = 'medium';
                          gridClass = '';
                        }
                      } else if (section.key === 'trending') {
                        // Every 3rd card is large
                        cardSize = index % 3 === 0 ? 'large' : 'medium';
                        gridClass = index % 3 === 0 ? 'sm:col-span-2 lg:col-span-2' : '';
                      } else {
                        cardSize = 'medium';
                        gridClass = '';
                      }
                      
                      return (
                        <div key={dish.id} className={gridClass}>
                          <EnhancedDishCard
                            dish={dish}
                            onDishClick={handleDishClick}
                            onFavoriteToggle={toggleFavorite}
                            user={user}
                            size={cardSize}
                            showNutrition={cardSize === 'featured' || cardSize === 'large'}
                            hasDiscount={Math.random() < 0.1}
                            discountPercentage={Math.floor(Math.random() * 20) + 10}
                            popularityScore={section.key === 'trending' ? Math.floor(Math.random() * 50) + 10 : 0}
                            recommendationContext={{
                              isFromRecommendation: true,
                              recommendationType: section.key
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Toggle Recommendations */}
        <div className="mb-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{showRecommendations ? 'Ocultar' : 'Mostrar'} Recomendaciones Inteligentes</span>
          </Button>
        </div>
        
        {/* Main Dishes Section */}
        <div id="main-dishes">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Todos los Platos</h2>
              <p className="text-gray-600">Explora nuestra selección completa</p>
            </div>
          </div>
        
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes, cooks, or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-background/50 backdrop-blur border-border/50 focus:bg-background focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </Button>
            )}
          </div>

          {/* Categories Carousel - Replaces old category filter */}
          {Object.keys(dishCounts).length > 0 && (
            <CategoriesCarousel
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              dishCounts={dishCounts}
            />
          )}


          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background min-w-0 flex-1 sm:flex-initial"
              >
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="distance">Nearest First</option>
                <option value="time">Fastest Prep</option>
              </select>
              <div className="hidden md:flex items-center gap-1 ml-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                {user && (
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-1">
              <div className="md:hidden flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                {user && (
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Showing {filteredDishes.length} of {dishes.length} dishes
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando platos...</span>
          </div>
        ) : (
          /* Dishes Grid/List */
          filteredDishes.length > 0 ? (
            <>
              <div className={
                viewMode === 'grid' 
                  ? 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 auto-rows-max'
                  : 'space-y-4'
              }>
                {filteredDishes.map((dish, index) => {
                  if (viewMode === 'list') {
                    return <DishCard key={dish.id} dish={dish} isListView={true} />;
                  }
                  
                  // Adaptive grid for main dishes
                  let cardSize: 'small' | 'medium' | 'large' | 'featured' = 'medium';
                  let gridClass = '';
                  
                  // Every 7th dish is featured (larger)
                  if ((index + 1) % 7 === 0) {
                    cardSize = 'featured';
                    gridClass = 'sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-3 lg:row-span-2';
                  } 
                  // Every 5th dish is large
                  else if ((index + 1) % 5 === 0) {
                    cardSize = 'large';
                    gridClass = 'sm:col-span-2 lg:col-span-2 xl:col-span-2';
                  }
                  // High-rated dishes get medium size
                  else if (dish.rating >= 4.7) {
                    cardSize = 'medium';
                    gridClass = '';
                  }
                  // Regular dishes
                  else {
                    cardSize = 'medium';
                    gridClass = '';
                  }
                  
                  return (
                    <div key={dish.id} className={gridClass}>
                      <EnhancedDishCard
                        dish={dish}
                        onDishClick={handleDishClick}
                        onFavoriteToggle={toggleFavorite}
                        user={user}
                        size={cardSize}
                        showNutrition={cardSize === 'featured' || cardSize === 'large'}
                        hasDiscount={Math.random() < 0.08}
                        discountPercentage={Math.floor(Math.random() * 15) + 5}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Refresh Button - simplified without complex pagination */}
              {filteredDishes.length > 0 && hasMoreDishes && (
                <div className="mt-8 text-center">
                  <Button 
                    onClick={loadMoreDishes}
                    disabled={loading || refreshing}
                    variant="outline"
                  >
                    {refreshing ? 'Actualizando...' : 'Actualizar platos'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron platos</h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar tu búsqueda o filtros para encontrar más platos.
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}>
                Limpiar Filtros
              </Button>
            </div>
          )
        )}
        
        </div>
      </div>
    </div>
  );
};

export default ClientDishesPage;
