'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, Star, ChefHat, Heart } from 'lucide-react';
import { LocationService } from '@/lib/services/locationService';
import { ChileanCitiesService } from '@/lib/services/chileanCitiesService';
import { CitySelector } from './CitySelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dish } from '@/types';

interface LocationBasedDishesProps {
  onDishSelect?: (dish: Dish) => void;
  className?: string;
}

export function LocationBasedDishes({ onDishSelect, className }: LocationBasedDishesProps) {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lon) {
      loadDishesForLocation(selectedLocation);
    }
  }, [selectedLocation]);

  const loadDishesForLocation = async (location: { lat: string, lon: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      // You may want to update this to use a new service that fetches dishes by lat/lon
      const cityDishes = await LocationService.getDishesForLatLon(location.lat, location.lon);
      setDishes(cityDishes);
    } catch (error) {
      console.error('Error loading dishes for location:', error);
      setError('Error al cargar los platos de la ubicación seleccionada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  const handleDishSelect = (dish: Dish) => {
    if (onDishSelect) {
      onDishSelect(dish);
    }
  };

  const toggleFavorite = (dishId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(dishId)) {
      newFavorites.delete(dishId);
    } else {
      newFavorites.add(dishId);
    }
    setFavorites(newFavorites);
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CL')} CLP`;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  const formatDeliveryTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
  };

  // Optionally, you can reverse geocode to get city info for display
  const selectedCity = null;

  return (
    <div className={className}>
      {/* City Selector */}
      <div className="mb-6">
        <CitySelector
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* City Info */}
      {selectedCity && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {selectedCity.name}, {selectedCity.region}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {typeof selectedCity.population === 'number' ? selectedCity.population.toLocaleString('es-CL') : 'N/A'} habitantes
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  Delivery: {typeof selectedCity.deliveryFee === 'number' ? `$${selectedCity.deliveryFee.toLocaleString('es-CL')} CLP` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Radio: {typeof selectedCity.maxDeliveryRadius === 'number' ? `${selectedCity.maxDeliveryRadius}km` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Local Specialties */}
            {selectedCity.localSpecialties && selectedCity.localSpecialties.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Especialidades locales:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCity.localSpecialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dishes Grid */}
      {!selectedLocation ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecciona tu ubicación</h3>
          <p className="text-muted-foreground">
            Elige tu ubicación para ver los platos disponibles en tu área
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error al cargar platos</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button
            onClick={() => loadDishesForCity(selectedCityId)}
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay platos disponibles</h3>
          <p className="text-muted-foreground">
            No se encontraron platos disponibles en {selectedCity?.name} en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <Card
              key={dish.id}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleDishSelect(dish)}
            >
              <div className="relative">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(dish.id);
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.has(dish.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                </Button>
                {dish.isAvailable && (
                  <Badge className="absolute top-2 left-2 bg-green-500">
                    Disponible
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {dish.name}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(dish.price)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {dish.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {dish.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {dish.prepTime}
                  </div>
                  {dish.cookDistance && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {formatDistance(dish.cookDistance)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={dish.cookerAvatar}
                      alt={dish.cookerName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">
                      {dish.cookerName}
                    </span>
                  </div>

                  {dish.estimatedDeliveryTime && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      {formatDeliveryTime(dish.estimatedDeliveryTime)} min
                    </div>
                  )}
                </div>

                {dish.deliveryFee && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Delivery: {typeof dish.deliveryFee === 'number' ? `$${dish.deliveryFee.toLocaleString('es-CL')} CLP` : 'N/A'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}