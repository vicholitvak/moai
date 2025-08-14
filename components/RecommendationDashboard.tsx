'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RecommendationService, type DishRecommendation, type CookRecommendation } from '@/lib/services/recommendationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Clock, 
  MapPin, 
  Heart, 
  TrendingUp, 
  ChefHat,
  Sparkles,
  Target,
  Users,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface RecommendationDashboardProps {
  className?: string;
}

export default function RecommendationDashboard({ className = '' }: RecommendationDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [dishRecommendations, setDishRecommendations] = useState<DishRecommendation[]>([]);
  const [cookRecommendations, setCookRecommendations] = useState<CookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dishes' | 'cooks'>('dishes');

  useEffect(() => {
    if (user?.uid) {
      loadRecommendations();
    }
  }, [user?.uid]);

  const loadRecommendations = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Cargar recomendaciones de platos y cocineros en paralelo
      const [dishes, cooks] = await Promise.all([
        RecommendationService.getDishRecommendations(user.uid, 12),
        RecommendationService.getCookRecommendations(user.uid, 6)
      ]);

      // Ensure arrays are always set, even if service returns undefined
      setDishRecommendations(Array.isArray(dishes) ? dishes : []);
      setCookRecommendations(Array.isArray(cooks) ? cooks : []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Set empty arrays on error to prevent undefined length access
      setDishRecommendations([]);
      setCookRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'category':
        return <Target className="h-4 w-4" />;
      case 'ingredient':
        return <Sparkles className="h-4 w-4" />;
      case 'cook':
        return <ChefHat className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      case 'similar':
        return <Users className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'category':
        return 'bg-blue-100 text-blue-800';
      case 'ingredient':
        return 'bg-purple-100 text-purple-800';
      case 'cook':
        return 'bg-orange-100 text-orange-800';
      case 'trending':
        return 'bg-green-100 text-green-800';
      case 'similar':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'category':
        return 'Categoría Favorita';
      case 'ingredient':
        return 'Ingredientes Preferidos';
      case 'cook':
        return 'Cocinero Favorito';
      case 'trending':
        return 'Tendencia';
      case 'similar':
        return 'Similar';
      default:
        return 'Recomendado';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recomendaciones para ti</h2>
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <div className="w-16 h-8 bg-muted animate-pulse rounded"></div>
            <div className="w-16 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recomendaciones para ti</h2>
          <p className="text-muted-foreground">
            Basado en tus preferencias y comportamiento
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'dishes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dishes')}
            className="text-xs"
          >
            Platos ({dishRecommendations?.length || 0})
          </Button>
          <Button
            variant={activeTab === 'cooks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('cooks')}
            className="text-xs"
          >
            Cocineros ({cookRecommendations?.length || 0})
          </Button>
        </div>
      </div>

      {/* Recommendations Content */}
      {activeTab === 'dishes' ? (
        <div className="space-y-4">
          {(dishRecommendations?.length || 0) > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(dishRecommendations || []).map((recommendation) => (
                <DishRecommendationCard
                  key={recommendation.dishId}
                  recommendation={recommendation}
                  onView={() => router.push(`/dishes/${recommendation.dishId}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ChefHat className="h-12 w-12" />}
              title="No hay recomendaciones aún"
              description="Comienza a explorar platos para recibir recomendaciones personalizadas"
              action={
                <Button onClick={() => router.push('/dishes')}>
                  Explorar Platos
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(cookRecommendations?.length || 0) > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cookRecommendations || []).map((recommendation) => (
                <CookRecommendationCard
                  key={recommendation.cookId}
                  recommendation={recommendation}
                  onView={() => router.push(`/cooks/${recommendation.cookId}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No hay cocineros recomendados"
              description="Explora más cocineros para recibir recomendaciones"
              action={
                <Button onClick={() => router.push('/cooks')}>
                  Ver Cocineros
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Insights Section */}
      {user?.uid && (
        <RecommendationInsights userId={user.uid} />
      )}
    </div>
  );
}

// Dish Recommendation Card Component
function DishRecommendationCard({ 
  recommendation, 
  onView 
}: { 
  recommendation: DishRecommendation; 
  onView: () => void; 
}) {
  const [dishData, setDishData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos del plato
    // En implementación real, cargar desde Firebase
    setTimeout(() => {
      setDishData({
        name: `Plato ${recommendation.dishId.slice(-4)}`,
        price: Math.floor(Math.random() * 15000) + 5000,
        rating: 4.2 + Math.random() * 0.8,
        reviewCount: Math.floor(Math.random() * 100) + 10,
        prepTime: '30 min',
        image: '/valleluna.jpg',
        cookerName: 'Cocinero Local'
      });
      setLoading(false);
    }, 100);
  }, [recommendation.dishId]);

  if (loading || !dishData) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        {/* Match Type Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={`text-xs ${getMatchTypeColor(recommendation.matchType)}`}>
            {getMatchTypeIcon(recommendation.matchType)}
            <span className="ml-1">{getMatchTypeLabel(recommendation.matchType)}</span>
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{dishData.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Dish Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {dishData.name}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dishData.prepTime}
            </span>
            <span className="font-medium text-primary">
              {formatPrice(dishData.price)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Por {dishData.cookerName}
          </p>
        </div>

        {/* Reasons */}
        {recommendation.reasons.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Te puede gustar porque:</p>
            <ul className="text-xs space-y-1">
              {recommendation.reasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  <span className="line-clamp-1">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Score Indicator */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Puntuación:</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${Math.min((recommendation.score / 100) * 100, 100)}%` }}
                />
              </div>
              <span className="font-medium">{Math.round(recommendation.score)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Cook Recommendation Card Component
function CookRecommendationCard({ 
  recommendation, 
  onView 
}: { 
  recommendation: CookRecommendation; 
  onView: () => void; 
}) {
  const [cookData, setCookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos del cocinero
    setTimeout(() => {
      setCookData({
        displayName: `Cocinero ${recommendation.cookId.slice(-4)}`,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 500) + 50,
        specialties: ['Italiana', 'Mediterránea'],
        yearsExperience: Math.floor(Math.random() * 10) + 2,
        avatar: '/valleluna.jpg'
      });
      setLoading(false);
    }, 100);
  }, [recommendation.cookId]);

  if (loading || !cookData) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={cookData.avatar} />
            <AvatarFallback>
              <ChefHat className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {cookData.displayName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{cookData.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({cookData.reviewCount} reviews)
              </span>
            </div>
          </div>

          <Badge className={`text-xs ${getMatchTypeColor(recommendation.matchType)}`}>
            {getMatchTypeIcon(recommendation.matchType)}
          </Badge>
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Especialidades:</p>
          <div className="flex flex-wrap gap-1">
            {cookData.specialties.map((specialty: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            {cookData.yearsExperience} años de experiencia
          </span>
        </div>

        {/* Reasons */}
        {recommendation.reasons.length > 0 && (
          <div className="mb-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Te recomendamos porque:</p>
            <ul className="text-xs space-y-1">
              {recommendation.reasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  <span className="line-clamp-1">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Puntuación:</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                style={{ width: `${Math.min((recommendation.score / 100) * 100, 100)}%` }}
              />
            </div>
            <span className="font-medium">{Math.round(recommendation.score)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  action?: React.ReactNode; 
}) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action}
    </div>
  );
}

// Recommendation Insights Component
function RecommendationInsights({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const userInsights = RecommendationService.getRecommendationInsights(userId);
    setInsights(userInsights);
  }, [userId]);

  if (!insights) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Tus Preferencias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Categorías Favoritas</h4>
            <div className="flex flex-wrap gap-2">
              {(insights?.topCategories?.length || 0) > 0 ? (
                (insights?.topCategories || []).map((category: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes categorías favoritas
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Ingredientes Preferidos</h4>
            <div className="flex flex-wrap gap-2">
              {(insights?.topIngredients?.length || 0) > 0 ? (
                (insights?.topIngredients || []).slice(0, 8).map((ingredient: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes ingredientes favoritos
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">
                ${(insights?.averageOrderValue || 0).toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-muted-foreground">Valor promedio de pedido</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {insights?.preferredCooks?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cocineros favoritos</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}