'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocationService } from '@/lib/services/locationService';
import { useAuth } from '@/context/AuthContext';

interface LocationSetupProps {
  onLocationUpdate?: (location: any) => void;
  currentLocation?: any;
}

export default function LocationSetup({ onLocationUpdate, currentLocation }: LocationSetupProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationData, setLocationData] = useState<any>(currentLocation);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const permission = await LocationService.checkLocationPermission();
    setHasPermission(permission);
  };

  const handleGetLocation = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first if not granted
      if (!hasPermission) {
        const granted = await LocationService.requestLocationPermission();
        if (!granted) {
          setError('Se requiere acceso a la ubicación para configurar tu cocina');
          setIsLoading(false);
          return;
        }
        setHasPermission(true);
      }

      // Get current position
      const coordinates = await LocationService.getCurrentPosition();
      
      // Get address from coordinates
      const address = await LocationService.getAddressFromCoordinates(
        coordinates.latitude,
        coordinates.longitude
      );

      const newLocationData = {
        coordinates,
        address,
        isActive: true,
        lastUpdated: new Date()
      };

      setLocationData(newLocationData);

      // Update cook location in Firebase
      const success = await LocationService.updateCookLocation(user.uid);
      
      if (success) {
        if (onLocationUpdate) {
          onLocationUpdate(newLocationData);
        }
      } else {
        setError('Error al actualizar la ubicación en el servidor');
      }

    } catch (err: any) {
      setError(err.message || 'Error al obtener la ubicación');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastUpdated = (timestamp: any) => {
    if (!timestamp) return 'Nunca';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
    return `Hace ${Math.floor(diffMins / 1440)} días`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación de tu Cocina
        </CardTitle>
        <CardDescription>
          Configura la ubicación de tu cocina para que los clientes puedan encontrarte y calcular tiempos de entrega precisos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Display */}
        {locationData && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Ubicación Configurada</span>
              </div>
              <Badge variant="secondary">
                {locationData.isActive ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Dirección:</span>
                <p className="text-muted-foreground">{locationData.address?.fullAddress || 'Dirección no disponible'}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-medium">Coordenadas:</span>
                  <p className="text-muted-foreground">
                    {locationData.coordinates?.latitude.toFixed(6)}, {locationData.coordinates?.longitude.toFixed(6)}
                  </p>
                </div>
                
                {locationData.coordinates?.accuracy && (
                  <div>
                    <span className="font-medium">Precisión:</span>
                    <p className="text-muted-foreground">±{Math.round(locationData.coordinates.accuracy)}m</p>
                  </div>
                )}
              </div>
              
              <div>
                <span className="font-medium">Última actualización:</span>
                <p className="text-muted-foreground">{formatLastUpdated(locationData.lastUpdated)}</p>
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

        {/* Permission Status */}
        {hasPermission === false && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Se requiere permiso de ubicación para configurar tu cocina. Haz clic en "Obtener Ubicación" para otorgar permisos.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGetLocation}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                {locationData ? 'Actualizar Ubicación' : 'Obtener Ubicación'}
              </>
            )}
          </Button>

          {locationData && (
            <Button 
              variant="outline" 
              onClick={handleGetLocation}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Location Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Consejos:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Asegúrate de estar en la ubicación exacta de tu cocina</li>
            <li>La ubicación se usa para calcular tiempos de entrega</li>
            <li>Puedes actualizar tu ubicación en cualquier momento</li>
            <li>Los clientes verán la distancia aproximada desde tu cocina</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
