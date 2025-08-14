'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Edit2, Save } from 'lucide-react';

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string, fullAddressData?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  defaultAddress?: string;
  userSavedAddress?: string;
  className?: string;
  disabled?: boolean;
}

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  placeholder = "Ingresa tu dirección...",
  defaultAddress,
  userSavedAddress,
  className = "",
  disabled = false
}: GoogleAddressAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Google Places API
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService (required by Google API)
      const dummyDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
    } else {
      // Load Google Places API if not loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
      };
      document.head.appendChild(script);
    }
  }, []);

  // Use saved address as default
  useEffect(() => {
    if (userSavedAddress && !value && !isEditing) {
      onChange(userSavedAddress);
    }
  }, [userSavedAddress, value, onChange, isEditing]);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (!autocompleteService.current || inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    // Get autocomplete suggestions
    autocompleteService.current.getPlacePredictions(
      {
        input: inputValue,
        componentRestrictions: { country: 'CL' }, // Restrict to Chile
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

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;
    
    setIsLoadingPlaces(true);
    
    // Get detailed place information
    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        setIsLoadingPlaces(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          onChange(prediction.description, place);
          setSuggestions([]);
        }
      }
    );
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Focus input when starting to edit
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleUseCurrentAddress = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                onChange(results[0].formatted_address);
                setIsEditing(false);
              }
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Show saved address with option to edit
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

      {/* Suggestions dropdown */}
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

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseCurrentAddress}
          className="text-xs flex-1"
        >
          <MapPin className="h-3 w-3 mr-1" />
          Usar mi ubicación
        </Button>
        {isEditing && userSavedAddress && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(userSavedAddress);
              setIsEditing(false);
            }}
            className="text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            Usar guardada
          </Button>
        )}
      </div>
    </div>
  );
}