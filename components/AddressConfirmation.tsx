'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Home, Building, MapPinned, User, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface AddressData {
  lat: number;
  lng: number;
  street: string;
  number: string;
  apartment?: string;
  instructions?: string;
  label: string; // 'Casa', 'Trabajo', 'Otro'
  contactName: string;
  contactPhone: string;
}

interface AddressConfirmationProps {
  onConfirm: (address: AddressData) => void;
  onCancel?: () => void;
  initialAddress?: Partial<AddressData>;
}

export function AddressConfirmation({ onConfirm, onCancel, initialAddress }: AddressConfirmationProps) {
  const [step, setStep] = useState<'map' | 'details'>('map');
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialAddress?.lat || -33.4489,
    lng: initialAddress?.lng || -70.6693
  });
  const [addressDetails, setAddressDetails] = useState<AddressData>({
    lat: initialAddress?.lat || -33.4489,
    lng: initialAddress?.lng || -70.6693,
    street: initialAddress?.street || '',
    number: initialAddress?.number || '',
    apartment: initialAddress?.apartment || '',
    instructions: initialAddress?.instructions || '',
    label: initialAddress?.label || 'Casa',
    contactName: initialAddress?.contactName || '',
    contactPhone: initialAddress?.contactPhone || ''
  });
  const [detectedAddress, setDetectedAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Simulated map interaction - In production, integrate with Google Maps or similar
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setAddressDetails(prev => ({ ...prev, lat, lng }));
    reverseGeocode(lat, lng);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      // Simulated reverse geocoding - integrate with actual geocoding API
      await new Promise(resolve => setTimeout(resolve, 500));
      const simulatedAddress = `Av. Libertador Bernardo O'Higgins ${Math.floor(Math.random() * 1000)}`;
      setDetectedAddress(simulatedAddress);
      setAddressDetails(prev => ({
        ...prev,
        street: simulatedAddress,
        lat,
        lng
      }));
    } catch (error) {
      toast.error('No se pudo detectar la dirección');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleMapClick(latitude, longitude);
          toast.success('Ubicación detectada');
        },
        (error) => {
          toast.error('No se pudo obtener tu ubicación actual');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Tu navegador no soporta geolocalización');
    }
  };

  const handleConfirmMap = () => {
    if (!detectedAddress) {
      toast.error('Por favor, selecciona una ubicación en el mapa');
      return;
    }
    setStep('details');
  };

  const handleConfirmDetails = () => {
    // Validate required fields
    if (!addressDetails.street || !addressDetails.number) {
      toast.error('Por favor, completa la dirección');
      return;
    }
    if (!addressDetails.contactName || !addressDetails.contactPhone) {
      toast.error('Por favor, completa los datos de contacto');
      return;
    }

    onConfirm(addressDetails);
  };

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddressDetails(prev => ({ ...prev, [field]: value }));
  };

  if (step === 'map') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Confirma tu dirección
            </CardTitle>
            <CardDescription>
              Arrastra el pin en el mapa o busca tu dirección
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Simulated Map */}
            <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden border-2 border-border">
              <div className="aspect-video flex items-center justify-center relative">
                {/* This would be replaced with actual map component */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
                  <div className="text-center space-y-4">
                    <MapPinned className="h-16 w-16 text-primary mx-auto animate-bounce" />
                    <p className="text-sm text-muted-foreground">
                      Vista previa del mapa
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      En producción, aquí se mostrará un mapa interactivo donde puedes arrastrar el pin a tu ubicación exacta
                    </p>
                  </div>
                </div>

                {/* Map Controls Overlay */}
                <div className="absolute top-4 right-4 space-y-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white shadow-lg"
                    onClick={getCurrentLocation}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Mi ubicación
                  </Button>
                </div>

                {/* Marker Position Display */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {detectedAddress || 'Selecciona una ubicación'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lat: {markerPosition.lat.toFixed(6)}, Lng: {markerPosition.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Address */}
            <div className="space-y-2">
              <Label>Buscar dirección</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Av. Providencia 1234, Santiago"
                  value={addressDetails.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
                <Button variant="outline">
                  Buscar
                </Button>
              </div>
            </div>

            {/* Address Detected */}
            {detectedAddress && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Dirección detectada</p>
                    <p className="text-sm text-green-700">{detectedAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleConfirmMap} disabled={!detectedAddress}>
                Confirmar Ubicación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Detalles de la dirección
          </CardTitle>
          <CardDescription>
            Completa los detalles para facilitar la entrega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confirmed Address Display */}
          <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{detectedAddress}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('map')}
            >
              Cambiar
            </Button>
          </div>

          {/* Address Number and Apartment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">
                Número de casa/edificio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                placeholder="Ej: 1234"
                value={addressDetails.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment">Número de departamento</Label>
              <Input
                id="apartment"
                placeholder="Ej: 301"
                value={addressDetails.apartment || ''}
                onChange={(e) => handleInputChange('apartment', e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Indicaciones para la entrega</Label>
            <Textarea
              id="instructions"
              placeholder="Ej: Timbre 3, portón azul, al lado del almacén..."
              value={addressDetails.instructions || ''}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Ayuda al repartidor a encontrarte más fácilmente
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos de contacto
            </h3>

            <div className="space-y-2">
              <Label htmlFor="contactName">
                Nombre de quien recibe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                placeholder="Ej: Juan Pérez"
                value={addressDetails.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">
                Teléfono de contacto <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-md border">
                  <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">+56</span>
                </div>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="9 1234 5678"
                  value={addressDetails.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Label */}
          <div className="space-y-2 pt-4 border-t">
            <Label>¿Qué nombre le damos a esta dirección?</Label>
            <Select
              value={addressDetails.label}
              onValueChange={(value) => handleInputChange('label', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casa">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Casa
                  </div>
                </SelectItem>
                <SelectItem value="Trabajo">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Trabajo
                  </div>
                </SelectItem>
                <SelectItem value="Otro">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Otro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setStep('map')}>
              Volver
            </Button>
            <Button onClick={handleConfirmDetails}>
              Confirmar Dirección de Entrega
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}