"use client";

import { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

const libraries: ('places')[] = ['places'];

interface AddressAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function AddressAutocomplete({ onPlaceSelect }: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = (ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
    } else {
      console.error('Autocomplete is not loaded yet!');
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      fields={['address_components', 'geometry', 'formatted_address']}
    >
      <Input type="text" placeholder="Enter your delivery address" />
    </Autocomplete>
  );
}