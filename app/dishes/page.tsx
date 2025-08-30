'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { DishesService, CooksService } from '@/lib/firebase/dataService';
import { OptimizedDishesService } from '@/lib/services/optimizedFirebaseService';
import type { Dish, Cook } from '@/lib/firebase/dataService';
import DishesHeroSection from '@/components/DishesHeroSection';
import EnhancedDishCard from '@/components/EnhancedDishCard';
import { RecommendationService } from '@/lib/services/recommendationService';
import type { DishWithBadges } from '@/lib/services/smartBadgeService';
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
  Sparkles,
  TrendingUp,
  Filter,
  ChevronDown,
  Zap,
  Flame,
  Leaf,
  Shield,
  Award,
  Users,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { LocationService } from '@/lib/services/locationService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Enhanced categories with icons and colors
const categories = [
  { id: 'All', name: 'Todos', icon: Utensils, color: 'bg-slate-500' },
  { id: 'Italiana', name: 'Italiana', icon: ChefHat, color: 'bg-red-500' },
  { id: 'Mexicana', name: 'Mexicana', icon: Flame, color: 'bg-orange-500' },
  { id: 'Japonesa', name: 'Japonesa', icon: Award, color: 'bg-pink-500' },
  { id: 'India', name: 'India', icon: Sparkles, color: 'bg-yellow-500' },
  { id: 'Americana', name: 'Americana', icon: Star, color: 'bg-blue-500' },
  { id: 'Francesa', name: 'Francesa', icon: Users, color: 'bg-purple-500' },
  { id: 'China', name: 'China', icon: Shield, color: 'bg-green-500' },
  { id: 'Tailandesa', name: 'Tailandesa', icon: TrendingUp, color: 'bg-teal-500' },
  { id: 'Mediterránea', name: 'Mediterránea', icon: Leaf, color: 'bg-emerald-500' },
  { id: 'Vegana', name: 'Vegana', icon: Leaf, color: 'bg-green-600' },
  { id: 'Saludable', name: 'Saludable', icon: Sparkles, color: 'bg-blue-600' },
  { id: 'Acompañamientos', name: 'Acompañamientos', icon: Utensils, color: 'bg-slate-600' },
  { id: 'Para Tomar', name: 'Para Tomar', icon: Calendar, color: 'bg-indigo-500' }
];

// Dietary preferences
const dietaryOptions = [
  { id: 'vegan', label: 'Vegano', icon: Leaf },
  { id: 'healthy', label: 'Saludable', icon: Sparkles },
  { id: 'gluten-free', label: 'Sin Gluten', icon: Shield },
  { id: 'spicy', label: 'Picante', icon: Flame },
  { id: 'organic', label: 'Orgánico', icon: Award }
];

// Sort options
const sortOptions = [
  { value: 'rating', label: 'Mejor Calificado', icon: Star },
  { value: 'price-low', label: 'Precio: Menor a Mayor', icon: SortAsc },
  { value: 'price-high', label: 'Precio: Mayor a Menor', icon: SortDesc },
  { value: 'distance', label: 'Más Cercano', icon: MapPin },
  { value: 'time', label: 'Tiempo de Preparación', icon: Clock },
  { value: 'popularity', label: 'Más Popular', icon: TrendingUp }
];

const ClientDishesPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [dishes, setDishes] = useState<DishWithBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Enhanced filtering state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxPrepTime, setMaxPrepTime] = useState(120);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [showOnlySelfDelivery, setShowOnlySelfDelivery] = useState(false);
  
  // Simple pagination state
  const [hasMoreDishes, setHasMoreDishes] = useState(false);
  const pageSize = 20;
  
  // Intelligent features state
  const [timeOfDay, setTimeOfDay] = useState<'desayuno' | 'almuerzo' | 'cena' | 'bajón'>('almuerzo');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Location-based state
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [useLocationFilter, setUseLocationFilter] = useState(false);

  const fetchDishes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('Fetching dishes...');

      let dishesResult;

      // Use location-based filtering if a city is selected
      if (selectedCityId && useLocationFilter) {
        console.log('Fetching dishes for city:', selectedCityId);
        const locationDishes = await LocationService.getDishesForChileanCity(selectedCityId);

        // Convert to DishWithBadges format
        dishesResult = {
          data: locationDishes.map(dish => ({
            ...dish,
            cookerName: dish.cookerName || 'Cocinero Local',
            cookerAvatar: dish.cookerAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo=',
            cookerRating: dish.cookerRating || 4.0,
            distance: dish.cookDistance ? `${dish.cookDistance.toFixed(1)} km` : 'Cerca',
            cookerSelfDelivery: false,
            isFavorite: favorites.includes(dish.id)
          })),
          hasMore: false
        };
      } else {
        // Use optimized service
        dishesResult = await OptimizedDishesService.getDishes({
          pageSize,
          useCache: !isRefresh
        });
      }

      // Get cooks data only if not using location-based filtering
      if (!selectedCityId || !useLocationFilter) {
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
              distance: 'Cerca',
              cookerSelfDelivery: cook?.settings?.selfDelivery || false,
              isFavorite: favorites.includes(dish.id)
            };
          });

        setDishes(dishesWithCookInfo);
      } else {
        // Use location-based dishes
        const dishesWithCookInfo: DishWithBadges[] = dishesResult.data.map(dish => ({
          ...dish,
          cookerSelfDelivery: false,
        }));

        setDishes(dishesWithCookInfo);
      }

      setHasMoreDishes(dishesResult.hasMore);
      setLastUpdated(new Date());

      console.log(`Loaded ${dishesResult.data.length} dishes`);
    } catch (error) {
      console.error('Error fetching dishes:', error instanceof Error ? error.message : String(error));

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
              cookerAvatar: cook?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Olk9IDM1QzEwIDI2LjcxNTcgMTYuNzE1NyAyMCAyNSAyMEMzMy4yODQzIDIwIDQwIDI2LjcxNTcgNDAgMzVWNDVIMFYzNVoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+',
              cookerRating: cook?.rating || 4.0,
              distance: 'Cerca',
              cookerSelfDelivery: cook?.settings?.selfDelivery || false,
              isFavorite: favorites.includes(dish.id)
            };
          });

        setDishes(dishesWithCookInfo);
        setHasMoreDishes(false);
        setLastUpdated(new Date());

        console.log(`Fallback loaded ${dishesWithCookInfo.length} dishes`);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCityId, useLocationFilter, pageSize, favorites]);

  // Initialize intelligent features
  useEffect(() => {
    // Set current time of day
    const currentTime = RecommendationService.getTimeOfDay();
    setTimeOfDay(currentTime);
    
    // Fetch dishes
    fetchDishes();
  }, [fetchDishes]);
  
  // Generate recommendations when dishes change
  useEffect(() => {
    if (dishes.length > 0) {
      const filters = {
        timeOfDay,
        userPreferences: (user as any)?.preferences || [],
        location: (user as any)?.location,
        previousOrders: (user as any)?.orderHistory || []
      };
      
      const recs = RecommendationService.generateRecommendations(dishes, filters);
      setRecommendations(recs);
    }
  }, [dishes, timeOfDay, user]);

  // Add refresh functionality
  useEffect(() => {
    const handleFocus = () => {
      fetchDishes();
    };

    window.addEventListener('focus', handleFocus);
    
    // Refresh every 3 minutes
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchDishes(true);
      }
    }, 180000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loading, refreshing, fetchDishes]);

  const loadMoreDishes = async () => {
    if (loading || !hasMoreDishes) return;
    
    setLoading(true);
    await fetchDishes(false); // Use the existing fetchDishes function
    setLoading(false);
  };

  const handleRefresh = () => {
    fetchDishes(true);
  };

  // Enhanced filtering logic
  const filteredDishes = useMemo(() => {
    return dishes
      .filter(dish => {
        // Search query filter
        const matchesSearch = !searchQuery || 
          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dish.cookerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dish.ingredients && dish.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(searchQuery.toLowerCase())));
        
        // Category filter
        const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
        
        // Price range filter
        const matchesPrice = dish.price >= priceRange[0] && dish.price <= priceRange[1];
        
        // Dietary preferences filter
        const matchesDietary = selectedDietary.length === 0 || selectedDietary.some(pref => {
          switch (pref) {
            case 'vegan': return dish.tags?.includes('vegano') || dish.tags?.includes('vegan');
            case 'healthy': return dish.tags?.includes('saludable') || dish.tags?.includes('healthy');
            case 'gluten-free': return dish.tags?.includes('sin gluten') || dish.tags?.includes('gluten-free');
            case 'spicy': return dish.tags?.includes('picante') || dish.tags?.includes('spicy');
            case 'organic': return dish.tags?.includes('orgánico') || dish.tags?.includes('organic');
            default: return false;
          }
        });
        
        // Rating filter
        const matchesRating = dish.rating >= minRating;
        
        // Prep time filter
        const prepTimeMinutes = parseInt(dish.prepTime) || 0;
        const matchesPrepTime = prepTimeMinutes <= maxPrepTime;
        
        // Availability filter
        const matchesAvailability = !showOnlyAvailable || dish.isAvailable;
        
        // Self-delivery filter
        const matchesSelfDelivery = !showOnlySelfDelivery || dish.cookerSelfDelivery;
        
        return matchesSearch && matchesCategory && matchesPrice && matchesDietary && 
               matchesRating && matchesPrepTime && matchesAvailability && matchesSelfDelivery;
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
            return parseFloat(a.distance || '0') - parseFloat(b.distance || '0');
          case 'time':
            return parseInt(a.prepTime || '0') - parseInt(b.prepTime || '0');
          case 'popularity':
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          default:
            return 0;
        }
      });
  }, [
    dishes, 
    searchQuery, 
    selectedCategory, 
    priceRange, 
    selectedDietary, 
    minRating, 
    maxPrepTime, 
    showOnlyAvailable, 
    showOnlySelfDelivery, 
    sortBy
  ]);

  const toggleFavorite = (dishId: string) => {
    setFavorites(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleDishClick = (dishId: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    router.push(`/dishes/${dishId}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setPriceRange([0, 100000]);
    setSelectedDietary([]);
    setMinRating(0);
    setMaxPrepTime(120);
    setShowOnlyAvailable(true);
    setShowOnlySelfDelivery(false);
    setSortBy('rating');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory !== 'All') count++;
    if (priceRange[0] > 0 || priceRange[1] < 100000) count++;
    if (selectedDietary.length > 0) count++;
    if (minRating > 0) count++;
    if (maxPrepTime < 120) count++;
    if (!showOnlyAvailable) count++;
    if (showOnlySelfDelivery) count++;
    return count;
  }, [searchQuery, selectedCategory, priceRange, selectedDietary, minRating, maxPrepTime, showOnlyAvailable, showOnlySelfDelivery]);

  // Get recommendation sections
  const getRecommendationSections = () => {
    return [
      { key: 'featured', title: 'Destacados del Día', icon: Star, color: 'text-yellow-500' },
      { key: 'trending', title: 'Tendencias', icon: TrendingUp, color: 'text-orange-500' },
      { key: 'healthy', title: 'Opciones Saludables', icon: Leaf, color: 'text-green-500' },
      { key: 'quick', title: 'Preparación Rápida', icon: Zap, color: 'text-blue-500' }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl">
                  <Utensils className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Explorar Platos
                  </h1>
                  <p className="text-sm text-slate-600">Descubre comida casera de cocineros locales</p>
                </div>
              </div>
              
              {/* Time-based greeting */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700 capitalize">
                  {timeOfDay === 'desayuno' ? 'Buenos días' : 
                   timeOfDay === 'almuerzo' ? 'Buen día' : 
                   timeOfDay === 'cena' ? 'Buenas noches' : 'Buen día'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" />
                    Favoritos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/cart')}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Carrito ({itemCount})</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    className="text-slate-600 hover:text-red-600 gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
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
                    className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600"
                  >
                    Crear Cuenta
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg">
                  <Utensils className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Explorar Platos</h1>
                  <p className="text-xs text-slate-600">Comida casera local</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/cart')}
                      className="gap-1"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>({itemCount})</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={logout}
                      className="text-slate-600 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-slate-900 to-slate-700"
                  >
                    Ingresar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Search and Filters Bar */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar platos, cocineros, ingredientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg border-2 border-slate-200 rounded-2xl focus:border-slate-400 transition-colors bg-white shadow-sm"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Categories */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Categoría:</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Ordenar:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros Avanzados
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-slate-900 text-white text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filtros Avanzados</SheetTitle>
                  <SheetDescription>
                    Personaliza tu búsqueda para encontrar los platos perfectos
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">
                      Rango de Precio
                    </label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={(value: number[]) => setPriceRange(value as [number, number])}
                        max={100000}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-600 mt-2">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">
                      Preferencias Dietéticas
                    </label>
                    <div className="space-y-2">
                      {dietaryOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={selectedDietary.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDietary([...selectedDietary, option.id]);
                                } else {
                                  setSelectedDietary(selectedDietary.filter(id => id !== option.id));
                                }
                              }}
                            />
                            <label htmlFor={option.id} className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">
                      Calificación Mínima
                    </label>
                    <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Todas las calificaciones</SelectItem>
                        <SelectItem value="3">3+ estrellas</SelectItem>
                        <SelectItem value="4">4+ estrellas</SelectItem>
                        <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Maximum Prep Time */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">
                      Tiempo Máximo de Preparación
                    </label>
                    <Select value={maxPrepTime.toString()} onValueChange={(value) => setMaxPrepTime(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Hasta 30 min</SelectItem>
                        <SelectItem value="60">Hasta 1 hora</SelectItem>
                        <SelectItem value="120">Hasta 2 horas</SelectItem>
                        <SelectItem value="240">Hasta 4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Additional Filters */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="available"
                        checked={showOnlyAvailable}
                        onCheckedChange={(checked) => {
                          if (checked === 'indeterminate') return;
                          setShowOnlyAvailable(checked === true);
                        }}
                      />
                      <label htmlFor="available" className="text-sm">Solo platos disponibles</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="self-delivery"
                        checked={showOnlySelfDelivery}
                        onCheckedChange={(checked) => setShowOnlySelfDelivery(checked === true)}
                      />
                      <label htmlFor="self-delivery" className="text-sm">Solo entrega directa</label>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                    disabled={activeFiltersCount === 0}
                  >
                    Limpiar Filtros ({activeFiltersCount})
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Active Filters Count */}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

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
              
              const Icon = section.icon;
              
              return (
                <div key={section.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100`}>
                      <Icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                    <Badge variant="outline" className="text-slate-600">
                      {sectionDishes.length} plato{sectionDishes.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sectionDishes.slice(0, 4).map((dish: DishWithBadges) => (
                      <EnhancedDishCard
                        key={dish.id}
                        dish={dish}
                        onDishClick={handleDishClick}
                        onFavoriteToggle={toggleFavorite}
                        user={user}
                        size="medium"
                        recommendationContext={{
                          isFromRecommendation: true,
                          recommendationType: section.key
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Dishes Grid */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedCategory === 'All' ? 'Todos los Platos' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-slate-600">
                {filteredDishes.length} plato{filteredDishes.length !== 1 ? 's' : ''} encontrado{filteredDishes.length !== 1 ? 's' : ''}
                {lastUpdated && (
                  <span className="ml-2 text-xs text-slate-500">
                    • Actualizado {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            
            {refreshing && (
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Actualizando...</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && !refreshing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-56 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-t-lg"></div>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-6 bg-slate-200 rounded animate-pulse w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dishes Grid */}
          {!loading && (
            <>
              {filteredDishes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Search className="h-12 w-12 text-slate-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron platos</h3>
                  <p className="text-slate-600 mb-4">
                    Intenta ajustar tus filtros o búsqueda para encontrar más opciones.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpiar Filtros
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}>
                  {filteredDishes.map((dish) => (
                    <EnhancedDishCard
                      key={dish.id}
                      dish={dish}
                      onDishClick={handleDishClick}
                      onFavoriteToggle={toggleFavorite}
                      user={user}
                      size={viewMode === 'list' ? 'large' : 'medium'}
                      isNew={dish.tags?.includes('nuevo')}
                      isTrending={Math.random() > 0.7} // Mock trending status
                      deliveryTime={dish.cookerSelfDelivery ? '15-30 min' : '30-45 min'}
                      distance={dish.distance}
                    />
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMoreDishes && (
                <div className="text-center pt-8">
                  <Button 
                    onClick={loadMoreDishes}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Cargar Más Platos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDishesPage;
