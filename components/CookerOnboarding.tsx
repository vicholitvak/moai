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
  DollarSign,
  Store,
  User,
  Shield
} from 'lucide-react';
import { Timestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface CookerOnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  // Step 1: Basic Information
  displayName: string;
  phone: string;
  bio: string;
  businessType: 'restaurant' | 'particular';
  
  // Step 2: Kitchen Location
  location: {
    street: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Step 3: Business Profile  
  specialties: string[];
  customSpecialty: string;
  
  // Step 4: Working Hours & Settings
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  languages: string[];
  selfDelivery: boolean;
  
  // Step 5: Banking Information
  bankInfo: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string; // RUT for Chile
  };
}

const STEPS = [
  { id: 1, title: 'Información Personal', description: 'Cuéntanos sobre ti' },
  { id: 2, title: 'Ubicación de Cocina', description: 'Dónde preparas tus platos' },
  { id: 3, title: 'Especialidades', description: 'Tus especialidades culinarias' },
  { id: 4, title: 'Configuración', description: 'Horarios y preferencias' },
  { id: 5, title: 'Información de Pago', description: 'Para recibir tus ganancias' }
];

const SPECIALTIES = [
  'Italiana', 'Mexicana', 'China', 'Sushi', 'Peruana', 'Argentina', 'Vegetariana', 
  'Vegana', 'Panadería', 'Repostería', 'Burgers', 'Carnes', 'Mediterránea', 'Fusión'
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

const BANKS = [
  'Banco de Chile', 'BancoEstado', 'Santander', 'BCI', 'Scotiabank',
  'Banco Falabella', 'Banco Ripley', 'Itaú', 'BBVA', 'Banco Security'
];

export default function CookerOnboarding({ onComplete }: CookerOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: user?.displayName || '',
    phone: '',
    bio: '',
    businessType: 'particular',
    location: {
      street: '',
    },
    specialties: [],
    customSpecialty: '',
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    languages: ['Español'],
    selfDelivery: false,
    bankInfo: {
      accountHolderName: user?.displayName || '',
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    }
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
        ...(prev[parent as keyof OnboardingData] as object || {}),
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

  const addCustomSpecialty = () => {
    if (data.customSpecialty.trim() && !data.specialties.includes(data.customSpecialty.trim())) {
      setData(prev => ({
        ...prev,
        specialties: [...prev.specialties, prev.customSpecialty.trim()],
        customSpecialty: ''
      }));
      setShowCustomSpecialty(false);
      toast.success('Especialidad agregada exitosamente');
    }
  };

  const toggleLanguage = (language: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l: string) => l !== language)
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
        return !!(data.displayName && data.phone && data.bio && data.businessType);
      case 2:
        return !!(data.location.street);
      case 3:
        return !!(data.specialties.length > 0);
      case 4:
        return !!(data.workingDays.length > 0);
      case 5:
        return !!(data.bankInfo.accountHolderName && data.bankInfo.bankName && data.bankInfo.accountNumber && data.bankInfo.routingNumber);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      // Scroll to top of the page when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Por favor completa todos los campos requeridos');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    // Scroll to top of the page when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const now = Timestamp.now();
      
      const cookProfile = {
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
            city: '',
            state: '',
            zipCode: '',
            country: 'Chile',
            fullAddress: data.location.street
          },
          isActive: true,
          lastUpdated: now
        },
        deliveryRadius: 10, // Default 10km radius
        rating: 5.0,
        reviewCount: 0,
        totalOrders: 0,
        yearsExperience: 1,
        joinedDate: new Date().toISOString().split('T')[0],
        specialties: data.specialties,
        certifications: [],
        languages: ['Español'],
        cookingStyle: 'Casera',
        favoriteIngredients: [],
        achievements: [],
        bankInfo: {
          accountHolderName: data.bankInfo.accountHolderName,
          bankName: data.bankInfo.bankName,
          accountNumber: data.bankInfo.accountNumber,
          routingNumber: data.bankInfo.routingNumber
        },
        settings: {
          autoAcceptOrders: false,
          maxOrdersPerDay: 20,
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
      
      // Update user role to Cooker in Firestore directly
      try {
        await setDoc(doc(db, 'users', user.uid), { 
          role: 'Cooker',
          email: user.email,
          displayName: user.displayName || data.displayName,
          photoURL: user.photoURL
        }, { merge: true });
        
        toast.success('¡Perfil de cocinero creado exitosamente! Bienvenido a tu dashboard.');
      } catch (roleError) {
        console.error('Role update error:', roleError);
        toast.success('¡Perfil de cocinero creado exitosamente!');
      }
      
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
                  <Label htmlFor="displayName">Tu nombre o el de tu restaurante *</Label>
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
              
              {/* Business Type Selection */}
              <div>
                <Label className="text-base font-medium mb-4 block">Tipo de cocina *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      data.businessType === 'particular' 
                        ? 'ring-2 ring-moai-orange bg-orange-50 border-moai-orange' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => updateData('businessType', 'particular')}
                  >
                    <CardContent className="p-6 text-center">
                      <User className={`h-12 w-12 mx-auto mb-4 ${
                        data.businessType === 'particular' ? 'text-moai-orange' : 'text-gray-500'
                      }`} />
                      <h3 className={`font-bold text-lg mb-2 ${
                        data.businessType === 'particular' ? 'text-moai-orange' : 'text-gray-800'
                      }`}>
                        Cocinero Particular
                      </h3>
                      <p className="text-sm text-gray-600">
                        Cocino desde mi hogar para compartir recetas familiares y caseras
                      </p>
                      {data.businessType === 'particular' && (
                        <div className="mt-3">
                          <CheckCircle className="h-6 w-6 text-moai-orange mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      data.businessType === 'restaurant' 
                        ? 'ring-2 ring-moai-orange bg-orange-50 border-moai-orange' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => updateData('businessType', 'restaurant')}
                  >
                    <CardContent className="p-6 text-center">
                      <Store className={`h-12 w-12 mx-auto mb-4 ${
                        data.businessType === 'restaurant' ? 'text-moai-orange' : 'text-gray-500'
                      }`} />
                      <h3 className={`font-bold text-lg mb-2 ${
                        data.businessType === 'restaurant' ? 'text-moai-orange' : 'text-gray-800'
                      }`}>
                        Restaurante
                      </h3>
                      <p className="text-sm text-gray-600">
                        Represento un restaurante o negocio gastronómico establecido
                      </p>
                      {data.businessType === 'restaurant' && (
                        <div className="mt-3">
                          <CheckCircle className="h-6 w-6 text-moai-orange mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
              
              <div>
                <Label htmlFor="street">Dirección de la cocina *</Label>
                <Input
                  id="street"
                  value={data.location.street}
                  onChange={(e) => updateNestedData('location', 'street', e.target.value)}
                  placeholder="Calle, número, departamento, ciudad, región"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Incluye todos los detalles de la dirección (calle, número, comuna, ciudad, región)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Business Profile */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Especialidades Culinarias</h2>
                <p className="text-gray-600">Selecciona tus especialidades gastronómicas</p>
              </div>
              
              <div>
                <Label>Especialidades culinarias *</Label>
                <p className="text-sm text-gray-500 mb-3">Selecciona todas las que apliquen</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
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
                  
                  {/* Custom specialties that were added */}
                  {data.specialties.filter(specialty => !SPECIALTIES.includes(specialty)).map(specialty => (
                    <Badge
                      key={specialty}
                      variant="default"
                      className="cursor-pointer text-center justify-center py-2 bg-green-500 hover:bg-green-600"
                      onClick={() => toggleSpecialty(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                  
                  {/* Otro button */}
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-center justify-center py-2 border-dashed border-2 hover:bg-gray-50"
                    onClick={() => setShowCustomSpecialty(true)}
                  >
                    + Otro
                  </Badge>
                </div>
                
                {/* Custom specialty input */}
                {showCustomSpecialty && (
                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-3">
                      <Label htmlFor="customSpecialty">Agregar especialidad personalizada</Label>
                      <div className="flex gap-2">
                        <Input
                          id="customSpecialty"
                          value={data.customSpecialty}
                          onChange={(e) => updateData('customSpecialty', e.target.value)}
                          placeholder="Ej: Cocina Molecular, Cocina Nikkei..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomSpecialty();
                            }
                          }}
                        />
                        <Button onClick={addCustomSpecialty} size="sm">
                          Agregar
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowCustomSpecialty(false);
                            updateData('customSpecialty', '');
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
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
              
              {/* Self Delivery Option */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">¿Entregas tus propios pedidos? 🚚</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      !data.selfDelivery 
                        ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-500' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => updateData('selfDelivery', false)}
                  >
                    <CardContent className="p-6 text-center">
                      <Truck className={`h-12 w-12 mx-auto mb-4 ${
                        !data.selfDelivery ? 'text-orange-500' : 'text-gray-500'
                      }`} />
                      <h3 className={`font-bold text-lg mb-2 ${
                        !data.selfDelivery ? 'text-orange-500' : 'text-gray-800'
                      }`}>
                        Solo Cocinar
                      </h3>
                      <p className="text-sm text-gray-600">
                        Me enfoco en cocinar, otros conductores entregas mis pedidos
                      </p>
                      <div className="mt-3 text-xs text-gray-500">
                        • Más tiempo para cocinar<br/>
                        • Mayor volumen de pedidos<br/>
                        • Sin preocupación por entregas
                      </div>
                      {!data.selfDelivery && (
                        <div className="mt-3">
                          <CheckCircle className="h-6 w-6 text-orange-500 mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      data.selfDelivery 
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-500' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => updateData('selfDelivery', true)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center items-center mb-4">
                        <ChefHat className={`h-8 w-8 mr-2 ${
                          data.selfDelivery ? 'text-green-500' : 'text-gray-500'
                        }`} />
                        <Truck className={`h-8 w-8 ${
                          data.selfDelivery ? 'text-green-500' : 'text-gray-500'
                        }`} />
                      </div>
                      <h3 className={`font-bold text-lg mb-2 ${
                        data.selfDelivery ? 'text-green-500' : 'text-gray-800'
                      }`}>
                        Cocinar y Entregar
                      </h3>
                      <p className="text-sm text-gray-600">
                        Cocino y entrego mis propios pedidos para ganar más
                      </p>
                      <div className="mt-3 text-xs text-gray-500">
                        • Ganancias adicionales por entrega<br/>
                        • Control total del servicio<br/>
                        • Contacto directo con clientes
                      </div>
                      {data.selfDelivery && (
                        <div className="mt-3">
                          <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {data.selfDelivery && (
                  <Card className="mt-4 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">¡Gana más dinero!</p>
                          <p className="text-xs text-blue-600">Además del pago por cocinar, recibirás el valor de la entrega por cada pedido que lleves</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Banking Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Información de Pago</h2>
                <p className="text-gray-600">Para depositar tus ganancias de forma segura</p>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Pagos semanales</p>
                      <p className="text-xs text-green-600">Recibe tus ganancias cada viernes directamente en tu cuenta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="accountHolderName">Nombre del titular *</Label>
                  <Input
                    id="accountHolderName"
                    value={data.bankInfo.accountHolderName}
                    onChange={(e) => updateNestedData('bankInfo', 'accountHolderName', e.target.value)}
                    placeholder="Nombre completo como aparece en la cuenta"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bankName">Banco *</Label>
                  <Select onValueChange={(value) => updateNestedData('bankInfo', 'bankName', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      {BANKS.map(bank => (
                        <SelectItem key={bank} value={bank} className="bg-white hover:bg-gray-50 text-gray-900">{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="accountNumber">Número de cuenta *</Label>
                  <Input
                    id="accountNumber"
                    value={data.bankInfo.accountNumber}
                    onChange={(e) => updateNestedData('bankInfo', 'accountNumber', e.target.value)}
                    placeholder="Número de cuenta corriente"
                  />
                </div>
                
                <div>
                  <Label htmlFor="routingNumber">RUT *</Label>
                  <Input
                    id="routingNumber"
                    value={data.bankInfo.routingNumber}
                    onChange={(e) => updateNestedData('bankInfo', 'routingNumber', e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Tu información está protegida</p>
                      <p className="text-xs text-blue-600">Usamos encriptación bancaria para proteger tus datos financieros</p>
                    </div>
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