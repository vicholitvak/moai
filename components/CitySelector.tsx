'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, Search, X } from 'lucide-react';
import { ChileanCitiesService, ChileanCity } from '@/lib/services/chileanCitiesService';
import { LocationService } from '@/lib/services/locationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CitySelectorProps {
  selectedCityId?: string;
  onCitySelect: (city: ChileanCity) => void;
  className?: string;
}

export function CitySelector({ selectedCityId, onCitySelect, className }: CitySelectorProps) {
  const [cities, setCities] = useState<ChileanCity[]>([]);
  const [filteredCities, setFilteredCities] = useState<ChileanCity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<ChileanCity | null>(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = ChileanCitiesService.searchCities(searchQuery);
      setFilteredCities(filtered);
    }
  }, [searchQuery, cities]);

  const loadCities = async () => {
    try {
      setIsLoading(true);
      const availableCities = await LocationService.getAvailableChileanCities();
      setCities(availableCities);
      setFilteredCities(availableCities);

      // Try to detect current location
      try {
        const currentPos = await LocationService.getCurrentPosition();
        const nearbyCities = ChileanCitiesService.getNearbyCities(
          currentPos.latitude,
          currentPos.longitude,
          50
        );
        if (nearbyCities.length > 0) {
          setCurrentLocation(nearbyCities[0]);
        }
      } catch (error) {
        console.warn('Could not detect current location:', error);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySelect = (city: ChileanCity) => {
    onCitySelect(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      handleCitySelect(currentLocation);
    } else {
      try {
        const dishes = await LocationService.getDishesForCurrentLocation();
        if (dishes.length > 0 && dishes[0].cityId) {
          const city = ChileanCitiesService.getCityById(dishes[0].cityId);
          if (city) {
            handleCitySelect(city);
          }
        }
      } catch (error) {
        console.error('Error getting current location dishes:', error);
      }
    }
  };

  const selectedCity = selectedCityId ? ChileanCitiesService.getCityById(selectedCityId) : null;

  const formatOperatingHours = (city: ChileanCity) => {
    const isOperating = ChileanCitiesService.isCityOperating(city.id);
    const hours = ChileanCitiesService.getOperatingHoursForCity(city.id);
    return {
      isOperating,
      hours: hours ? `${hours.start} - ${hours.end}` : 'Horario no disponible'
    };
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-auto p-3"
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {selectedCity ? selectedCity.name : 'Seleccionar ciudad'}
              </span>
              {selectedCity && (
                <span className="text-xs text-muted-foreground">
                  {selectedCity.region}
                </span>
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seleccionar Ciudad en Chile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Location Button */}
            <Button
              onClick={handleUseCurrentLocation}
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isLoading}
            >
              <MapPin className="h-4 w-4" />
              Usar mi ubicación actual
              {currentLocation && (
                <Badge variant="secondary" className="ml-auto">
                  {currentLocation.name}
                </Badge>
              )}
            </Button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ciudad o región..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Cities List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron ciudades
                </div>
              ) : (
                filteredCities.map((city) => {
                  const { isOperating, hours } = formatOperatingHours(city);
                  const isSelected = selectedCityId === city.id;

                  return (
                    <Card
                      key={city.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleCitySelect(city)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{city.name}</h3>
                              <Badge
                                variant={isOperating ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {isOperating ? "Abierto" : "Cerrado"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {city.region}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {hours}
                              </div>
                              <div className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {typeof city.deliveryFee === 'number' ? `$${city.deliveryFee.toLocaleString('es-CL')} CLP` : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {typeof city.population === 'number' ? city.population.toLocaleString('es-CL') : 'N/A'} hab.
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Radio: {city.maxDeliveryRadius}km
                            </div>
                          </div>
                        </div>

                        {/* Popular Dishes */}
                        {city.popularDishes.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">Platos populares:</p>
                            <div className="flex flex-wrap gap-1">
                              {city.popularDishes.slice(0, 3).map((dish, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {dish}
                                </Badge>
                              ))}
                              {city.popularDishes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{city.popularDishes.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}