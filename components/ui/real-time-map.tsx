'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OrdersService } from '@/lib/firebase/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Truck, 
  User, 
  Phone,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, iconName: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
      ">
        ${iconName}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const customerIcon = createCustomIcon('#3B82F6', '🏠');
const cookIcon = createCustomIcon('#F59E0B', '👨‍🍳');
const driverIcon = createCustomIcon('#10B981', '🚚');

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface Driver {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  vehicleType: string;
  licensePlate: string;
  currentLocation: Location;
  isOnline: boolean;
}

interface RealTimeMapProps {
  orderId: string;
  customerLocation: Location;
  cookLocation?: Location;
  driver?: Driver;
  estimatedTime?: number;
  onDriverContact?: () => void;
  onTrackingUpdate?: (tracking: any) => void;
  isAdmin?: boolean;
}

// Component to update map bounds automatically
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);
  
  return null;
}

// Component to show delivery route
function DeliveryRoute({ 
  start, 
  end, 
  currentPosition 
}: { 
  start: Location; 
  end: Location; 
  currentPosition?: Location;
}) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoute();
  }, [start, end]);

  const fetchRoute = async () => {
    if (!start || !end) return;
    
    setLoading(true);
    try {
      // Using Google Maps Directions API
      const response = await fetch('/api/maps/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: `${start.lat},${start.lng}`,
          destination: `${end.lat},${end.lng}`,
          mode: 'driving'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          // Decode polyline from Google Maps response
          const polyline = data.routes[0].overview_polyline.points;
          const decodedRoute = decodePolyline(polyline);
          setRoute(decodedRoute);
        } else {
          // Fallback: direct line
          setRoute([[start.lat, start.lng], [end.lat, end.lng]]);
        }
      } else {
        // Fallback: direct line
        setRoute([[start.lat, start.lng], [end.lat, end.lng]]);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback: direct line
      setRoute([[start.lat, start.lng], [end.lat, end.lng]]);
    } finally {
      setLoading(false);
    }
  };

  // Function to decode Google Maps polyline
  const decodePolyline = (polyline: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    const len = polyline.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  };

  if (route.length === 0) return null;

  return (
    <Polyline
      positions={route}
      pathOptions={{
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
        dashArray: currentPosition ? '10, 10' : undefined
      }}
    />
  );
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({
  orderId,
  customerLocation,
  cookLocation,
  driver,
  estimatedTime = 30,
  onDriverContact,
  onTrackingUpdate,
  isAdmin = false
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<Location | null>(
    driver?.currentLocation || null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    estimatedArrival: Date;
  } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMapLoaded(true);
    
    // Start real-time tracking if driver is assigned
    if (driver && driver.isOnline) {
      startLocationTracking();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [driver]);

  const startLocationTracking = useCallback(() => {
    // Listen to real-time order updates for tracking info
    const unsubscribe = OrdersService.subscribeToOrder(orderId, (order) => {
      if (order?.tracking?.driverLocation) {
        const newLocation = {
          lat: order.tracking.driverLocation.latitude,
          lng: order.tracking.driverLocation.longitude
        };
        setDriverLocation(newLocation);
        
        // Update route info if available
        if (order.tracking.route) {
          setRouteInfo({
            distance: order.tracking.route.distance,
            duration: order.tracking.route.duration,
            estimatedArrival: order.tracking.route.estimatedArrival.toDate()
          });
        }
        
        // Notify parent component of tracking updates
        if (onTrackingUpdate) {
          onTrackingUpdate(order.tracking);
        }
      }
    });
    
    return unsubscribe;
  }, [orderId, onTrackingUpdate]);

  const refreshLocations = async () => {
    setRefreshing(true);
    try {
      if (driver) {
        const response = await fetch(`/api/drivers/${driver.id}/location`);
        if (response.ok) {
          const location = await response.json();
          setDriverLocation(location);
        }
      }
    } catch (error) {
      console.error('Error refreshing locations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const allLocations = [customerLocation, cookLocation];
  if (driverLocation) allLocations.push(driverLocation);

  const distanceToCustomer = driverLocation 
    ? calculateDistance(driverLocation, customerLocation).toFixed(1)
    : null;

  if (!mapLoaded) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seguimiento en Tiempo Real
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshLocations}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 w-full rounded-b-lg overflow-hidden">
            <MapContainer
              center={[customerLocation.lat, customerLocation.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapBounds locations={allLocations} />
              
              {/* Customer Location */}
              <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Tu ubicación</h3>
                    <p className="text-sm text-muted-foreground">
                      {customerLocation.address || 'Dirección de entrega'}
                    </p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Cook Location */}
              <Marker position={[cookLocation.lat, cookLocation.lng]} icon={cookIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Cocina</h3>
                    <p className="text-sm text-muted-foreground">
                      {cookLocation.address || 'Ubicación del cocinero'}
                    </p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Driver Location */}
              {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">Repartidor</h3>
                      <p className="text-sm text-muted-foreground">
                        {driver?.name} - {driver?.vehicleType}
                      </p>
                      {distanceToCustomer && (
                        <p className="text-sm">
                          A {distanceToCustomer} km de tu ubicación
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Route from driver to customer */}
              {driverLocation && (
                <DeliveryRoute
                  start={driverLocation}
                  end={customerLocation}
                  currentPosition={driverLocation}
                />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info Card */}
      {driver && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tu Repartidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={driver.avatar} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{driver.name}</h3>
                  <Badge variant={driver.isOnline ? 'default' : 'secondary'}>
                    {driver.isOnline ? 'En línea' : 'Desconectado'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehículo</p>
                    <p className="font-medium">{driver.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Placa</p>
                    <p className="font-medium">{driver.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Calificación</p>
                    <p className="font-medium">⭐ {driver.rating}</p>
                  </div>
                  {distanceToCustomer && (
                    <div>
                      <p className="text-muted-foreground">Distancia</p>
                      <p className="font-medium">{distanceToCustomer} km</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onDriverContact}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Tiempo estimado de llegada</p>
                <p className="text-sm text-muted-foreground">
                  Basado en el tráfico actual
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{estimatedTime} min</p>
              <p className="text-sm text-muted-foreground">
                {new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMap;