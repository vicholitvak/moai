'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Car, 
  RefreshCw, 
  Users, 
  Clock,
  Phone,
  Navigation,
  Zap,
  AlertCircle
} from 'lucide-react';
import type { Driver } from '@/lib/firebase/dataService';
import { DriversService } from '@/lib/firebase/dataService';
import { DeliveryTrackingService } from '@/lib/services/deliveryTrackingService';

interface DriverLocation extends Driver {
  lat: number;
  lng: number;
  lastUpdate: Date;
  speed?: number;
  heading?: number;
}

interface DriverTrackingMapProps {
  drivers: Driver[];
  onDriverSelect?: (driver: Driver) => void;
}

// Mock San Pedro de Atacama locations for drivers
const SAN_PEDRO_LOCATIONS = [
  { lat: -22.9110, lng: -68.2003, area: 'Centro' },
  { lat: -22.9087, lng: -68.1985, area: 'Plaza de Armas' },
  { lat: -22.9125, lng: -68.2010, area: 'Caracoles' },
  { lat: -22.9095, lng: -68.1995, area: 'Toconao' },
  { lat: -22.9140, lng: -68.2025, area: 'Ayllu de Larache' },
  { lat: -22.9080, lng: -68.1970, area: 'Ayllu de Yaye' },
  { lat: -22.9155, lng: -68.2040, area: 'Ayllu de Conde Duque' },
  { lat: -22.9070, lng: -68.1960, area: 'Ayllu de Solor' },
  { lat: -22.9130, lng: -68.2015, area: 'Ayllu de Sequitor' },
  { lat: -22.9100, lng: -68.1980, area: 'Ayllu de Cuchabrache' },
];

