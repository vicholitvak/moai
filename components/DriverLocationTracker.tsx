'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Play, Pause, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocationService } from '@/lib/services/locationService';
import { useAuth } from '@/context/AuthContext';

interface DriverLocationTrackerProps {
  isOnline: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number; address?: string }) => void;
  onStatusChange?: (isTracking: boolean) => void;
}

export default function DriverLocationTracker({ 
  isOnline, 
  onLocationUpdate, 
  onStatusChange 
}: DriverLocationTrackerProps) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address?: { fullAddress?: string; city?: string }; speed?: number; heading?: number; lastUpdated?: any; coordinates?: { accuracy?: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{ address?: { city?: string }; speed?: number; heading?: number; lastUpdated?: any }>>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    checkLocationPermission();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (user && isTracking) {
        LocationService.stopDriverTracking(user.uid);
      }
    };
  }, []);

  useEffect(() => {
    if (user && isOnline && !isTracking && hasPermission) {
      // Auto-start tracking when driver goes online
      startTracking();
    } else if (!isOnline && isTracking) {
      // Auto-stop tracking when driver goes offline
      stopTracking();
    }
  }, [isOnline, hasPermission]);

  const checkLocationPermission = async () => {
    const permission = await LocationService.checkLocationPermission();
    setHasPermission(permission);
  };

  const startTracking = async () => {
    if (!user) return;

    setError(null);

    try {
      // Request permission first if not granted
      if (!hasPermission) {
        const granted = await LocationService.requestLocationPermission();
        if (!granted) {
          setError('Se requiere acceso a la ubicación para el seguimiento en tiempo real');
          return;
        }
        setHasPermission(true);
      }

      // Start location tracking
      const success = LocationService.startDriverTracking(user.uid, (location) => {
        setCurrentLocation(location);
        setLocationHistory(prev => [...prev.slice(-9), location]); // Keep last 10 locations
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      });

      if (success) {
        setIsTracking(true);
        if (onStatusChange) {
          onStatusChange(true);
        }

        // Subscribe to location updates from Firestore
        unsubscribeRef.current = LocationService.subscribeToDriverLocation(user.uid, (location) => {
          if (location) {
            setCurrentLocation(location);
          }
        });
      } else {
        setError('No se pudo iniciar el seguimiento de ubicación');
      }

    } catch (err: unknown) {
      setError((err as Error).message || 'Error al iniciar el seguimiento');
    }
  };

  const stopTracking = async () => {
    if (!user) return;

    try {
      await LocationService.stopDriverTracking(user.uid);
      setIsTracking(false);
      
      if (onStatusChange) {
        onStatusChange(false);
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

    } catch (err: unknown) {
      setError((err as Error).message || 'Error al detener el seguimiento');
    }
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return '0 km/h';
    return `${Math.round(speed)} km/h`;
  };

  const formatHeading = (heading?: number) => {
    if (!heading) return 'N/A';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const formatLastUpdated = (timestamp: any) => {
    if (!timestamp) return 'Nunca';
    
    const date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'Ahora mismo';
    if (diffSecs < 60) return `Hace ${diffSecs} segundos`;
    if (diffSecs < 3600) return `Hace ${Math.floor(diffSecs / 60)} minutos`;
    return `Hace ${Math.floor(diffSecs / 3600)} horas`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Seguimiento de Ubicación
        </CardTitle>
        <CardDescription>
          El seguimiento en tiempo real permite a los clientes ver tu ubicación durante las entregas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isTracking ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-500" />
            )}
            <span className="font-medium">
              {isTracking ? 'Seguimiento Activo' : 'Seguimiento Inactivo'}
            </span>
          </div>
          <Badge variant={isTracking ? 'default' : 'secondary'}>
            {isTracking ? 'En Vivo' : 'Detenido'}
          </Badge>
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Ubicación Actual</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Dirección:</span>
                  <p className="text-muted-foreground">{currentLocation.address?.fullAddress}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Velocidad:</span>
                    <p className="text-muted-foreground">{formatSpeed(currentLocation.speed)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Dirección:</span>
                    <p className="text-muted-foreground">{formatHeading(currentLocation.heading)}</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Última actualización:</span>
                  <p className="text-muted-foreground">{formatLastUpdated(currentLocation.lastUpdated)}</p>
                </div>
                
                {currentLocation.coordinates?.accuracy && (
                  <div>
                    <span className="font-medium">Precisión:</span>
                    <p className="text-muted-foreground">±{Math.round(currentLocation.coordinates.accuracy)}m</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Permission Warning */}
        {hasPermission === false && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Se requiere permiso de ubicación para el seguimiento en tiempo real.
            </span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button 
              onClick={startTracking}
              disabled={!isOnline || hasPermission === false}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Seguimiento
            </Button>
          ) : (
            <Button 
              onClick={stopTracking}
              variant="outline"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Detener Seguimiento
            </Button>
          )}
        </div>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Historial Reciente</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {locationHistory.slice(-5).reverse().map((location, index) => (
                <div key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{location.address?.city || 'Ubicación'}</span>
                    <span>{formatLastUpdated(location.lastUpdated)}</span>
                  </div>
                  {location.speed && (
                    <div className="text-xs opacity-75">
                      {formatSpeed(location.speed)} • {formatHeading(location.heading)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Información:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>El seguimiento se inicia automáticamente cuando te conectas</li>
            <li>Los clientes pueden ver tu ubicación durante las entregas</li>
            <li>La ubicación se actualiza cada 5 segundos</li>
            <li>El seguimiento se detiene cuando te desconectas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
