'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  MapPin, 
  Clock, 
  Star,
  DollarSign,
  Utensils,
  Leaf,
  AlertCircle,
  Loader2,
  ChefHat,
  TrendingUp,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SearchService, type SearchFilters, type SearchResult } from '@/lib/services/searchService';
import { LocationService } from '@/lib/services/locationService';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface AdvancedSearchProps {
  onResultsChange?: (results: SearchResult) => void;
  initialFilters?: Partial<SearchFilters>;
  compact?: boolean;
}

export function AdvancedSearch({ 
  onResultsChange, 
  initialFilters = {},
  compact = false 
}: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search state
  const [query, setQuery] = useState(initialFilters.query || searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters.query || searchParams.get('q') || '',
    category: initialFilters.category || searchParams.get('category') || undefined,
    priceRange: initialFilters.priceRange || { min: 0, max: 50000 },
    rating: initialFilters.rating || undefined,
    prepTime: initialFilters.prepTime || undefined,
    dietary: initialFilters.dietary || [],
    allergens: initialFilters.allergens || [],
    sortBy: initialFilters.sortBy || 'relevance',
    availability: true
  });
  
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState<string[]>([
    'pizza', 'empanadas', 'ensalada', 'pasta', 'hamburguesa', 
    'sushi', 'tacos', 'parrilla', 'vegano', 'postres'
  ]);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState(10); // km

  // Dietary options
  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetariano', icon: '🥗' },
    { value: 'vegan', label: 'Vegano', icon: '🌱' },
    { value: 'gluten-free', label: 'Sin Gluten', icon: '🌾' },
    { value: 'keto', label: 'Keto', icon: '🥑' },
    { value: 'paleo', label: 'Paleo', icon: '🥩' },
    { value: 'low-carb', label: 'Bajo en Carbohidratos', icon: '🥦' },
    { value: 'dairy-free', label: 'Sin Lácteos', icon: '🥛' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'kosher', label: 'Kosher', icon: '✡️' }
  ];

  // Common allergens
  const allergenOptions = [
    'Nueces', 'Maní', 'Lácteos', 'Huevos', 'Mariscos', 
    'Pescado', 'Soya', 'Gluten', 'Sésamo', 'Mostaza'
  ];

  // Categories
  const categories = [
    { value: 'all', label: 'Todas', icon: '🍽️' },
    { value: 'main', label: 'Platos Principales', icon: '🍖' },
    { value: 'appetizer', label: 'Entradas', icon: '🥟' },
    { value: 'dessert', label: 'Postres', icon: '🍰' },
    { value: 'beverage', label: 'Bebidas', icon: '🥤' },
    { value: 'breakfast', label: 'Desayuno', icon: '🥞' },
    { value: 'lunch', label: 'Almuerzo', icon: '🥗' },
    { value: 'dinner', label: 'Cena', icon: '🍝' },
    { value: 'snack', label: 'Snacks', icon: '🍿' }
  ];

  // Prep time options
  const prepTimeOptions = [
    { value: '15', label: '< 15 min', icon: '⚡' },
    { value: '30', label: '< 30 min', icon: '🕐' },
    { value: '45', label: '< 45 min', icon: '🕑' },
    { value: '60', label: '< 1 hora', icon: '🕒' },
    { value: '60+', label: '> 1 hora', icon: '🕓' }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Get user location
  useEffect(() => {
    LocationService.getCurrentLocation().then(coords => {
      if (coords) {
        setUserLocation(coords);
        setFilters(prev => ({ ...prev, location: coords }));
      }
    });
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      setIsSearching(true);
      try {
        const searchResults = await SearchService.search(searchFilters);
        setResults(searchResults);
        onResultsChange?.(searchResults);
        
        // Save to recent searches
        if (searchFilters.query && searchFilters.query.trim()) {
          const recent = [searchFilters.query, ...recentSearches.filter(s => s !== searchFilters.query)].slice(0, 5);
          setRecentSearches(recent);
          localStorage.setItem('recentSearches', JSON.stringify(recent));
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Error al buscar. Por favor intenta nuevamente.');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [recentSearches, onResultsChange]
  );

  // Trigger search when filters change
  useEffect(() => {
    const updatedFilters = { ...filters, query };
    debouncedSearch(updatedFilters);
  }, [query, filters]);

  // Handle quick search
  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setFilters(prev => ({ ...prev, query: searchTerm }));
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setFilters({
      query: '',
      availability: true,
      sortBy: 'relevance',
      priceRange: { min: 0, max: 50000 }
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.category && filters.category !== 'all',
    filters.rating,
    filters.prepTime,
    filters.dietary && filters.dietary.length > 0,
    filters.allergens && filters.allergens.length > 0,
    filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 50000)
  ].filter(Boolean).length;

  if (compact) {
    return (
      <div className="relative w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar platos, cocineros, ingredientes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-24 h-12 text-base"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        {/* Quick suggestions */}
        {!query && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background border rounded-lg shadow-lg z-10">
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Búsquedas recientes</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSearch(search)}
                      className="text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tendencias</p>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.slice(0, 6).map((search) => (
                  <Button
                    key={search}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickSearch(search)}
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1 text-atacama-orange" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters Sheet */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros de Búsqueda</SheetTitle>
              <SheetDescription>
                Refina tu búsqueda con filtros avanzados
              </SheetDescription>
            </SheetHeader>
            {renderFilters()}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  function renderFilters() {
    return (
      <div className="space-y-6 mt-6">
        {/* Sort By */}
        <div className="space-y-2">
          <Label>Ordenar por</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Relevancia
                </div>
              </SelectItem>
              <SelectItem value="price_low">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Precio: Menor a Mayor
                </div>
              </SelectItem>
              <SelectItem value="price_high">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Precio: Mayor a Menor
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Mejor Calificación
                </div>
              </SelectItem>
              <SelectItem value="prep_time">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Tiempo de Preparación
                </div>
              </SelectItem>
              {userLocation && (
                <SelectItem value="distance">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Más Cercano
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoría</Label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={filters.category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  category: cat.value === 'all' ? undefined : cat.value 
                }))}
                className="justify-start"
              >
                <span className="mr-2">{cat.icon}</span>
                <span className="text-xs">{cat.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Rango de Precio</Label>
          <div className="px-2">
            <Slider
              value={[filters.priceRange?.min || 0, filters.priceRange?.max || 50000]}
              onValueChange={([min, max]) => 
                setFilters(prev => ({ ...prev, priceRange: { min, max } }))
              }
              max={50000}
              step={1000}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatPrice(filters.priceRange?.min || 0)}</span>
              <span>{formatPrice(filters.priceRange?.max || 50000)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div className="space-y-2">
          <Label>Calificación Mínima</Label>
          <div className="flex gap-2">
            {[4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  rating: prev.rating === rating ? undefined : rating 
                }))}
              >
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {rating}+
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Prep Time */}
        <div className="space-y-2">
          <Label>Tiempo de Preparación</Label>
          <div className="grid grid-cols-2 gap-2">
            {prepTimeOptions.map((option) => (
              <Button
                key={option.value}
                variant={filters.prepTime === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  prepTime: prev.prepTime === option.value ? undefined : option.value 
                }))}
                className="justify-start"
              >
                <span className="mr-2">{option.icon}</span>
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Dietary Preferences */}
        <div className="space-y-2">
          <Label>Preferencias Dietéticas</Label>
          <div className="grid grid-cols-2 gap-2">
            {dietaryOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={filters.dietary?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      dietary: checked
                        ? [...(prev.dietary || []), option.value]
                        : prev.dietary?.filter(d => d !== option.value) || []
                    }));
                  }}
                />
                <Label
                  htmlFor={option.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Allergens to Exclude */}
        <div className="space-y-2">
          <Label>Excluir Alérgenos</Label>
          <div className="flex flex-wrap gap-2">
            {allergenOptions.map((allergen) => (
              <Badge
                key={allergen}
                variant={filters.allergens?.includes(allergen) ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    allergens: prev.allergens?.includes(allergen)
                      ? prev.allergens.filter(a => a !== allergen)
                      : [...(prev.allergens || []), allergen]
                  }));
                }}
              >
                {filters.allergens?.includes(allergen) && (
                  <X className="h-3 w-3 mr-1" />
                )}
                {allergen}
              </Badge>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        {userLocation && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Distancia Máxima</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[maxDistance]}
                  onValueChange={([value]) => {
                    setMaxDistance(value);
                    setFilters(prev => ({ ...prev, maxDistance: value }));
                  }}
                  max={30}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{maxDistance} km</span>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={clearFilters}
          >
            Limpiar Filtros
          </Button>
          <Button 
            className="flex-1 bg-atacama-orange hover:bg-atacama-orange/90"
            onClick={() => setShowFilters(false)}
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    );
  }

  // Full view (non-compact)
  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda Avanzada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar platos, cocineros, ingredientes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-base"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Quick Searches */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Populares:</span>
              {trendingSearches.map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleQuickSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtros</CardTitle>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderFilters()}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {results.totalResults} resultado{results.totalResults !== 1 ? 's' : ''} encontrado{results.totalResults !== 1 ? 's' : ''} 
                {' '}en {results.searchTime}ms
              </p>
              {results.suggestions && results.suggestions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sugerencias:</span>
                  {results.suggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleQuickSearch(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}