'use client';

import { useState, useEffect } from 'react';
import { LocationService } from '@/lib/services/locationService';
import type { Coordinates } from '@/lib/services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MapPin, 
  Clock, 
  Star,
  Navigation,
  AlertCircle,
  Utensils,
  Car,
  Eye
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface LocationBasedDishDiscoveryProps {
  onLocationUpdate?: (coordinates: Coordinates) => void;
  showLocationButton?: boolean;
}

const LocationBasedDishDiscovery = ({ 
  onLocationUpdate, 
  showLocationButton = true 
}: LocationBasedDishDiscoveryProps) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [nearbyDishes, setNearbyDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const hasPermission = await LocationService.checkLocationPermission();
    setPermissionGranted(hasPermission);
    
    if (hasPermission) {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setLocationError(null);
    
    try {
      const coordinates = await LocationService.getCurrentPosition();
      setUserLocation(coordinates);
      onLocationUpdate?.(coordinates);
      await loadNearbyDishes(coordinates);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('No se pudo obtener tu ubicación. Verifica los permisos de ubicación.');
      toast.error('Error al obtener ubicación');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyDishes = async (coordinates: Coordinates) => {
    try {
      const dishes = await LocationService.getDishesForLocation(coordinates, 15);
      setNearbyDishes(dishes);
      
      if (dishes.length === 0) {
        const restrictions = LocationService.getDeliveryRestrictions(coordinates);
        if (!restrictions.allowed) {
          setLocationError(restrictions.reason || 'No hay delivery disponible en tu zona');
        } else {
          setLocationError('No hay platos disponibles cerca de tu ubicación');
        }
      }
    } catch (error) {
      console.error('Error loading nearby dishes:', error);
      setLocationError('Error al cargar platos cercanos');
    }
  };

  const requestLocation = async () => {
    const granted = await LocationService.requestLocationPermission();
    setPermissionGranted(granted);
    
    if (granted) {
      getCurrentLocation();
    } else {
      setLocationError('Permisos de ubicación denegados. Habilítalos para ver platos cerca de ti.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  if (permissionGranted === false && showLocationButton) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Descubre platos cerca de ti</h3>
          <p className="text-muted-foreground mb-4">
            Permite el acceso a tu ubicación para ver platos disponibles en tu zona
          </p>
          <Button onClick={requestLocation} className="bg-moai-orange hover:bg-moai-orange/90">
            <Navigation className="h-4 w-4 mr-2" />
            Activar Ubicación
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
          <p>Buscando platos cerca de ti...</p>
        </CardContent>
      </Card>
    );
  }

  if (locationError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ubicación no disponible</h3>
          <p className="text-muted-foreground mb-4">{locationError}</p>
          {showLocationButton && (
            <Button onClick={getCurrentLocation} variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!userLocation || nearbyDishes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Utensils className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay platos disponibles</h3>
          <p className="text-muted-foreground">
            {userLocation 
              ? 'No encontramos platos disponibles cerca de tu ubicación actual'
              : 'Activa tu ubicación para ver platos disponibles'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-moai-orange" />
            Platos cerca de ti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Se encontraron {nearbyDishes.length} platos disponibles para delivery
            </div>
            {showLocationButton && (
              <Button onClick={getCurrentLocation} variant="outline" size="sm">
                <Navigation className="h-3 w-3 mr-1" />
                Actualizar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nearby Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nearbyDishes.map((dish) => (
          <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image
                src={dish.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjQwVjE2MEgyNDBWMTgwSDIyNVYyMDBIMTc1VjE4MEgxNjBWMTYwSDE2MFYxNDBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                alt={dish.dishName}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-moai-orange text-white">
                  <Car className="h-3 w-3 mr-1" />
                  {LocationService.formatDistance(dish.cookDistance)}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {dish.estimatedDeliveryTime} min
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{dish.dishName}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dish.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400 fill-current" />
                  <span className="text-sm font-medium">
                    {dish.rating || '4.5'} ({dish.reviewCount || '12'} reseñas)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-moai-orange">
                      {formatPrice(dish.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      + {formatPrice(dish.deliveryFee)} envío
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">{dish.cookName}</div>
                    <div className="text-xs text-muted-foreground">
                      {LocationService.formatDistance(dish.cookDistance)} de ti
                    </div>
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

      {/* Delivery Zone Info */}
      {userLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Los tiempos de entrega pueden variar según el tráfico y la disponibilidad de conductores
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationBasedDishDiscovery;