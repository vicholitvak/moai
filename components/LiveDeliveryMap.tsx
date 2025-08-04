'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  ChefHat, 
  Home, 
  Truck,
  RefreshCw,
  Phone,
  MessageCircle,
  Clock
} from 'lucide-react';
import type { Order, Cook, DeliveryTracking } from '@/lib/firebase/dataService';

interface LiveDeliveryMapProps {
  order: Order;
  cook: Cook | null;
  deliveryTracking: DeliveryTracking | null;
  className?: string;
}

export default function LiveDeliveryMap({ 
  order, 
  cook, 
  deliveryTracking, 
  className = '' 
}: LiveDeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    
    // Default to San Pedro de Atacama if no location available
    const defaultCenter = [-22.9110, -68.2003];
    let initialCenter = defaultCenter;
    let initialZoom = 13;

    // Try to center on cook location if available
    if (cook?.location?.coordinates) {
      initialCenter = [
        cook.location.coordinates.latitude,
        cook.location.coordinates.longitude
      ];
    }

    const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
    
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
  }, [mapLoaded, cook]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    // Add cook location marker
    if (cook?.location?.coordinates) {
      const cookLatLng = [cook.location.coordinates.latitude, cook.location.coordinates.longitude];
      
      const cookIcon = L.divIcon({
        html: `
          <div style="
            background: #ff6600;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="color: white; font-size: 18px;">🍳</div>
          </div>
        `,
        className: 'custom-cook-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const cookMarker = L.marker(cookLatLng, { icon: cookIcon }).addTo(map);
      cookMarker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #ff6600;">
            🍳 ${cook.displayName}
          </h3>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            Cocinero
          </div>
          <div style="font-size: 12px;">
            ${cook.location.address?.fullAddress || 'Ubicación del cocinero'}
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #9ca3af;">
            ⭐ ${cook.rating.toFixed(1)} • ${cook.totalOrders} pedidos completados
          </div>
        </div>
      `);
      
      markersRef.current.set('cook', cookMarker);
      bounds.extend(cookLatLng);
    }

    // Add driver location marker (if tracking available)
    if (deliveryTracking?.currentLocation) {
      const driverLatLng = [
        deliveryTracking.currentLocation.lat,
        deliveryTracking.currentLocation.lng
      ];
      
      const driverIcon = L.divIcon({
        html: `
          <div style="
            background: #10b981;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="color: white; font-size: 18px;">🚗</div>
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              background: #ef4444;
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          </div>
        `,
        className: 'custom-driver-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const driverMarker = L.marker(driverLatLng, { icon: driverIcon }).addTo(map);
      
      const lastUpdateTime = deliveryTracking.currentLocation.timestamp?.toDate 
        ? deliveryTracking.currentLocation.timestamp.toDate()
        : new Date();
      
      driverMarker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #10b981;">
            🚗 ${deliveryTracking.driverName}
          </h3>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            Conductor - ${deliveryTracking.currentStep === 'heading_to_pickup' ? 'Yendo al cocinero' :
                         deliveryTracking.currentStep === 'at_pickup' ? 'Recogiendo pedido' :
                         deliveryTracking.currentStep === 'heading_to_delivery' ? 'En camino hacia ti' :
                         'Entregando'}
          </div>
          ${deliveryTracking.estimatedDeliveryTime ? `
            <div style="font-size: 12px; margin-bottom: 4px;">
              🕒 ETA: ${deliveryTracking.estimatedDeliveryTime}
            </div>
          ` : ''}
          <div style="font-size: 11px; color: #9ca3af;">
            Última actualización: ${lastUpdateTime.toLocaleTimeString('es-CL')}
          </div>
        </div>
      `);
      
      markersRef.current.set('driver', driverMarker);
      bounds.extend(driverLatLng);
      setLastUpdate(lastUpdateTime);
    }

    // Add delivery destination marker (approximate)
    // Since we don't have exact coordinates for delivery address, we'll show a general area marker
    if (order.deliveryInfo.address && cook?.location?.coordinates) {
      // For demo purposes, we'll place the destination marker slightly offset from cook
      // In a real app, you'd geocode the delivery address
      const destinationLatLng = [
        cook.location.coordinates.latitude + 0.01,  // Slight offset
        cook.location.coordinates.longitude + 0.01
      ];
      
      const destinationIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="color: white; font-size: 18px;">🏠</div>
          </div>
        `,
        className: 'custom-destination-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const destinationMarker = L.marker(destinationLatLng, { icon: destinationIcon }).addTo(map);
      destinationMarker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #3b82f6;">
            🏠 Tu Ubicación
          </h3>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            Destino de entrega
          </div>
          <div style="font-size: 12px;">
            ${order.deliveryInfo.address}
          </div>
          ${order.deliveryInfo.instructions ? `
            <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
              📝 ${order.deliveryInfo.instructions}
            </div>
          ` : ''}
        </div>
      `);
      
      markersRef.current.set('destination', destinationMarker);
      bounds.extend(destinationLatLng);
    }

    // Fit map to show all markers with some padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }

  }, [mapLoaded, cook, deliveryTracking, order]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Trigger a re-render of markers by updating the last update time
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  const getDeliveryStepLabel = () => {
    if (!deliveryTracking) return 'Preparando seguimiento...';
    
    switch (deliveryTracking.currentStep) {
      case 'heading_to_pickup':
        return 'Conductor yendo al cocinero';
      case 'at_pickup':
        return 'Recogiendo tu pedido';
      case 'heading_to_delivery':
        return 'En camino hacia tu ubicación';
      case 'delivered':
        return 'Pedido entregado';
      default:
        return 'Actualizando ubicación...';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getDeliveryStepLabel()}
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Actualizado: {lastUpdate.toLocaleTimeString('es-CL')}
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] bg-gray-100 rounded-b-lg"
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

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-moai-orange rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🍳</span>
              </div>
              <span>Cocinero</span>
            </div>
            {deliveryTracking && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🚗</span>
                </div>
                <span>Conductor</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🏠</span>
              </div>
              <span>Tu ubicación</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Info Cards */}
      {deliveryTracking && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 pb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="font-semibold text-sm">
                {deliveryTracking.estimatedDeliveryTime || 'Calculando...'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Navigation className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Distancia</p>
              <p className="font-semibold text-sm">Calculando...</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Truck className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-semibold text-sm">{getDeliveryStepLabel()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .custom-cook-marker,
        .custom-driver-marker,
        .custom-destination-marker {
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