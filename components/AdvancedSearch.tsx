'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchService, type SearchFilters, type SearchResult } from '@/lib/services/searchService';
import { LocationService, type Coordinates } from '@/lib/services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  X, 
  Star,
  Clock,
  MapPin,
  DollarSign,
  ChefHat,
  Utensils,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  Heart,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AdvancedSearchProps {
  initialQuery?: string;
  showLocation?: boolean;
  showRecommendations?: boolean;
  onDishSelect?: (dishId: string) => void;
}

const AdvancedSearch = ({ 
  initialQuery = '', 
  showLocation = true,
  showRecommendations = true,
  onDishSelect 
}: AdvancedSearchProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    availability: true,
    sortBy: 'relevance'
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (initialQuery) {
      performSearch();
    } else {
      loadInitialData();
    }
    if (showLocation) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const coordinates = await LocationService.getCurrentPosition();
      setUserLocation(coordinates);
      setFilters(prev => ({ ...prev, location: coordinates, maxDistance: 15 }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load trending dishes
      const trendingDishes = await SearchService.getTrendingDishes(8);
      setTrending(trendingDishes);

      // Load recommendations if user is logged in
      if (showRecommendations && user) {
        const recs = await SearchService.getRecommendations({
          userId: user.uid,
          location: userLocation || undefined,
          limit: 6
        });
        setRecommendations(recs.dishes);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(async () => {
    if (!query.trim() && !Object.keys(filters).some(key => 
      key !== 'query' && key !== 'availability' && key !== 'sortBy' && filters[key as keyof SearchFilters]
    )) {
      setResults(null);
      loadInitialData();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await SearchService.search({
        ...filters,
        query: query.trim() || undefined
      });
      setResults(searchResults);
      setSearchSuggestions(searchResults.suggestions || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, query }));
    performSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      availability: true,
      sortBy: 'relevance',
      location: userLocation || undefined,
      maxDistance: userLocation ? 15 : undefined
    });
    setQuery('');
    setResults(null);
    loadInitialData();
  };

  const applySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setFilters(prev => ({ ...prev, query: suggestion }));
    performSearch();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'availability' || key === 'sortBy' || key === 'location' || key === 'maxDistance') return false;
      if (key === 'query') return value && value.trim();
      return value !== undefined && value !== null && value !== '';
    });
    return activeFilters.length;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar platos, ingredientes, cocineros..."
                className="pl-10 pr-4"
              />
            </div>
            <Button onClick={handleSearch} className="bg-moai-orange hover:bg-moai-orange/90">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline"
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-moai-orange">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && !results && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Sugerencias:</span>
              {searchSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion(suggestion)}
                  className="h-7 text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avanzados
              </span>
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <Label>Categoría</Label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value || undefined)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="">Todas las categorías</option>
                  <option value="Comida Casera">Comida Casera</option>
                  <option value="Internacional">Internacional</option>
                  <option value="Vegetariano">Vegetariano</option>
                  <option value="Postres">Postres</option>
                  <option value="Saludable">Saludable</option>
                  <option value="Tradicional">Tradicional</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <Label>Rango de Precio</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => updateFilter('priceRange', {
                      ...filters.priceRange,
                      min: parseInt(e.target.value) || 0
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => updateFilter('priceRange', {
                      ...filters.priceRange,
                      max: parseInt(e.target.value) || 50000
                    })}
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <Label>Rating Mínimo</Label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => updateFilter('rating', parseFloat(e.target.value) || undefined)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="">Cualquier rating</option>
                  <option value="4.5">4.5+ estrellas</option>
                  <option value="4.0">4.0+ estrellas</option>
                  <option value="3.5">3.5+ estrellas</option>
                  <option value="3.0">3.0+ estrellas</option>
                </select>
              </div>

              {/* Prep Time */}
              <div>
                <Label>Tiempo de Preparación</Label>
                <select
                  value={filters.prepTime || ''}
                  onChange={(e) => updateFilter('prepTime', e.target.value || undefined)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="">Cualquier tiempo</option>
                  <option value="15 min">15 min o menos</option>
                  <option value="30 min">30 min o menos</option>
                  <option value="45 min">45 min o menos</option>
                  <option value="60+ min">Más de 60 min</option>
                </select>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div>
              <Label>Preferencias Dietéticas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo'].map((diet) => (
                  <Button
                    key={diet}
                    variant={filters.dietary?.includes(diet) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const current = filters.dietary || [];
                      const updated = current.includes(diet)
                        ? current.filter(d => d !== diet)
                        : [...current, diet];
                      updateFilter('dietary', updated.length > 0 ? updated : undefined);
                    }}
                    className={filters.dietary?.includes(diet) ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
                  >
                    {diet}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <Label>Ordenar por</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: 'relevance', label: 'Relevancia', icon: Zap },
                  { value: 'rating', label: 'Rating', icon: Star },
                  { value: 'price_low', label: 'Precio (menor)', icon: DollarSign },
                  { value: 'price_high', label: 'Precio (mayor)', icon: DollarSign },
                  { value: 'prep_time', label: 'Tiempo prep.', icon: Clock },
                  { value: 'distance', label: 'Distancia', icon: MapPin }
                ].map((sort) => (
                  <Button
                    key={sort.value}
                    variant={filters.sortBy === sort.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortBy', sort.value)}
                    className={filters.sortBy === sort.value ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
                  >
                    <sort.icon className="h-3 w-3 mr-1" />
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={performSearch} className="w-full bg-moai-orange hover:bg-moai-orange/90">
              Aplicar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
            <p>Buscando...</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {results.totalResults} resultados encontrados
                {results.searchTime && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({results.searchTime}ms)
                  </span>
                )}
              </CardTitle>
              {results.facets && (
                <div className="text-sm text-muted-foreground">
                  {results.facets.categories.length} categorías disponibles
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.totalResults === 0 ? (
              <div className="text-center py-8">
                <Utensils className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar tus filtros o cambiar tu búsqueda
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.dishes.map((dish) => (
                  <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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

                        {dish.matchReasons && dish.matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dish.matchReasons.slice(0, 2).map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Link href={`/dishes/${dish.id}`} className="block">
                          <Button className="w-full bg-moai-orange hover:bg-moai-orange/90">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Plato
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {!results && showRecommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-moai-orange" />
              Recomendado para ti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((dish) => (
                <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={dish.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjQwVjE2MEgyNDBWMTgwSDIyNVYyMDBIMTc1VjE4MEgxNjBWMTYwSDE2MFYxNDBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                      alt={dish.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-600 text-white">
                        <Heart className="h-3 w-3 mr-1" />
                        Recomendado
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{dish.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dish.recommendationReason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-moai-orange">
                          {formatPrice(dish.price)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-current" />
                          <span className="text-sm font-medium">{dish.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <Link href={`/dishes/${dish.id}`} className="block">
                        <Button className="w-full bg-moai-orange hover:bg-moai-orange/90">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Plato
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending */}
      {!results && trending.length > 0 && (
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
                <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-32">
                    <Image
                      src={dish.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjQwVjE2MEgyNDBWMTgwSDIyNVYyMDBIMTc1VjE4MEgxNjBWMTYwSDE2MFYxNDBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                      alt={dish.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">{dish.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-moai-orange">
                          {formatPrice(dish.price)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-current" />
                          <span className="text-xs">{dish.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Link href={`/dishes/${dish.id}`} className="block">
                        <Button size="sm" className="w-full bg-moai-orange hover:bg-moai-orange/90">
                          Ver
                        </Button>
                      </Link>
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

export default AdvancedSearch;