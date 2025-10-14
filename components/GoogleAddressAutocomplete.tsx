'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Edit2, Save, Crosshair, AlertCircle, ShieldCheck } from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/utils/googleMapsLoader';
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
  userSavedAddress?: string;
  className?: string;
  disabled?: boolean;
  hasVerifiedCoordinates?: boolean;
}

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  placeholder = 'Ingresa tu dirección...',
  userSavedAddress,
  className = '',
  disabled = false,
  hasVerifiedCoordinates = false
}: GoogleAddressAutocompleteProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);
  const placesClient = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const initServices = useMemo(() => async (): Promise<void> => {
    try {
      setIsLoadingPlaces(true);
      const googleApi = await loadGoogleMapsApi();
      sessionToken.current = new googleApi.maps.places.AutocompleteSessionToken();
      geocoderRef.current = new googleApi.maps.Geocoder();
      const dummyEl = document.createElement('div');
      placesClient.current = new googleApi.maps.places.PlacesService(dummyEl);

      if (inputRef.current) {
        autocompleteInstance.current = new googleApi.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'CL' },
          fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
          types: ['address']
        });

        autocompleteInstance.current.addListener('place_changed', () => {
          const place = autocompleteInstance.current?.getPlace();

          if (!place?.geometry?.location) {
            setError('No se pudo obtener la ubicación seleccionada. Intenta nuevamente.');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const coords = buildCoordinates(lat, lng, {
            placeId: place.place_id,
            formattedAddress: place.formatted_address ?? value,
            source: 'autocomplete'
          });

          onChange(place.formatted_address ?? value, coords, place);
          setSuggestions([]);
          setIsEditing(false);
          sessionToken.current = new googleApi.maps.places.AutocompleteSessionToken();
        });
      }
    } catch (err) {
      console.error('Error initializing Google Maps services', err);
      setError('No pudimos cargar el servicio de direcciones. Intenta recargar la página.');
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [onChange, value]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    initServices();
  }, [initServices]);

  useEffect(() => {
    if (userSavedAddress && !value && !isEditing) {
      onChange(userSavedAddress, undefined, undefined);
    }
  }, [userSavedAddress, value, isEditing, onChange]);

  const handleInputChange = (inputValue: string): void => {
    onChange(inputValue, undefined, undefined);
    setError(null);

    if (!autocompleteInstance.current || inputValue.length < 3 || !sessionToken.current) {
      setSuggestions([]);
      return;
    }

    const googleMaps = window.google;
    if (!googleMaps?.maps?.places) return;

    const service = new googleMaps.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: inputValue,
        componentRestrictions: { country: 'CL' },
        types: ['address'],
        sessionToken: sessionToken.current
      },
      (predictions, status) => {
        if (status === googleMaps.maps.places.PlacesServiceStatus.OK && predictions) {
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

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction): void => {
    if (!placesClient.current || !sessionToken.current) return;
    setIsLoadingPlaces(true);
    setError(null);

    placesClient.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
        sessionToken: sessionToken.current
      },
      (place, status) => {
        setIsLoadingPlaces(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
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
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    );
  };

  const handleUseCurrentAddress = (): void => {
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

  const handleManualGeocode = async (): Promise<void> => {
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

  const handleEditToggle = (): void => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const showVerifiedBanner = hasVerifiedCoordinates && !isEditing;

  return (
    <div className={`space-y-2 ${className}`}>
      {showVerifiedBanner ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50/70 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Dirección verificada</p>
                <p className="text-sm text-emerald-700 break-words">{value}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditToggle}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>La ubicación exacta se guardará para una entrega más precisa.</span>
          </div>
        </div>
      ) : (
        <>
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

          <div className="flex flex-wrap gap-2">
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
        </>
      )}
    </div>
  );

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