'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CooksService, type Cook } from '@/lib/firebase/dataService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChefHat, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Camera, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  Globe,
  Utensils,
  Award,
  Truck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface CookerOnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  // Step 1: Basic Information
  displayName: string;
  phone: string;
  bio: string;
  
  // Step 2: Kitchen Location
  location: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Step 3: Business Profile  
  yearsExperience: number;
  specialties: string[];
  cookingStyle: string;
  languages: string[];
  
  // Step 4: Working Hours & Settings
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  maxOrdersPerDay: number;
  deliveryRadius: number;
  selfDelivery: boolean;
}

const STEPS = [
  { id: 1, title: 'Información Personal', description: 'Cuéntanos sobre ti' },
  { id: 2, title: 'Ubicación de Cocina', description: 'Dónde preparas tus platos' },
  { id: 3, title: 'Perfil Culinario', description: 'Tu experiencia y especialidades' },
  { id: 4, title: 'Configuración', description: 'Horarios y preferencias' }
];

const SPECIALTIES = [
  'Italiana', 'Mexicana', 'China', 'Japonesa', 'Peruana', 'Argentina', 'Vegetariana', 
  'Vegana', 'Panadería', 'Repostería', 'Mariscos', 'Carnes', 'Mediterránea', 'Fusión'
];

const COOKING_STYLES = [
  'Tradicional', 'Moderna', 'Fusión', 'Gourmet', 'Casera', 'Saludable', 'Orgánica'
];

const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Italiano', 'Francés', 'Alemán'];

const WORKING_DAYS = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
];

export default function CookerOnboarding({ onComplete }: CookerOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: user?.displayName || '',
    phone: '',
    bio: '',
    location: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    yearsExperience: 1,
    specialties: [],
    cookingStyle: '',
    languages: ['Español'],
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    maxOrdersPerDay: 10,
    deliveryRadius: 5,
    selfDelivery: false
  });

  const updateData = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedData = (parent: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof OnboardingData],
        [field]: value
      }
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const toggleLanguage = (language: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateNestedData('location', 'coordinates', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('Ubicación obtenida exitosamente');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('No se pudo obtener la ubicación');
        }
      );
    } else {
      toast.error('Geolocalización no soportada en este navegador');
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(data.displayName && data.phone && data.bio);
      case 2:
        return !!(data.location.street && data.location.city && data.location.state);
      case 3:
        return !!(data.specialties.length > 0 && data.cookingStyle);
      case 4:
        return !!(data.workingDays.length > 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Por favor completa todos los campos requeridos');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const now = Timestamp.now();
      
      const cookProfile: Omit<Cook, 'id' | 'createdAt' | 'updatedAt'> = {
        displayName: data.displayName,
        email: user.email || '',
        avatar: user.photoURL || '',
        coverImage: '',
        bio: data.bio,
        story: '',
        location: {
          coordinates: {
            latitude: data.location.coordinates?.latitude || 0,
            longitude: data.location.coordinates?.longitude || 0,
            timestamp: now
          },
          address: {
            street: data.location.street,
            city: data.location.city,
            state: data.location.state,
            zipCode: data.location.zipCode,
            country: 'Chile',
            fullAddress: `${data.location.street}, ${data.location.city}, ${data.location.state}`
          },
          isActive: true,
          lastUpdated: now
        },
        deliveryRadius: data.deliveryRadius,
        rating: 5.0,
        reviewCount: 0,
        totalOrders: 0,
        yearsExperience: data.yearsExperience,
        joinedDate: new Date().toISOString().split('T')[0],
        specialties: data.specialties,
        certifications: [],
        languages: data.languages,
        cookingStyle: data.cookingStyle,
        favoriteIngredients: [],
        achievements: [],
        settings: {
          autoAcceptOrders: false,
          maxOrdersPerDay: data.maxOrdersPerDay,
          workingHours: data.workingHours,
          workingDays: data.workingDays,
          currency: 'CLP',
          timezone: 'America/Santiago',
          language: 'es',
          lastLocationUpdate: now,
          selfDelivery: data.selfDelivery
        }
      };

      // Create cook profile with specific user ID
      await CooksService.createCookProfileWithId(user.uid, cookProfile);
      
      // Update user role to Cooker
      await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Cooker' })
      });

      toast.success('¡Perfil de cocinero creado exitosamente!');
      onComplete();
      
    } catch (error) {
      console.error('Error creating cook profile:', error);
      toast.error('Error al crear el perfil. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="bg-white rounded-t-xl p-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido a Moai! 🍽️</h1>
              <p className="text-gray-600">Configuremos tu perfil de cocinero</p>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-orange-600' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-b-xl p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Información Personal</h2>
                <p className="text-gray-600">Cuéntanos quién eres y qué te apasiona de la cocina</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="displayName">Nombre completo *</Label>
                  <Input
                    id="displayName"
                    value={data.displayName}
                    onChange={(e) => updateData('displayName', e.target.value)}
                    placeholder="Tu nombre como aparecerá en los pedidos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Número de teléfono *</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Cuéntanos sobre ti *</Label>
                <Textarea
                  id="bio"
                  value={data.bio}
                  onChange={(e) => updateData('bio', e.target.value)}
                  placeholder="Describe tu experiencia culinaria, tu pasión por la cocina, y qué hace especial tu comida..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Esta información aparecerá en tu perfil público
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Kitchen Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ubicación de tu Cocina</h2>
                <p className="text-gray-600">Necesitamos saber dónde preparas tus deliciosos platos</p>
              </div>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">¿Por qué necesitamos tu ubicación?</p>
                      <p className="text-xs text-blue-600">Para calcular tiempos de entrega y mostrar tus platos a clientes cercanos</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={getCurrentLocation}>
                      <Globe className="h-4 w-4 mr-2" />
                      Obtener ubicación
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Dirección de la cocina *</Label>
                  <Input
                    id="street"
                    value={data.location.street}
                    onChange={(e) => updateNestedData('location', 'street', e.target.value)}
                    placeholder="Calle, número, departamento"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={data.location.city}
                    onChange={(e) => updateNestedData('location', 'city', e.target.value)}
                    placeholder="Santiago"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">Región *</Label>
                  <Select onValueChange={(value) => updateNestedData('location', 'state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Metropolitana">Región Metropolitana</SelectItem>
                      <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                      <SelectItem value="Biobío">Biobío</SelectItem>
                      <SelectItem value="La Araucanía">La Araucanía</SelectItem>
                      <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="zipCode">Código postal</Label>
                  <Input
                    id="zipCode"
                    value={data.location.zipCode}
                    onChange={(e) => updateNestedData('location', 'zipCode', e.target.value)}
                    placeholder="1234567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryRadius">Radio de entrega (km)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    min="1"
                    max="50"
                    value={data.deliveryRadius}
                    onChange={(e) => updateData('deliveryRadius', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Profile */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu Perfil Culinario</h2>
                <p className="text-gray-600">Muéstranos tu experiencia y especialidades</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Años de experiencia</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={data.yearsExperience}
                    onChange={(e) => updateData('yearsExperience', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label>Estilo de cocina</Label>
                  <Select onValueChange={(value) => updateData('cookingStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {COOKING_STYLES.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Especialidades culinarias *</Label>
                <p className="text-sm text-gray-500 mb-3">Selecciona todas las que apliquen</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SPECIALTIES.map(specialty => (
                    <Badge
                      key={specialty}
                      variant={data.specialties.includes(specialty) ? "default" : "outline"}
                      className={`cursor-pointer text-center justify-center py-2 ${
                        data.specialties.includes(specialty) 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleSpecialty(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Idiomas que hablas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {LANGUAGES.map(language => (
                    <Badge
                      key={language}
                      variant={data.languages.includes(language) ? "default" : "outline"}
                      className={`cursor-pointer text-center justify-center py-2 ${
                        data.languages.includes(language) 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleLanguage(language)}
                    >
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Working Hours & Settings */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Trabajo</h2>
                <p className="text-gray-600">Define tus horarios y preferencias de trabajo</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={data.workingHours.start}
                    onChange={(e) => updateNestedData('workingHours', 'start', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Hora de cierre</Label>
                  <Input
                    type="time"
                    value={data.workingHours.end}
                    onChange={(e) => updateNestedData('workingHours', 'end', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label>Días de trabajo *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {WORKING_DAYS.map(day => (
                    <Badge
                      key={day.id}
                      variant={data.workingDays.includes(day.id) ? "default" : "outline"}
                      className={`cursor-pointer text-center justify-center py-2 ${
                        data.workingDays.includes(day.id) 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleWorkingDay(day.id)}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Máximo de pedidos por día</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={data.maxOrdersPerDay}
                  onChange={(e) => updateData('maxOrdersPerDay', parseInt(e.target.value))}
                />
              </div>
              
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">¿Entregas tus propios pedidos?</p>
                        <p className="text-xs text-yellow-600">Si tienes vehículo puedes entregar y ganar más</p>
                      </div>
                    </div>
                    <Switch
                      checked={data.selfDelivery}
                      onCheckedChange={(checked) => updateData('selfDelivery', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(currentStep)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando perfil...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ¡Completar registro!
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}