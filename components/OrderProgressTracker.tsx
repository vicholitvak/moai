'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  ChefHat, 
  Package, 
  Truck, 
  MapPin,
  Timer,
  AlertCircle
} from 'lucide-react';

interface OrderProgressTrackerProps {
  currentStatus: string;
  orderTime: any; // Firestore timestamp
  estimatedDelivery?: string;
  className?: string;
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  timestamp?: Date;
  estimatedTime?: string;
}

export default function OrderProgressTracker({ 
  currentStatus, 
  orderTime, 
  estimatedDelivery,
  className = '' 
}: OrderProgressTrackerProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for accurate elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const progressSteps: ProgressStep[] = [
      {
        id: 'pending',
        title: 'Pedido Confirmado',
        description: 'Tu pedido ha sido recibido',
        icon: <CheckCircle className="h-5 w-5" />,
        status: getStepStatus('pending'),
        timestamp: orderTime?.toDate ? orderTime.toDate() : new Date(orderTime)
      },
      {
        id: 'accepted',
        title: 'Cocinero Asignado',
        description: 'El cocinero ha confirmado tu pedido',
        icon: <ChefHat className="h-5 w-5" />,
        status: getStepStatus('accepted')
      },
      {
        id: 'preparing',
        title: 'Preparando',
        description: 'Tu comida se está cocinando',
        icon: <Timer className="h-5 w-5" />,
        status: getStepStatus('preparing')
      },
      {
        id: 'ready',
        title: 'Listo',
        description: 'Tu pedido está listo para entregar',
        icon: <Package className="h-5 w-5" />,
        status: getStepStatus('ready')
      },
      {
        id: 'delivering',
        title: 'En Camino',
        description: 'Tu pedido está siendo entregado',
        icon: <Truck className="h-5 w-5" />,
        status: getStepStatus('delivering')
      },
      {
        id: 'delivered',
        title: 'Entregado',
        description: '¡Disfruta tu comida!',
        icon: <MapPin className="h-5 w-5" />,
        status: getStepStatus('delivered'),
        estimatedTime: estimatedDelivery
      }
    ];

    // Handle cancelled status
    if (currentStatus === 'cancelled') {
      progressSteps.forEach(step => {
        if (step.status === 'current') {
          step.status = 'pending';
        }
      });
      progressSteps.push({
        id: 'cancelled',
        title: 'Pedido Cancelado',
        description: 'El pedido ha sido cancelado',
        icon: <AlertCircle className="h-5 w-5" />,
        status: 'current'
      });
    }

    setSteps(progressSteps);
  }, [currentStatus, orderTime, estimatedDelivery]);

  function getStepStatus(stepId: string): 'completed' | 'current' | 'pending' | 'skipped' {
    const statusOrder = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (currentStatus === 'cancelled') {
      return stepIndex <= currentIndex ? 'completed' : 'pending';
    }

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'current':
        return 'bg-moai-orange border-moai-orange text-white animate-pulse';
      case 'skipped':
        return 'bg-gray-300 border-gray-300 text-gray-600';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  const getConnectorColor = (index: number) => {
    const currentStep = steps[index];
    const nextStep = steps[index + 1];
    
    if (currentStep.status === 'completed' && nextStep && nextStep.status !== 'pending') {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  const getElapsedTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    const elapsed = currentTime.getTime() - timestamp.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `hace ${hours}h ${minutes % 60}m`;
    }
    return `hace ${minutes}m`;
  };

  const getCurrentStepMessage = () => {
    const currentStep = steps.find(step => step.status === 'current');
    if (!currentStep) return '';

    switch (currentStep.id) {
      case 'pending':
        return 'Esperando confirmación del cocinero...';
      case 'accepted':
        return 'El cocinero comenzará la preparación pronto';
      case 'preparing':
        const prepTime = getElapsedTime(steps.find(s => s.id === 'accepted')?.timestamp);
        return `Preparando tu pedido ${prepTime ? `(${prepTime})` : ''}`;
      case 'ready':
        return 'Buscando conductor disponible...';
      case 'delivering':
        return estimatedDelivery ? `Llegada estimada: ${estimatedDelivery}` : 'En camino hacia tu ubicación';
      case 'delivered':
        return '¡Pedido entregado exitosamente!';
      case 'cancelled':
        return 'El pedido ha sido cancelado';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Status Message */}
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Estado Actual</p>
        <p className="font-semibold text-lg">{getCurrentStepMessage()}</p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-start pb-8 last:pb-0">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className={`absolute left-6 top-12 w-0.5 h-8 ${getConnectorColor(index)} transition-colors duration-500`}
              />
            )}
            
            {/* Step Circle */}
            <div className={`
              relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 
              ${getStatusColor(step.status)} 
              transition-all duration-500 shadow-sm
            `}>
              {step.status === 'completed' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                step.icon
              )}
            </div>
            
            {/* Step Content */}
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${
                  step.status === 'current' ? 'text-moai-orange' : 
                  step.status === 'completed' ? 'text-green-700' : 
                  'text-gray-600'
                }`}>
                  {step.title}
                </h3>
                
                {/* Status Badge */}
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'current' ? 'secondary' :
                  'outline'
                } className={
                  step.status === 'completed' ? 'bg-green-500 hover:bg-green-600' :
                  step.status === 'current' ? 'bg-moai-orange text-white' :
                  ''
                }>
                  {step.status === 'completed' ? 'Completado' :
                   step.status === 'current' ? 'En Proceso' :
                   'Pendiente'}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>
              
              {/* Timestamp */}
              {step.timestamp && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {step.timestamp.toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {getElapsedTime(step.timestamp)}
                  </span>
                </div>
              )}
              
              {/* Estimated Time */}
              {step.estimatedTime && step.status === 'current' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-moai-orange font-medium">
                  <Timer className="h-3 w-3" />
                  <span>ETA: {step.estimatedTime}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Tiempo Transcurrido</p>
            <p className="font-semibold">
              {getElapsedTime(orderTime?.toDate ? orderTime.toDate() : new Date(orderTime))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entrega Estimada</p>
            <p className="font-semibold">
              {estimatedDelivery || 'Calculando...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}