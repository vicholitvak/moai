'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ChefHat, 
  Truck, 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  Star,
  CheckCircle,
  ArrowRight,
  X,
  Utensils,
  Clock,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

// Onboarding steps by role
const ONBOARDING_STEPS = {
  Client: [
    {
      id: 'welcome',
      title: '¡Bienvenido a LicanÑam!',
      description: 'Descubre comida casera auténtica de cocineros locales',
      icon: ShoppingBag,
      content: {
        title: 'Tu aventura culinaria comienza aquí',
        points: [
          '🍽️ Comida casera de cocineros verificados',
          '📱 Seguimiento en tiempo real de tus pedidos',
          '⭐ Sistema de calificaciones y reviews',
          '💳 Pagos seguros y flexibles'
        ]
      }
    },
    {
      id: 'browse',
      title: 'Explora y Ordena',
      description: 'Encuentra tu próxima comida favorita',
      icon: Utensils,
      content: {
        title: 'Cómo hacer tu primer pedido',
        points: [
          '🔍 Busca por tipo de comida, cocinero o ubicación',
          '👨‍🍳 Revisa perfiles de cocineros y sus calificaciones',
          '🛒 Agrega platos a tu carrito',
          '📍 Confirma tu dirección de entrega'
        ]
      }
    },
    {
      id: 'track',
      title: 'Seguimiento en Tiempo Real',
      description: 'Mantente informado del estado de tu pedido',
      icon: MapPin,
      content: {
        title: 'Nunca pierdas de vista tu comida',
        points: [
          '👀 Seguimiento en vivo del conductor',
          '⏰ Tiempos de entrega estimados precisos',
          '📲 Notificaciones en cada etapa',
          '💬 Chat directo con cocinero y conductor'
        ]
      }
    }
  ],
  Cooker: [
    {
      id: 'welcome',
      title: '¡Bienvenido Chef!',
      description: 'Comparte tu pasión culinaria y genera ingresos',
      icon: ChefHat,
      content: {
        title: 'Convierte tu cocina en un negocio',
        points: [
          '🏠 Cocina desde la comodidad de tu hogar',
          '💰 Establece tus propios precios',
          '📊 Panel de control completo',
          '👥 Construye tu base de clientes fieles'
        ]
      }
    },
    {
      id: 'setup',
      title: 'Configura tu Perfil',
      description: 'Crea un perfil atractivo para atraer clientes',
      icon: Users,
      content: {
        title: 'Tu perfil es tu carta de presentación',
        points: [
          '📸 Agrega fotos atractivas de tus platos',
          '📝 Describe tu estilo culinario único',
          '🕒 Establece tus horarios de disponibilidad',
          '📍 Confirma tu zona de cobertura'
        ]
      }
    },
    {
      id: 'orders',
      title: 'Gestiona tus Pedidos',
      description: 'Herramientas para manejar eficientemente tus órdenes',
      icon: Clock,
      content: {
        title: 'Control total de tu negocio',
        points: [
          '📋 Dashboard en tiempo real de pedidos',
          '⏱️ Gestión de tiempos de preparación',
          '💬 Comunicación directa con clientes',
          '📈 Estadísticas y analytics detallados'
        ]
      }
    }
  ],
  Driver: [
    {
      id: 'welcome',
      title: '¡Bienvenido Conductor!',
      description: 'Gana dinero con horarios flexibles',
      icon: Truck,
      content: {
        title: 'La libertad de trabajar cuando quieras',
        points: [
          '🚗 Usa tu propio vehículo',
          '💵 Pagos inmediatos después de cada entrega',
          '📱 App intuitiva para conductores',
          '🗺️ Rutas optimizadas automáticamente'
        ]
      }
    },
    {
      id: 'vehicle',
      title: 'Configura tu Vehículo',
      description: 'Registro y verificación de tu medio de transporte',
      icon: MapPin,
      content: {
        title: 'Preparación para las entregas',
        points: [
          '🚗 Registra tu vehículo y documentación',
          '📄 Verifica tu licencia de conducir',
          '📍 Establece tu zona de operación',
          '🔒 Completa verificación de seguridad'
        ]
      }
    },
    {
      id: 'delivery',
      title: 'Realiza Entregas',
      description: 'Todo lo que necesitas saber para entregar',
      icon: CheckCircle,
      content: {
        title: 'Conviértete en un conductor estrella',
        points: [
          '📱 Acepta pedidos en tu zona',
          '🗺️ Navegación paso a paso',
          '📸 Confirmación fotográfica de entrega',
          '⭐ Mantén una alta calificación'
        ]
      }
    }
  ]
};

export default function OnboardingGuide({ isOpen, onClose, userRole }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  
  const steps = userRole ? ONBOARDING_STEPS[userRole as keyof typeof ONBOARDING_STEPS] || [] : [];
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed and close
      if (typeof window !== 'undefined') {
        localStorage.setItem('licannam-onboarding-completed', 'true');
      }
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('licannam-onboarding-skipped', 'true');
    }
    onClose();
  };

  if (!currentStepData) return null;

  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden border-2 border-atacama-beige/20 shadow-2xl bg-white p-0"
        hideClose
      >
        {/* Custom close button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 sm:right-4 sm:top-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-50 bg-white shadow-sm"
          aria-label="Cerrar onboarding"
        >
          <X className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500" />
        </button>

        <div className="p-3 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pr-10 sm:pr-0">
            <div className="flex space-x-1 sm:space-x-2 flex-wrap">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-atacama-orange'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0 whitespace-nowrap ml-2">
              {currentStep + 1} de {steps.length}
            </Badge>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-none overflow-hidden">
                <CardHeader className="text-center pb-3 sm:pb-4 px-1 sm:px-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-atacama-orange to-orange-600 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center shrink-0">
                    <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-bold text-atacama-brown px-2 break-words">
                    {currentStepData.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-lg text-atacama-brown/70 mt-1 px-2 break-words">
                    {currentStepData.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-6 px-1 sm:px-6">
                  <div className="text-center">
                    <h3 className="text-sm sm:text-xl font-semibold text-atacama-brown mb-2 sm:mb-4 px-2 break-words">
                      {currentStepData.content.title}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {currentStepData.content.points.map((point, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg overflow-hidden"
                        >
                          <div className="text-sm sm:text-lg shrink-0">{point.split(' ')[0]}</div>
                          <div className="text-[11px] sm:text-sm text-atacama-brown/80 text-left break-words flex-1 min-w-0">
                            {point.substring(point.indexOf(' ') + 1)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Special content for different roles */}
                  {userRole === 'Client' && currentStep === 0 && (
                    <div className="bg-blue-50 p-2 sm:p-4 rounded-lg overflow-hidden">
                      <h4 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-xs sm:text-base break-words">💡 Consejo:</h4>
                      <p className="text-[11px] sm:text-sm text-blue-800 break-words">
                        Empieza explorando cocineros cerca de ti. Cada cocinero tiene su especialidad única.
                      </p>
                    </div>
                  )}

                  {userRole === 'Cooker' && currentStep === 1 && (
                    <div className="bg-green-50 p-2 sm:p-4 rounded-lg overflow-hidden">
                      <h4 className="font-semibold text-green-900 mb-1 sm:mb-2 text-xs sm:text-base break-words">🎯 Importante:</h4>
                      <p className="text-[11px] sm:text-sm text-green-800 break-words">
                        Las fotos de alta calidad aumentan tus ventas hasta en un 60%. ¡Invierte tiempo en buenas imágenes!
                      </p>
                    </div>
                  )}

                  {userRole === 'Driver' && currentStep === 1 && (
                    <div className="bg-purple-50 p-2 sm:p-4 rounded-lg overflow-hidden">
                      <h4 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-xs sm:text-base break-words">📋 Requisitos:</h4>
                      <p className="text-[11px] sm:text-sm text-purple-800 break-words">
                        Necesitas licencia vigente, seguro del vehículo y completar verificación de antecedentes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 mt-4 sm:mt-8">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="text-atacama-brown/70 text-xs sm:text-base h-9 sm:h-10"
            >
              Anterior
            </Button>

            <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-none">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-atacama-brown border-atacama-beige/40 flex-1 sm:flex-none text-xs sm:text-base h-9 sm:h-10 whitespace-nowrap"
              >
                Saltar
              </Button>

              <Button
                onClick={handleNext}
                className="bg-atacama-orange hover:bg-atacama-orange/90 text-white flex-1 sm:flex-none text-xs sm:text-base h-9 sm:h-10 whitespace-nowrap"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden xs:inline">¡Empezar!</span>
                    <span className="xs:hidden">Empezar</span>
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding should be shown
export function useOnboardingCheck() {
  const { user, role } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user || !role) return;

    const hasCompletedOnboarding = localStorage.getItem('licannam-onboarding-completed');
    const hasSkippedOnboarding = localStorage.getItem('licannam-onboarding-skipped');
    
    // Show onboarding for new users who haven't completed or skipped it
    if (!hasCompletedOnboarding && !hasSkippedOnboarding) {
      // Add a small delay to ensure the user is fully authenticated
      const timer = setTimeout(() => {
        setShouldShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, role]);

  const closeOnboarding = () => {
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    closeOnboarding,
    userRole: role
  };
}