export default function DriverTrackingMap({ drivers, onDriverSelect }: DriverTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real driver locations from Firebase
  useEffect(() => {
    const loadRealDriverLocations = async (): Promise<DriverLocation[]> => {
      const locations: DriverLocation[] = [];
      
      for (const driver of drivers) {
        let driverLocation: DriverLocation;
        
        // Check if driver has a real location from current/recent location updates
        if (driver.currentLocation?.coordinates?.latitude && driver.currentLocation?.coordinates?.longitude) {
          driverLocation = {
            ...driver,
            lat: driver.currentLocation.coordinates.latitude,
            lng: driver.currentLocation.coordinates.longitude,
            lastUpdate: driver.currentLocation.coordinates.timestamp?.toDate() || new Date(),
            speed: driver.isOnline ? (driver.currentLocation as any)?.speed || 0 : 0,
            heading: (driver.currentLocation as any)?.heading || 0
          };
        } else {
          // Fallback to San Pedro area if no real location available
          const baseLocation = SAN_PEDRO_LOCATIONS[locations.length % SAN_PEDRO_LOCATIONS.length];
          const lat = baseLocation.lat + (Math.random() - 0.5) * 0.01;
          const lng = baseLocation.lng + (Math.random() - 0.5) * 0.01;
          
          driverLocation = {
            ...driver,
            lat,
            lng,
            lastUpdate: new Date(Date.now() - Math.random() * 600000), // Last 10 minutes
            speed: 0,
            heading: 0
          };
        }
        
        locations.push(driverLocation);
      }
      
      return locations;
    };

    loadRealDriverLocations().then(setDriverLocations);
  }, [drivers]);

  // Load Leaflet CSS and JS
  useEffect(() => {
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setMapLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    
    const map = L.map(mapRef.current).setView([-22.9110, -68.2003], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    driverLocations.forEach(driver => {
      const iconColor = driver.isOnline ? 
        (driver.isAvailable ? '#10b981' : '#f59e0b') : '#6b7280';
      
      const iconHtml = `
        <div style="
          background: ${iconColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
        ">
          <div style="color: white; font-size: 16px;">🚗</div>
          ${driver.isOnline ? `
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 8px;
              height: 8px;
              background: #ef4444;
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          ` : ''}
        </div>
      `;

      const marker = L.marker([driver.lat, driver.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'custom-driver-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      // Add click handler
      marker.on('click', () => {
        setSelectedDriver(driver);
        onDriverSelect?.(driver);
      });

      // Add popup
      const statusText = driver.isOnline ? 
        (driver.isAvailable ? 'Disponible' : 'Ocupado') : 'Desconectado';
      
      marker.bindPopup(`
        <div style="font-family: system-ui;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
            ${driver.displayName}
          </h3>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            ${driver.vehicleType} - ${driver.vehicleInfo?.make || 'N/A'} ${driver.vehicleInfo?.model || ''}
          </div>
          <div style="font-size: 12px;">
            <span style="color: ${iconColor};">●</span> ${statusText}
            ${driver.speed ? ` • ${driver.speed} km/h` : ''}
          </div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
            Actualizado: ${new Date(driver.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      `);

      markersRef.current.set(driver.id, marker);
    });
  }, [driverLocations, mapLoaded, onDriverSelect]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Reload fresh driver data from Firebase
      const locations: DriverLocation[] = [];
      
      for (const driver of drivers) {
        // Get fresh driver data
        const freshDriver = await DriversService.getDriverById(driver.id);
        if (!freshDriver) continue;
        
        let driverLocation: DriverLocation;
        
        if (freshDriver.currentLocation?.coordinates?.latitude && freshDriver.currentLocation?.coordinates?.longitude) {
          driverLocation = {
            ...freshDriver,
            lat: freshDriver.currentLocation.coordinates.latitude,
            lng: freshDriver.currentLocation.coordinates.longitude,
            lastUpdate: freshDriver.currentLocation.coordinates.timestamp?.toDate() || new Date(),
            speed: freshDriver.isOnline ? (freshDriver.currentLocation as any)?.speed || 0 : 0,
            heading: (freshDriver.currentLocation as any)?.heading || 0
          };
        } else {
          // Keep existing location if no new data
          const existing = driverLocations.find(d => d.id === driver.id);
          if (existing) {
            driverLocation = { 
              ...freshDriver, 
              lat: existing.lat, 
              lng: existing.lng, 
              lastUpdate: existing.lastUpdate,
              speed: existing.speed,
              heading: existing.heading
            };
          } else {
            // Fallback to San Pedro area
            const baseLocation = SAN_PEDRO_LOCATIONS[locations.length % SAN_PEDRO_LOCATIONS.length];
            driverLocation = {
              ...freshDriver,
              lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
              lng: baseLocation.lng + (Math.random() - 0.5) * 0.01,
              lastUpdate: new Date(),
              speed: 0,
              heading: 0
            };
          }
        }
        
        locations.push(driverLocation);
      }
      
      setDriverLocations(locations);
    } catch (error) {
      console.error('Error refreshing driver locations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onlineDrivers = driverLocations.filter(d => d.isOnline);
  const availableDrivers = onlineDrivers.filter(d => d.isAvailable);

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conductores</p>
                <p className="text-2xl font-bold">{driverLocations.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Línea</p>
                <p className="text-2xl font-bold text-green-600">{onlineDrivers.length}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-blue-600">{availableDrivers.length}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desconectados</p>
                <p className="text-2xl font-bold text-gray-600">{driverLocations.length - onlineDrivers.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seguimiento en Tiempo Real
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span>Desconectado</span>
                </div>
              </div>

              {/* Map Container */}
              <div 
                ref={mapRef} 
                className="w-full h-[500px] bg-gray-100 rounded-lg"
                style={{ zIndex: 1 }}
              >
                {!mapLoaded && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Cargando mapa...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Details Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {selectedDriver ? 'Detalles del Conductor' : 'Conductores Activos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedDriver ? (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Car className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">{selectedDriver.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedDriver.email}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estado:</span>
                    <Badge variant={selectedDriver.isOnline ? 'default' : 'secondary'}>
                      {selectedDriver.isOnline ? 
                        (selectedDriver.isAvailable ? 'Disponible' : 'Ocupado') : 
                        'Desconectado'
                      }
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vehículo:</span>
                    <span className="text-sm font-medium">{selectedDriver.vehicleType}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rating:</span>
                    <span className="text-sm font-medium">⭐ {selectedDriver.rating.toFixed(1)}</span>
                  </div>

                  {selectedDriver.currentLocation && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Velocidad:</span>
                      <span className="text-sm font-medium">
                        {driverLocations.find(d => d.id === selectedDriver.id)?.speed || 0} km/h
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Entregas:</span>
                    <span className="text-sm font-medium">{selectedDriver.totalDeliveries}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button className="w-full" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Navigation className="h-4 w-4 mr-2" />
                    Ver Ruta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {onlineDrivers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay conductores en línea</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {onlineDrivers.map(driver => (
                      <div 
                        key={driver.id}
                        className="p-3 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            driver.isAvailable ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{driver.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {driver.vehicleType} • {driver.speed || 0}km/h
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .custom-driver-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}