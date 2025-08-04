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
  ChefHat, 
  DollarSign, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  Check,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface BecomeCookerButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showDialog?: boolean;
}

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Gana dinero extra',
    description: 'Monetiza tu pasión por la cocina y genera ingresos desde casa'
  },
  {
    icon: Clock,
    title: 'Horarios flexibles',
    description: 'Trabaja cuando quieras, define tus propios horarios'
  },
  {
    icon: Users,
    title: 'Conecta con tu comunidad',
    description: 'Comparte tu comida con vecinos y haz nuevas conexiones'
  },
  {
    icon: TrendingUp,
    title: 'Haz crecer tu negocio',
    description: 'Desarrolla tu marca personal y expande tu alcance'
  }
];

const FEATURES = [
  'Panel de control intuitivo para gestionar pedidos',
  'Sistema de pagos automático y seguro',
  'Herramientas de marketing integradas',
  'Soporte 24/7 para cocineros',
  'Análisis detallados de ventas',
  'Sin costos de instalación'
];

export default function BecomeCookerButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  showDialog = true 
}: BecomeCookerButtonProps) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBecomeCooker = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero');
      router.push('/login');
      return;
    }

    if (role === 'Cooker') {
      toast.info('Ya eres un cocinero registrado');
      router.push('/cooker/dashboard');
      return;
    }

    setIsProcessing(true);

    try {
      // Update user role to Cooker
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Cooker' })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success('¡Bienvenido al equipo de cocineros! Te redirigiremos para completar tu perfil.');
      
      // Close dialog and redirect to cooker dashboard (which will show onboarding)
      setIsOpen(false);
      
      // Small delay to allow toast to show
      setTimeout(() => {
        router.push('/cooker/dashboard');
        // Force a page refresh to update the auth context
        window.location.href = '/cooker/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Error becoming cooker:', error);
      toast.error('Error al registrarte como cocinero. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ButtonContent = () => (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={showDialog ? undefined : handleBecomeCooker}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Procesando...
        </>
      ) : (
        <>
          <ChefHat className="h-4 w-4 mr-2" />
          Conviértete en Cocinero
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
            🍽️ ¡Únete a la Comunidad de Cocineros Moai!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Transforma tu pasión por la cocina en una oportunidad de negocio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Hero Section */}
          <div className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8">
            <ChefHat className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Comparte tu talento culinario con el mundo
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              En Moai, valoramos la comida casera y auténtica. Como cocinero de nuestra plataforma, 
              tendrás la oportunidad de monetizar tus habilidades culinarias mientras conectas con 
              tu comunidad local.
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
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <benefit.icon className="h-6 w-6 text-orange-600" />
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

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Lo que incluye tu membresía
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

          {/* Stats */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-center mb-4">Nuestra comunidad en números</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">500+</div>
                <div className="text-sm text-gray-600">Cocineros activos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">10,000+</div>
                <div className="text-sm text-gray-600">Pedidos completados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">4.8★</div>
                <div className="text-sm text-gray-600">Calificación promedio</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              El registro es <strong>gratuito</strong> y solo toma unos minutos
            </p>
            <Button 
              onClick={handleBecomeCooker} 
              disabled={isProcessing}
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando registro...
                </>
              ) : (
                <>
                  ¡Comenzar ahora!
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