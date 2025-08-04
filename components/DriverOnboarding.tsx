'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DriversService, type Driver } from '@/lib/firebase/dataService';
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
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Camera, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  FileText,
  CreditCard,
  Shield,
  Calendar,
  Navigation,
  Bike,
  Car,
  Zap,
  Upload,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface DriverOnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  // Step 1: Personal Information
  displayName: string;
  phone: string;
  
  // Step 2: Vehicle Information
  vehicleType: 'bike' | 'moto' | 'car';
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  };
  
  // Step 3: Documentation
  documents: {
    driverLicense: string; // Base64 or URL
    vehicleRegistration: string; // Base64 or URL
    insuranceProof: string; // Base64 or URL
  };
  
  // Step 4: Working Preferences
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  preferredAreas: string[];
  
  // Step 5: Payment Information
  bankInfo: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string; // RUT for Chile
  };
}

const STEPS = [
  { id: 1, title: 'Información Personal', description: 'Datos básicos de contacto' },
  { id: 2, title: 'Vehículo', description: 'Información de tu vehículo' },
  { id: 3, title: 'Preferencias', description: 'Horarios y áreas de trabajo' },
  { id: 4, title: 'Pago', description: 'Información bancaria' }
];

const VEHICLE_TYPES = [
  {
    id: 'bike' as const,
    name: 'Bici',
    icon: Bike,
    mapIcon: '🚴‍♂️',
    color: 'bg-green-100 border-green-300 text-green-800'
  },
  {
    id: 'moto' as const,
    name: 'Moto',
    icon: Zap,
    mapIcon: '🏍️',
    color: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    id: 'car' as const,
    name: 'Auto',
    icon: Car,
    mapIcon: '🚗',
    color: 'bg-purple-100 border-purple-300 text-purple-800'
  }
];

const WORKING_DAYS = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
];

const POPULAR_AREAS = [
  'Centro', 'Licanantai', 'Solor', 'Sequitor', 'Yaye', 
  'Checar',
];

const BANKS = [
  'Banco de Chile', 'BancoEstado', 'Santander', 'BCI', 'Scotiabank',
  'Banco Falabella', 'Banco Ripley', 'Itaú', 'BBVA', 'Banco Security'
];

