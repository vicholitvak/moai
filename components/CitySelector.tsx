'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, Search, X } from 'lucide-react';
// import { ChileanCitiesService, ChileanCity } from '@/lib/services/chileanCitiesService';
// import { LocationService } from '@/lib/services/locationService';


const GOOGLE_API_KEY = 'AIzaSyD1-kWnLi0Qcp5dI-TQgY4ADKWtl2mjTSU';

interface LocationResult {
  description: string;
  place_id: string;
  lat?: string;
  lon?: string;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';



interface CitySelectorProps {
  selectedLocation?: LocationResult;
  onLocationSelect: (location: LocationResult) => void;
  className?: string;
}


export function CitySelector({ selectedLocation, onLocationSelect, className }: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get geolocation on mount
    if (!currentLocation && !geoError) {
      if (navigator.geolocation) {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            // Reverse geocode using Google Geocoding API, restrict to Chile
            try {
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&region=cl`);
              const data = await res.json();
              const chileResult = data.results.find((r: any) => r.formatted_address.includes('Chile'));
              if (chileResult) {
                setCurrentLocation({
                  description: chileResult.formatted_address,
                  place_id: chileResult.place_id,
                  lat: String(latitude),
                  lon: String(longitude)
                });
              } else {
                setGeoError('Ubicación fuera de Chile.');
              }
              setIsLoading(false);
            } catch (e) {
              setGeoError('No se pudo obtener la ubicación.');
              setIsLoading(false);
            }
          },
          (err) => {
            setGeoError('Permiso de ubicación denegado.');
            setIsLoading(false);
          }
        );
      } else {
        setGeoError('Geolocalización no soportada.');
      }
    }
  }, [currentLocation, geoError]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      setIsLoading(true);
      fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&types=(cities)&components=country:cl&key=${GOOGLE_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'OK') {
            setSearchResults(data.predictions.map((p: any) => ({
              description: p.description,
              place_id: p.place_id
            })));
          } else {
            setSearchResults([]);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);


  const handleLocationSelect = async (location: LocationResult) => {
    // If lat/lon not present, fetch details
    if (!location.lat || !location.lon) {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.place_id}&fields=geometry&key=${GOOGLE_API_KEY}`);
        const data = await res.json();
        if (data.status === 'OK') {
          location.lat = String(data.result.geometry.location.lat);
          location.lon = String(data.result.geometry.location.lng);
        }
      } catch {}
    }
    onLocationSelect(location);
    setIsOpen(false);
    setSearchQuery('');
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
                {selectedLocation ? selectedLocation.description : 'Seleccionar ubicación'}
              </span>
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seleccionar Ubicación
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Location Button */}
            <Button
              onClick={() => currentLocation && handleLocationSelect(currentLocation)}
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isLoading || !currentLocation}
            >
              <MapPin className="h-4 w-4" />
              {isLoading ? 'Detectando ubicación...' : currentLocation ? currentLocation.description : 'Usar mi ubicación actual'}
            </Button>
            {geoError && <div className="text-xs text-red-500">{geoError}</div>}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cualquier ubicación..."
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

            {/* Search Results - always show full width and not cut off */}
            <div className="max-h-96 min-h-[48px] overflow-y-auto space-y-2 w-full">
              {isLoading && searchQuery.trim().length > 2 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchQuery.trim().length > 2 && searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron ubicaciones
                </div>
              ) : (
                searchResults.map((loc, idx) => (
                  <Card
                    key={loc.place_id + idx}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleLocationSelect(loc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-moai-500" />
                        <span className="font-medium">{loc.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}