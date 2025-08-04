'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  DollarSign, 
  Clock, 
  Navigation, 
  Users, 
  TrendingUp,
  Check,
  ArrowRight,
  MapPin,
  Shield,
  Zap,
  Bike,
  Car
} from 'lucide-react';
import { toast } from 'sonner';

interface BecomeDriverButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showDialog?: boolean;
}

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Gana hasta $150.000 semanales',
    description: 'Ingresos competitivos con bonificaciones por entregas'
  },
  {
    icon: Clock,
    title: 'Horarios 100% flexibles',
    description: 'Trabaja cuando quieras, por las horas que quieras'
  },
  {
    icon: Navigation,
    title: 'Rutas optimizadas',
    description: 'GPS inteligente para entregas más eficientes'
  },
  {
    icon: Shield,
    title: 'Seguro incluido',
    description: 'Cobertura completa durante tus entregas'
  }
];

const VEHICLE_OPTIONS = [
  {
    icon: Bike,
    name: 'Bicicleta',
    emoji: '🚴‍♂️',
    earnings: '$80-100k',
    description: 'Ideal para entregas urbanas cercanas',
    benefits: ['Sin gastos de combustible', 'Ejercicio mientras trabajas', 'Acceso a ciclovías']
  },
  {
    icon: Zap,
    name: 'Motocicleta',
    emoji: '🏍️',
    earnings: '$120-150k',
    description: 'Perfecto equilibrio velocidad-eficiencia',
    benefits: ['Mayor radio de cobertura', 'Entregas más rápidas', 'Menos tráfico']
  },
  {
    icon: Car,
    name: 'Automóvil',
    emoji: '🚗',
    earnings: '$100-130k',
    description: 'Para pedidos grandes y mayor comodidad',
    benefits: ['Pedidos de mayor volumen', 'Protección climática', 'Más comodidad']
  }
];

const FEATURES = [
  'Pagos semanales directos a tu cuenta',
  'App móvil fácil de usar',
  'Soporte 24/7 para conductores',
  'Bonificaciones por rendimiento',
  'Sistema de propinas integrado',
  'Comunidad de conductores activa'
];

export default function BecomeDriverButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  showDialog = true 
}: BecomeDriverButtonProps) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBecomeDriver = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero');
      router.push('/login');
      return;
    }

    if (role === 'Driver') {
      toast.info('Ya eres un conductor registrado');
      router.push('/driver/dashboard');
      return;
    }

    setIsProcessing(true);

    try {
      // Update user role to Driver
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Driver' })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success('¡Bienvenido al equipo de conductores! Te redirigiremos para completar tu perfil.');
      
      // Close dialog and redirect to driver dashboard (which will show onboarding)
      setIsOpen(false);
      
      // Small delay to allow toast to show
      setTimeout(() => {
        router.push('/driver/dashboard');
        // Force a page refresh to update the auth context
        window.location.href = '/driver/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Error becoming driver:', error);
      toast.error('Error al registrarte como conductor. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ButtonContent = () => (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={showDialog ? undefined : handleBecomeDriver}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Procesando...
        </>
      ) : (
        <>
          <Truck className="h-4 w-4 mr-2" />
          Conviértete en Conductor
        </>
      )}
    </Button>
  );

  if (!showDialog) {
    return <ButtonContent />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ButtonContent />
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2">
            🚗 ¡Conduce y Gana con Moai!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Únete a cientos de conductores que ya están generando ingresos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Hero Section */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <Truck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Gana dinero en tu tiempo libre
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conviértete en conductor partner de Moai y comienza a generar ingresos entregando 
              deliciosa comida casera. Tu vehículo, tus horarios, tus ganancias.
            </p>
          </div>

          {/* Benefits Grid */}
          <div>
            <h4 className="text-xl font-bold text-center mb-6">¿Por qué elegir Moai?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BENEFITS.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <benefit.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">{benefit.title}</h5>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Vehicle Options */}
          <div>
            <h4 className="text-xl font-bold text-center mb-6">Elige tu vehículo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {VEHICLE_OPTIONS.map((vehicle, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{vehicle.emoji}</div>
                    <vehicle.icon className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h5 className="font-bold text-lg mb-1">{vehicle.name}</h5>
                    <Badge variant="outline" className="mb-3 bg-green-50 text-green-700">
                      {vehicle.earnings}/semana
                    </Badge>
                    <p className="text-sm text-gray-600 mb-3">{vehicle.description}</p>
                    <div className="space-y-1">
                      {vehicle.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center text-xs text-gray-500 justify-center">
                          <Check className="h-3 w-3 text-green-500 mr-1" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Lo que incluye ser conductor Moai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-center">¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h6 className="font-medium mb-1">Regístrate</h6>
                  <p className="text-xs text-gray-600">Completa tu perfil y sube tus documentos</p>
                </div>
                <div>
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h6 className="font-medium mb-1">Ponte en línea</h6>
                  <p className="text-xs text-gray-600">Activa tu disponibilidad cuando quieras trabajar</p>
                </div>
                <div>
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h6 className="font-medium mb-1">Recibe pedidos</h6>
                  <p className="text-xs text-gray-600">Acepta los pedidos que más te convengan</p>
                </div>
                <div>
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">4</span>
                  </div>
                  <h6 className="font-medium mb-1">Gana dinero</h6>
                  <p className="text-xs text-gray-600">Recibe tus ganancias cada viernes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-center mb-4">Nuestra comunidad en números</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">300+</div>
                <div className="text-sm text-gray-600">Conductores activos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">15,000+</div>
                <div className="text-sm text-gray-600">Entregas completadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">4.9★</div>
                <div className="text-sm text-gray-600">Calificación conductores</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              El registro es <strong>gratuito</strong> y puedes empezar a ganar hoy mismo
            </p>
            <Button 
              onClick={handleBecomeDriver} 
              disabled={isProcessing}
              size="lg" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando registro...
                </>
              ) : (
                <>
                  ¡Empezar a conducir!
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}