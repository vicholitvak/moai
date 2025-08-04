'use client';

import { useState, useEffect } from 'react';
import { SearchService, type RecommendationOptions } from '@/lib/services/searchService';
import { LocationService, type Coordinates } from '@/lib/services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  TrendingUp,
  Clock,
  Star,
  MapPin,
  Sparkles,
  Eye,
  RefreshCw,
  ChefHat,
  Utensils,
  Filter,
  ShoppingCart
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface RecommendationDashboardProps {
  userLocation?: Coordinates;
  orderHistory?: string[];
  favoriteCategories?: string[];
  dietaryPreferences?: string[];
  pricePreference?: 'budget' | 'mid' | 'premium';
  onAddToCart?: (dishId: string) => void;
}

const RecommendationDashboard = ({
  userLocation,
  orderHistory = [],
  favoriteCategories = [],
  dietaryPreferences = [],
  pricePreference = 'mid',
  onAddToCart
}: RecommendationDashboardProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [similarDishes, setSimilarDishes] = useState<any[]>([]);
  const [newDishes, setNewDishes] = useState<any[]>([]);
  const [popularCategories, setPopularCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'recommendations' | 'trending' | 'similar' | 'new'>('recommendations');

  useEffect(() => {
    loadRecommendations();
  }, [user, userLocation, orderHistory, favoriteCategories, dietaryPreferences, pricePreference]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Load personalized recommendations
      if (user) {
        const recs = await SearchService.getRecommendations({
          userId: user.uid,
          location: userLocation,
          orderHistory,
          favoriteCategories,
          dietaryPreferences,
          pricePreference,
          limit: 12
        });
        setRecommendations(recs.dishes);
      }

      // Load trending dishes
      const trendingDishes = await SearchService.getTrendingDishes(8);
      setTrending(trendingDishes);

      // Load similar dishes if user has order history
      if (orderHistory.length > 0) {
        const similar = await SearchService.getSimilarDishes(orderHistory[0], 6);
        setSimilarDishes(similar);
      }

      // Load new dishes (created in last 7 days)
      const allDishes = await SearchService.search({
        availability: true,
        sortBy: 'relevance'
      });
      const newDishesData = allDishes.dishes
        .filter(dish => dish.createdAt && dish.createdAt.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .slice(0, 6);
      setNewDishes(newDishesData);

      // Load popular categories
      const categories = await SearchService.getPopularCategories();
      setPopularCategories(categories.slice(0, 6));

    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getPreferenceText = (preference: string) => {
    switch (preference) {
      case 'budget': return 'Económico';
      case 'mid': return 'Moderado';
      case 'premium': return 'Premium';
      default: return 'Moderado';
    }
  };

  const DishCard = ({ dish, showReason = false }: { dish: any; showReason?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <Image
          src={dish.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjQwVjE2MEgyNDBWMTgwSDIyNVYyMDBIMTc1VjE4MEgxNjBWMTYwSDE2MFYxNDBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
          alt={dish.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge className="bg-moai-orange text-white">
            <Star className="h-3 w-3 mr-1" />
            {dish.rating.toFixed(1)}
          </Badge>
        </div>
        {dish.distance && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">
              <MapPin className="h-3 w-3 mr-1" />
              {LocationService.formatDistance(dish.distance)}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{dish.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {dish.description}
            </p>
          </div>

          {showReason && dish.recommendationReason && (
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {dish.recommendationReason}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-moai-orange">
              {formatPrice(dish.price)}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{dish.cookerName}</div>
              <div className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {dish.prepTime}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/dishes/${dish.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </Link>
            {onAddToCart && (
              <Button 
                size="sm" 
                onClick={() => onAddToCart(dish.id)}
                className="bg-moai-orange hover:bg-moai-orange/90"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
          <p>Cargando recomendaciones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-moai-orange" />
            Tus Preferencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-moai-orange">{getPreferenceText(pricePreference)}</div>
              <div className="text-sm text-muted-foreground">Precio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{favoriteCategories.length}</div>
              <div className="text-sm text-muted-foreground">Categorías favoritas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{dietaryPreferences.length}</div>
              <div className="text-sm text-muted-foreground">Preferencias dietéticas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{orderHistory.length}</div>
              <div className="text-sm text-muted-foreground">Pedidos anteriores</div>
            </div>
          </div>
          
          {(favoriteCategories.length > 0 || dietaryPreferences.length > 0) && (
            <div className="mt-4 space-y-2">
              {favoriteCategories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Categorías:</span>
                  <div className="flex flex-wrap gap-1">
                    {favoriteCategories.map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {dietaryPreferences.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Dietéticas:</span>
                  <div className="flex flex-wrap gap-1">
                    {dietaryPreferences.map((pref, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeSection === 'recommendations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('recommendations')}
              className={activeSection === 'recommendations' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              <Heart className="h-4 w-4 mr-2" />
              Para Ti ({recommendations.length})
            </Button>
            <Button
              variant={activeSection === 'trending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('trending')}
              className={activeSection === 'trending' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendencias ({trending.length})
            </Button>
            {similarDishes.length > 0 && (
              <Button
                variant={activeSection === 'similar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('similar')}
                className={activeSection === 'similar' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Similares ({similarDishes.length})
              </Button>
            )}
            <Button
              variant={activeSection === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection('new')}
              className={activeSection === 'new' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Nuevos ({newDishes.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      {activeSection === 'recommendations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-moai-orange" />
              Recomendado Para Ti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aún no tenemos recomendaciones</h3>
                <p className="text-muted-foreground">
                  Realiza algunos pedidos para recibir recomendaciones personalizadas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((dish) => (
                  <DishCard key={dish.id} dish={dish} showReason={true} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trending Dishes */}
      {activeSection === 'trending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-moai-orange" />
              Tendencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Dishes */}
      {activeSection === 'similar' && similarDishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-moai-orange" />
              Platos Similares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Dishes */}
      {activeSection === 'new' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-moai-orange" />
              Nuevos Platos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newDishes.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay platos nuevos</h3>
                <p className="text-muted-foreground">
                  No se han agregado platos nuevos recientemente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Popular Categories */}
      {popularCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-moai-orange" />
              Categorías Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularCategories.map((category, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <ChefHat className="h-8 w-8 text-moai-orange mx-auto mb-2" />
                    <h3 className="font-semibold text-sm">{category.category}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} platos</p>
                    <div className="flex items-center justify-center mt-1">
                      <Star className="h-3 w-3 text-amber-400 fill-current mr-1" />
                      <span className="text-xs">{category.avgRating.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationDashboard;