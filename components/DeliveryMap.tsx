'use client';

import { useState, useEffect, useRef } from 'react';
import type { Order, Cook } from '@/lib/firebase/dataService';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryMapProps {
  order: Order;
  cook: Cook | null;
  currentStep: number;
  onLocationUpdate?: (eta: { pickup?: string; delivery?: string; total?: string }) => void;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

const DeliveryMap = ({ order, cook, currentStep, onLocationUpdate }: DeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if Google Maps is loaded
        if (!window.google) {
          // Load Google Maps API
          await loadGoogleMapsAPI();
        }

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            zoom: 13,
            center: { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          const directionsServ = new google.maps.DirectionsService();
          const directionsRend = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#FF6600', // Moai orange
              strokeWeight: 4,
            },
          });

          directionsRend.setMap(mapInstance);

          setMap(mapInstance);
          setDirectionsService(directionsServ);
          setDirectionsRenderer(directionsRend);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Error al cargar el mapa');
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Get current location
        const current = await getCurrentLocation();
        setCurrentLocation(current);

        // Get pickup location (cook's location)
        if (cook?.location?.coordinates) {
          const pickup: Location = {
            lat: cook.location.coordinates.latitude,
            lng: cook.location.coordinates.longitude,
            address: cook.location.address?.fullAddress || 'Ubicación del cocinero'
          };
          setPickupLocation(pickup);
        } else {
          // Geocode cook's address if coordinates not available
          const pickup = await geocodeAddress(cook?.location?.address?.fullAddress || 'Santiago, Chile');
          setPickupLocation(pickup);
        }

        // Get delivery location (geocode customer address)
        const delivery = await geocodeAddress(order.deliveryInfo.address);
        setDeliveryLocation(delivery);

      } catch (error) {
        console.error('Error loading locations:', error);
        // Use fallback locations
        setCurrentLocation({ lat: -33.4489, lng: -70.6693, address: 'Santiago Centro' });
        setPickupLocation({ lat: -33.4489, lng: -70.6693, address: cook?.displayName || 'Cocinero' });
        setDeliveryLocation({ lat: -33.4489, lng: -70.6693, address: order.deliveryInfo.address });
      }
    };

    if (map && cook) {
      loadLocations();
    }
  }, [map, cook, order]);

  // Update route based on current step
  useEffect(() => {
    if (map && directionsService && directionsRenderer && currentLocation && pickupLocation && deliveryLocation) {
      updateRoute();
    }
  }, [map, directionsService, directionsRenderer, currentLocation, pickupLocation, deliveryLocation, currentStep]);

  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  };

  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Tu ubicación actual'
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to Santiago center
          resolve({
            lat: -33.4489,
            lng: -70.6693,
            address: 'Santiago Centro (ubicación aproximada)'
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const geocodeAddress = async (address: string): Promise<Location> => {
    if (!window.google) throw new Error('Google Maps not loaded');

    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: `${address}, Santiago, Chile` }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            address: results[0].formatted_address
          });
        } else {
          console.warn('Geocoding failed for:', address);
          // Fallback to Santiago center
          resolve({
            lat: -33.4489,
            lng: -70.6693,
            address: address
          });
        }
      });
    });
  };

  const updateRoute = () => {
    if (!directionsService || !directionsRenderer || !currentLocation || !pickupLocation || !deliveryLocation) {
      return;
    }

    let origin: Location;
    let destination: Location;
    let waypoints: google.maps.DirectionsWaypoint[] = [];

    // Determine route based on current step
    if (currentStep === 0 || currentStep === 1) {
      // Going to pickup location
      origin = currentLocation;
      destination = pickupLocation;
    } else if (currentStep === 2) {
      // Going to delivery location (pickup -> delivery)
      origin = pickupLocation;
      destination = deliveryLocation;
    } else {
      // Show full route (current -> pickup -> delivery)
      origin = currentLocation;
      destination = deliveryLocation;
      waypoints = [{ location: { lat: pickupLocation.lat, lng: pickupLocation.lng }, stopover: true }];
    }

    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);

        // Calculate and update ETA
        const route = result.routes[0];
        if (route && route.legs.length > 0) {
          let totalDuration = 0;
          let pickupETA = '';
          let deliveryETA = '';

          route.legs.forEach((leg, index) => {
            totalDuration += leg.duration?.value || 0;
            if (index === 0) {
              pickupETA = leg.duration?.text || '';
            }
            if (waypoints.length === 0) {
              deliveryETA = leg.duration?.text || '';
            } else if (index === 1) {
              deliveryETA = leg.duration?.text || '';
            }
          });

          const totalETA = Math.ceil(totalDuration / 60); // Convert to minutes
          const totalETAText = `${totalETA} min`;

          onLocationUpdate?.({
            pickup: pickupETA,
            delivery: deliveryETA,
            total: totalETAText
          });
        }

        // Add custom markers
        addCustomMarkers();
      } else {
        console.error('Directions request failed:', status);
        setError('Error al calcular la ruta');
      }
    });
  };

  const addCustomMarkers = () => {
    if (!map || !currentLocation || !pickupLocation || !deliveryLocation) return;

    // Clear existing markers
    // (DirectionsRenderer already handles route markers)

    // Add current location marker
    new google.maps.Marker({
      position: { lat: currentLocation.lat, lng: currentLocation.lng },
      map: map,
      title: 'Tu ubicación',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
  };

  const openInGoogleMaps = () => {
    if (!pickupLocation && !deliveryLocation) return;

    let destination: Location;
    if (currentStep === 0 || currentStep === 1) {
      destination = pickupLocation!;
    } else {
      destination = deliveryLocation!;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={openInGoogleMaps}>
            <Navigation className="h-4 w-4 mr-2" />
            Abrir en Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Floating action button */}
      <div className="absolute bottom-4 right-4">
        <Button onClick={openInGoogleMaps} size="sm" className="shadow-lg">
          <Navigation className="h-4 w-4 mr-2" />
          Navegar
        </Button>
      </div>

      {/* Location info overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm">
            <div className="font-medium text-primary mb-1">
              {currentStep === 0 || currentStep === 1 ? 'Dirigiéndote a:' : 'Entregando en:'}
            </div>
            <div className="text-muted-foreground">
              {currentStep === 0 || currentStep === 1 
                ? pickupLocation?.address || 'Cargando...'
                : deliveryLocation?.address || 'Cargando...'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;