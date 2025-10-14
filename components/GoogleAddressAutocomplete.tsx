'use client';

import { useEffect, useRef, useState } from 'react';
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

// Extend HTMLElement for the new PlaceAutocompleteElement
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.Ref<HTMLElement>;
        },
        HTMLElement
      >;
    }
  }
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
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initServices = async (): Promise<void> => {
      try {
        setIsLoadingPlaces(true);
        const googleApi = await loadGoogleMapsApi();
        geocoderRef.current = new googleApi.maps.Geocoder();
        setIsApiLoaded(true);
      } catch (err) {
        console.error('Error initializing Google Maps services', err);
        setError('No pudimos cargar el servicio de direcciones. Intenta recargar la página.');
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    initServices();
  }, []);

  useEffect(() => {
    if (userSavedAddress && !value && !isEditing) {
      onChange(userSavedAddress, undefined, undefined);
    }
  }, [userSavedAddress, value, isEditing, onChange]);

  useEffect(() => {
    if (!autocompleteRef.current || !isApiLoaded) return;

    const handlePlaceSelect = async (event: Event): Promise<void> => {
      const customEvent = event as CustomEvent<{ place: google.maps.places.Place }>;
      const place = customEvent.detail?.place;

      if (!place) {
        setError('No se pudo obtener la ubicación seleccionada. Intenta nuevamente.');
        return;
      }

      try {
        // Fetch place details
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents', 'id']
        });

        const location = place.location;
        if (!location) {
          setError('No se pudo obtener la ubicación seleccionada. Intenta nuevamente.');
          return;
        }

        const lat = location.lat();
        const lng = location.lng();
        const coords = buildCoordinates(lat, lng, {
          placeId: place.id,
          formattedAddress: place.formattedAddress ?? value,
          source: 'autocomplete'
        });

        onChange(place.formattedAddress ?? value, coords, undefined);
        setIsEditing(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching place details:', err);
        setError('No se pudo obtener la ubicación seleccionada. Intenta nuevamente.');
      }
    };

    const handleError = (event: Event): void => {
      console.error('Place autocomplete error:', event);
      setError('Error al buscar direcciones. Por favor, intenta nuevamente.');
    };

    autocompleteRef.current.addEventListener('gmp-placeselect', handlePlaceSelect);
    autocompleteRef.current.addEventListener('gmp-error', handleError);

    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.removeEventListener('gmp-placeselect', handlePlaceSelect);
        autocompleteRef.current.removeEventListener('gmp-error', handleError);
      }
    };
  }, [isApiLoaded, onChange, value]);

  const handleInputChange = (inputValue: string): void => {
    onChange(inputValue, undefined, undefined);
    setError(null);
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
            {isApiLoaded ? (
              <gmp-place-autocomplete
                ref={autocompleteRef}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border))',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || isLoadingPlaces}
                className="pr-10"
              />
            )}
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
            {userSavedAddress && userSavedAddress !== value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(userSavedAddress)}
              >
                Restablecer
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}