'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Edit2, Save, Crosshair, AlertCircle } from 'lucide-react';
import { LocationService } from '@/lib/services/locationService';

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  placeId?: string;
  formattedAddress?: string;
  source?: 'autocomplete' | 'geocoded' | 'manual';
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (
    address: string,
    coordinates?: Coordinates,
    fullAddressData?: google.maps.places.PlaceResult
  ) => void;
  placeholder?: string;
  defaultAddress?: string;
  userSavedAddress?: string;
  className?: string;
  disabled?: boolean;
}

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  placeholder = 'Ingresa tu dirección...',
  defaultAddress,
  userSavedAddress,
  className = '',
  disabled = false
}: GoogleAddressAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeServices = () => {
      if (!window.google) return;
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
      geocoderRef.current = new window.google.maps.Geocoder();
    };

    if (window.google) {
      initializeServices();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initializeServices;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (userSavedAddress && !value && !isEditing) {
      onChange(userSavedAddress, undefined, undefined);
    }
  }, [userSavedAddress, value, isEditing, onChange]);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue, undefined, undefined);
    setError(null);

    if (!autocompleteService.current || inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: inputValue,
        componentRestrictions: { country: 'CL' },
        types: ['address']
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const buildCoordinates = (
    lat: number,
    lng: number,
    options?: Partial<Coordinates>
  ): Coordinates => ({
    latitude: lat,
    longitude: lng,
    accuracy: options?.accuracy,
    placeId: options?.placeId,
    formattedAddress: options?.formattedAddress,
    source: options?.source ?? 'geocoded'
  });

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;
    setIsLoadingPlaces(true);
    setError(null);

    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        setIsLoadingPlaces(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place || !place.geometry?.location) {
          setError('No se pudo obtener la ubicación seleccionada. Intenta nuevamente.');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const coords = buildCoordinates(lat, lng, {
          placeId: place.place_id,
          formattedAddress: place.formatted_address ?? prediction.description,
          source: 'autocomplete'
        });

        onChange(place.formatted_address ?? prediction.description, coords, place);
        setSuggestions([]);
        setIsEditing(false);
      }
    );
  };

  const handleUseCurrentAddress = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLoadingPlaces(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          const address = await LocationService.getAddressFromCoordinates(latitude, longitude);
          const coords = buildCoordinates(latitude, longitude, {
            accuracy,
            formattedAddress: address.fullAddress,
            source: 'manual'
          });
          onChange(address.fullAddress, coords, undefined);
          setSuggestions([]);
          setIsEditing(false);
        } catch (geoError) {
          console.error('Error realizando geocoding inverso:', geoError);
          setError('No pudimos obtener tu dirección actual. Intenta de nuevo.');
        } finally {
          setIsLoadingPlaces(false);
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        setIsLoadingPlaces(false);
        setError('No pudimos acceder a tu ubicación. Revisa los permisos.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleManualGeocode = async () => {
    if (!geocoderRef.current || value.length < 5) {
      setError('Ingresa una dirección más específica');
      return;
    }

    setIsLoadingPlaces(true);
    setError(null);
    geocoderRef.current.geocode(
      {
        address: value,
        region: 'cl'
      },
      (results, status) => {
        setIsLoadingPlaces(false);
        if (status !== 'OK' || !results || results.length === 0 || !results[0].geometry?.location) {
          setError('No se encontró la dirección. Ajusta e intenta nuevamente.');
          return;
        }

        const result = results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const coords = buildCoordinates(lat, lng, {
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
          source: 'geocoded'
        });
        onChange(result.formatted_address, coords, undefined);
        setSuggestions([]);
        setIsEditing(false);
      }
    );
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  if (userSavedAddress && !isEditing && value === userSavedAddress) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">Dirección guardada</p>
              <p className="text-sm text-green-700">{userSavedAddress}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditToggle}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditToggle}
          className="w-full text-xs"
        >
          Usar una dirección diferente
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoadingPlaces}
          className="pr-10"
        />
        {isLoadingPlaces && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSuggestionSelect(prediction)}
              className="w-full p-3 text-left hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseCurrentAddress}
          disabled={isLoadingPlaces}
        >
          <Crosshair className="h-4 w-4 mr-1" />
          Usar mi ubicación
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualGeocode}
          disabled={isLoadingPlaces || value.length < 5}
        >
          <Save className="h-4 w-4 mr-1" />
          Validar dirección
        </Button>
        {defaultAddress && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(defaultAddress)}
          >
            Restablecer
          </Button>
        )}
      </div>
    </div>
  );
}