export default function DriverOnboarding({ onComplete }: DriverOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: user?.displayName || '',
    phone: '',
    vehicleType: 'moto',
    vehicleInfo: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      color: ''
    },
    documents: {
      driverLicense: '',
      vehicleRegistration: '',
      insuranceProof: ''
    },
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    preferredAreas: [],
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
        ...prev[parent as keyof OnboardingData],
        [field]: value
      }
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

  const togglePreferredArea = (area: string) => {
    setData(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.includes(area)
        ? prev.preferredAreas.filter(a => a !== area)
        : [...prev.preferredAreas, area]
    }));
  };

  const handleFileUpload = (documentType: keyof OnboardingData['documents'], file: File) => {
    // In a real app, you'd upload to cloud storage
    // For now, we'll just store a placeholder
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateNestedData('documents', documentType, base64);
      toast.success('Documento subido correctamente');
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(data.displayName && data.phone);
      case 2:
        return !!(data.vehicleType);
      case 3:
        return !!(data.workingDays.length > 0);
      case 4:
        return !!(data.bankInfo.accountHolderName && data.bankInfo.bankName && data.bankInfo.accountNumber);
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
      
      const driverProfile: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> = {
        displayName: data.displayName,
        email: user.email || '',
        avatar: user.photoURL || '',
        phone: data.phone,
        vehicleType: data.vehicleType,
        vehicleInfo: data.vehicleInfo,
        currentLocation: {
          coordinates: {
            latitude: 0,
            longitude: 0,
            timestamp: now
          },
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Chile',
            fullAddress: ''
          },
          isActive: false,
          lastUpdated: now
        },
        isOnline: false,
        isAvailable: false,
        rating: 5.0,
        reviewCount: 0,
        totalDeliveries: 0,
        completionRate: 100,
        earnings: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          total: 0
        },
        workingHours: data.workingHours,
        workingDays: data.workingDays,
        lastLocationUpdate: now
      };

      // Create driver profile with specific user ID
      const success = await DriversService.createDriverProfile(driverProfile, user.uid);
      
      if (!success) {
        throw new Error('Failed to create driver profile');
      }
      
      // Update user role to Driver
      await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Driver' })
      });

      toast.success('¡Perfil de conductor creado exitosamente!');
      onComplete();
      
    } catch (error) {
      console.error('Error creating driver profile:', error);
      toast.error('Error al crear el perfil. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === data.vehicleType)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="bg-white rounded-t-xl p-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">¡Únete como Conductor! 🚗</h1>
              <p className="text-gray-600">Comienza a ganar dinero entregando pedidos</p>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between overflow-x-auto px-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-2 sm:ml-3 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium truncate ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate hidden sm:block">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-2 sm:mx-4 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-b-xl p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Información Personal</h2>
                <p className="text-gray-600">Cuéntanos quién eres para comenzar</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="displayName">Nombre completo *</Label>
                  <Input
                    id="displayName"
                    value={data.displayName}
                    onChange={(e) => updateData('displayName', e.target.value)}
                    placeholder="Tu nombre como aparecerá para los clientes"
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

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Tu información está segura</p>
                      <p className="text-xs text-blue-600">Solo se compartirá lo necesario para las entregas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu Vehículo</h2>
                <p className="text-gray-600">Selecciona tu método de entrega</p>
              </div>
              
              {/* Vehicle Type Selection */}
              <div>
                <Label className="text-2xl font-bold mb-8 block text-center text-gray-800">¡Elige tu vehículo de entrega!</Label>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 max-w-6xl mx-auto px-2 sm:px-4">
                  {VEHICLE_TYPES.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        data.vehicleType === vehicle.id 
                          ? 'scale-105' 
                          : 'hover:shadow-2xl'
                      }`}
                      onClick={() => updateData('vehicleType', vehicle.id)}
                    >
                      <Card 
                        className={`relative overflow-hidden border-4 transition-all duration-300 ${
                          data.vehicleType === vehicle.id 
                            ? 'ring-4 ring-moai-orange ring-opacity-50 border-moai-orange bg-gradient-to-br from-orange-50 to-orange-100 shadow-2xl' 
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-xl'
                        }`}
                      >
                        {/* Selection indicator */}
                        {data.vehicleType === vehicle.id && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="bg-moai-orange text-white rounded-full p-2">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                          </div>
                        )}
                        
                        <CardContent className="p-3 sm:p-6 md:p-8 text-center relative">
                          {/* Large emoji icon */}
                          <div className="text-4xl sm:text-6xl md:text-8xl mb-2 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                            {vehicle.mapIcon}
                          </div>
                          
                          {/* Lucide icon as accent */}
                          <vehicle.icon className={`h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mx-auto mb-2 sm:mb-4 transition-colors duration-300 ${
                            data.vehicleType === vehicle.id ? 'text-moai-orange' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          
                          {/* Vehicle name */}
                          <h3 className={`font-bold text-sm sm:text-lg md:text-2xl mb-1 sm:mb-3 transition-colors duration-300 ${
                            data.vehicleType === vehicle.id ? 'text-moai-orange' : 'text-gray-800'
                          }`}>
                            {vehicle.name}
                          </h3>
                          
                          {/* Description */}
                          {vehicle.description && (
                            <p className={`text-xs sm:text-sm md:text-base mb-2 sm:mb-4 font-medium transition-colors duration-300 ${
                              data.vehicleType === vehicle.id ? 'text-orange-700' : 'text-gray-600'
                            }`}>
                              {vehicle.description}
                            </p>
                          )}
                          
                          {/* Benefits */}
                          {vehicle.benefits && vehicle.benefits.length > 0 && (
                            <div className="space-y-1 sm:space-y-2 hidden sm:block">
                              {vehicle.benefits.map((benefit, index) => (
                              <div key={index} className={`flex items-center justify-center text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                data.vehicleType === vehicle.id ? 'text-orange-600' : 'text-gray-500'
                              }`}>
                                <CheckCircle className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-colors duration-300 ${
                                  data.vehicleType === vehicle.id ? 'text-green-600' : 'text-green-500'
                                }`} />
                                {benefit}
                              </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Action indicator */}
                          <div className={`mt-2 sm:mt-6 py-2 sm:py-3 px-2 sm:px-6 rounded-full font-bold text-xs sm:text-sm md:text-lg transition-all duration-300 ${
                            data.vehicleType === vehicle.id 
                              ? 'bg-moai-orange text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                          }`}>
                            {data.vehicleType === vehicle.id ? '¡Seleccionado!' : 'Seleccionar'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Step 3: Working Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferencias de Trabajo</h2>
                <p className="text-gray-600">Define cuándo y dónde quieres trabajar</p>
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
                  <Label>Hora de término</Label>
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
                          ? 'bg-blue-500 hover:bg-blue-600' 
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
                <Label>Áreas preferidas (opcional)</Label>
                <p className="text-sm text-gray-500 mb-3">Selecciona las comunas donde prefieres trabajar</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {POPULAR_AREAS.map(area => (
                    <Badge
                      key={area}
                      variant={data.preferredAreas.includes(area) ? "default" : "outline"}
                      className={`cursor-pointer text-center justify-center py-2 ${
                        data.preferredAreas.includes(area) 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => togglePreferredArea(area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment Information */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Información de Pago</h2>
                <p className="text-gray-600">Para depositar tus ganancias</p>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Pagos semanales</p>
                      <p className="text-xs text-green-600">Recibe tus ganancias cada viernes</p>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
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
                className="bg-blue-500 hover:bg-blue-600"
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