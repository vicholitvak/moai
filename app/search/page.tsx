'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Star, 
  Clock, 
  Heart,
  ShoppingCart,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { DishesService } from '@/lib/firebase/dataService';
import type { SearchResult } from '@/lib/services/searchService';
import { useRouter } from 'next/navigation';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [results, setResults] = useState<SearchResult | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;

  const handleResultsChange = (searchResults: SearchResult) => {
    setResults(searchResults);
  };

  const handleAddToCart = async (dish: any) => {
    if (!user) {
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

  const DishCard = ({ dish, compact = false }: { dish: any; compact?: boolean }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    
    if (compact) {
      return (
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={() => router.push(`/dishes/${dish.id}`)}
        >
          <div className="flex">
            <div className="w-24 h-24 relative flex-shrink-0">
              <img 
                src={dish.image} 
                alt={dish.name}
                className="w-full h-full object-cover rounded-l-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
                }}
              />
              {!dish.isAvailable && (
                <div className="absolute inset-0 bg-black/50 rounded-l-lg flex items-center justify-center">
                  <Badge variant="destructive">Agotado</Badge>
                </div>
              )}
            </div>
            <CardContent className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1 line-clamp-1">{dish.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {dish.description}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={dish.cookerAvatar} />
                      <AvatarFallback>{dish.cookerName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{dish.cookerName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{dish.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{dish.rating?.toFixed(1) || 'Nuevo'}</span>
                    </div>
                    {dish.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{dish.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-primary">{formatPrice(dish.price)}</p>
                  <Button
                    size="sm"
                    disabled={!dish.isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(dish);
                    }}
                    className="mt-2"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      );
    }

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
        onClick={() => router.push(`/dishes/${dish.id}`)}
      >
        <div className="aspect-[4/3] relative">
          <img 
            src={dish.image} 
            alt={dish.name}
            className="w-full h-full object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className={`absolute top-2 right-2 h-8 w-8 p-0 ${isFavorite ? 'text-red-500' : 'text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center">
              <Badge variant="destructive">Agotado</Badge>
            </div>
          )}
          {dish.score && dish.score > 0.8 && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              Muy Popular
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-base line-clamp-1">{dish.name}</h3>
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
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{dish.rating?.toFixed(1) || 'Nuevo'}</span>
            </div>
            {dish.distance && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{dish.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full"
            disabled={!dish.isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(dish);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {dish.isAvailable ? 'Agregar al Carrito' : 'Agotado'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Resultados de Búsqueda</h1>
              {results && (
                <p className="text-sm text-muted-foreground">
                  {results.totalResults} resultado{results.totalResults !== 1 ? 's' : ''} encontrado{results.totalResults !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <AdvancedSearch 
              compact={true}
              initialFilters={{ query, category }}
              onResultsChange={handleResultsChange}
            />
          </CardContent>
        </Card>

        {/* Results Header */}
        {results && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                {query ? `Resultados para "${query}"` : 'Todos los platos'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {results.totalResults} plato{results.totalResults !== 1 ? 's' : ''} • Búsqueda en {results.searchTime}ms
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
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
        )}

        {/* Search Suggestions */}
        {results && results.suggestions && results.suggestions.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-2">¿Quisiste decir?</p>
              <div className="flex flex-wrap gap-2">
                {results.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(suggestion)}`)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && results.dishes.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {results.dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} compact={viewMode === 'list'} />
            ))}
          </div>
        ) : results && results.dishes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground mb-4">
                Intenta con diferentes términos de búsqueda o ajusta los filtros
              </p>
              <Button 
                variant="outline"
                onClick={() => router.push('/client/home')}
              >
                Explorar todos los platos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}