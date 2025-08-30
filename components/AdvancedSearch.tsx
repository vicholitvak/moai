'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Clock, Star, DollarSign, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useFormValidation';

interface SearchFilters {
  query: string;
  category: string;
  priceRange: [number, number];
  rating: number;
  maxPrepTime: number;
  distance: number;
  dietaryRestrictions: string[];
  ingredients: string[];
  sortBy: 'relevance' | 'rating' | 'price-low' | 'price-high' | 'distance' | 'prep-time';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  className?: string;
}

const categories = [
  'Todas',
  'Italiana', 'Mexicana', 'Japonesa', 'India', 'Americana', 'Francesa', 
  'China', 'Tailandesa', 'Mediterránea', 'Vegana', 'Saludable', 
  'Acompañamientos', 'Para Tomar', 'Postres'
];

const dietaryOptions = [
  'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Sin Nuez', 
  'Bajo en Carbohidratos', 'Alto en Proteína', 'Orgánico'
];

const sortOptions = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'rating', label: 'Mejor Calificados' },
  { value: 'price-low', label: 'Precio: Menor a Mayor' },
  { value: 'price-high', label: 'Precio: Mayor a Menor' },
  { value: 'distance', label: 'Más Cercanos' },
  { value: 'prep-time', label: 'Más Rápidos' }
];

export default function AdvancedSearch({
  onSearch,
  onFiltersChange,
  initialFilters,
  className = ''
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'Todas',
    priceRange: [0, 50000],
    rating: 0,
    maxPrepTime: 60,
    distance: 10000,
    dietaryRestrictions: [],
    ingredients: [],
    sortBy: 'relevance',
    ...initialFilters
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debouncedQuery = useDebounce(filters.query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Generate search suggestions
  useEffect(() => {
    if (debouncedQuery.length > 2) {
      generateSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Trigger search when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const generateSuggestions = useCallback(async (query: string) => {
    // Mock suggestions - in real app, fetch from API
    const mockSuggestions = [
      `${query} italiano`,
      `${query} vegano`,
      `${query} rápido`,
      `${query} saludable`,
      `${query} picante`
    ];
    setSuggestions(mockSuggestions);
  }, []);

  const handleSearch = useCallback(() => {
    if (filters.query.trim()) {
      setIsSearching(true);
      
      // Save to recent searches
      const updated = [filters.query, ...recentSearches.filter(s => s !== filters.query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      
      onSearch(filters);
      
      setTimeout(() => setIsSearching(false), 500);
    }
  }, [filters, onSearch, recentSearches]);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleDietaryRestriction = useCallback((restriction: string) => {
    setFilters(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  }, []);

  const addIngredient = useCallback((ingredient: string) => {
    if (ingredient.trim() && !filters.ingredients.includes(ingredient.trim())) {
      setFilters(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredient.trim()]
      }));
    }
  }, [filters.ingredients]);

  const removeIngredient = useCallback((ingredient: string) => {
    setFilters(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i !== ingredient)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: 'Todas',
      priceRange: [0, 50000],
      rating: 0,
      maxPrepTime: 60,
      distance: 10000,
      dietaryRestrictions: [],
      ingredients: [],
      sortBy: 'relevance'
    });
  }, []);

  const hasActiveFilters = filters.category !== 'Todas' || 
    filters.rating > 0 || 
    filters.maxPrepTime < 60 || 
    filters.dietaryRestrictions.length > 0 || 
    filters.ingredients.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar platos, cocineros, ingredientes..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 pr-20 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-8 w-8 p-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            size="sm"
            className="h-8"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <Card className="absolute z-10 w-full mt-1">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateFilter('query', suggestion);
                    handleSearch();
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !filters.query && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Búsquedas recientes:</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  updateFilter('query', search);
                  handleSearch();
                }}
              >
                {search}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.category !== 'Todas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('category', 'Todas')}
        >
          Todas las categorías
        </Button>
        {categories.slice(1, 7).map((category) => (
          <Button
            key={category}
            variant={filters.category === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('category', category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtros Avanzados</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Limpiar Filtros
              </Button>
            </div>

            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={filters.category === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('category', category)}
                    className="justify-start"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rango de Precio: ${filters.priceRange[0].toLocaleString('es-CL')} - ${filters.priceRange[1].toLocaleString('es-CL')}
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                  className="w-24"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 50000])}
                  className="w-24"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Calificación mínima: {filters.rating > 0 ? `${filters.rating}+ estrellas` : 'Cualquiera'}
              </label>
              <div className="flex items-center gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <Button
                    key={rating}
                    variant={filters.rating === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('rating', rating)}
                  >
                    {rating === 0 ? 'Cualquiera' : `${rating}+`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prep Time */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tiempo máximo de preparación: {filters.maxPrepTime} min
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={filters.maxPrepTime}
                onChange={(e) => updateFilter('maxPrepTime', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Distancia máxima: {filters.distance / 1000} km
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={filters.distance}
                onChange={(e) => updateFilter('distance', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Restricciones Dietéticas</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dietaryOptions.map((option) => (
                  <Button
                    key={option}
                    variant={filters.dietaryRestrictions.includes(option) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDietaryRestriction(option)}
                    className="justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ingredientes</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Agregar ingrediente..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addIngredient(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Agregar ingrediente..."]') as HTMLInputElement;
                    if (input) {
                      addIngredient(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Agregar
                </Button>
              </div>
              {filters.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.ingredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {ingredient}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeIngredient(ingredient)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sortOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.sortBy === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortBy', option.value)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {filters.category !== 'Todas' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('category', 'Todas')}
              />
            </Badge>
          )}
          {filters.rating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.rating}+ estrellas
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('rating', 0)}
              />
            </Badge>
          )}
          {filters.maxPrepTime < 60 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              < {filters.maxPrepTime} min
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('maxPrepTime', 60)}
              />
            </Badge>
          )}
          {filters.dietaryRestrictions.map((restriction) => (
            <Badge
              key={restriction}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {restriction}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleDietaryRestriction(restriction)}
              />
            </Badge>
          ))}
          {filters.ingredients.map((ingredient) => (
            <Badge
              key={ingredient}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {ingredient}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeIngredient(ingredient)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}