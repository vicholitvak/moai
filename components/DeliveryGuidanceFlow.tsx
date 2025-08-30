'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Navigation, 
  Package, 
  MapPin, 
  Phone, 
  User,
  ArrowRight,
  Timer,
  AlertTriangle,
  Utensils,
  Car,
  MessageSquare
} from 'lucide-react';
import { Order, Cook, Dish } from '@/lib/firebase/dataService';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface DeliveryStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  estimatedTime?: string;
  action?: string;
  actionHandler?: () => void;
  icon: any;
}

interface DeliveryGuidanceFlowProps {
  order: Order;
  cook?: Cook;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => void;
  onStartNavigation: (address: string) => void;
  onCallCustomer: (phone: string) => void;
}

export default function DeliveryGuidanceFlow({
  order,
  cook,
  onStatusUpdate,
  onStartNavigation,
  onCallCustomer
}: DeliveryGuidanceFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedReadyTime, setEstimatedReadyTime] = useState<Date | null>(null);

  // Calculate estimated ready time based on order preparation time
  useEffect(() => {
    if (order.createdAt) {
      const orderTime = order.createdAt.toDate();
      const prepTime = order.dishes.reduce((max, dish) => {
        const dishPrepTime = typeof dish.prepTime === 'string' 
          ? parseInt(dish.prepTime.replace(/\D/g, '')) 
          : dish.prepTime || 30;
        return Math.max(max, dishPrepTime);
      }, 30);
      
      const readyTime = new Date(orderTime.getTime() + (prepTime * 60 * 1000));
      setEstimatedReadyTime(readyTime);
    }
  }, [order]);

  // Define the delivery steps based on order status
  const getDeliverySteps = (): DeliveryStep[] => {
    const baseSteps: DeliveryStep[] = [
      {
        id: 'accepted',
        title: 'Pedido Aceptado',
        description: 'Has aceptado este pedido. El cocinero será notificado y confirmará la preparación.',
        status: order.status === 'accepted' ? 'active' : 
                ['preparing', 'ready', 'delivering', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        estimatedTime: '1-2 min',
        icon: CheckCircle,
        action: order.status === 'accepted' ? 'Esperando confirmación...' : undefined
      },
      {
        id: 'preparing',
        title: 'Preparación en Curso',
        description: 'El cocinero está preparando el pedido. Puedes monitorear el progreso.',
        status: order.status === 'preparing' ? 'active' : 
                ['ready', 'delivering', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        estimatedTime: order.dishes.reduce((max, dish) => {
          const dishPrepTime = typeof dish.prepTime === 'string' 
            ? parseInt(dish.prepTime.replace(/\D/g, '')) 
            : dish.prepTime || 30;
          return Math.max(max, dishPrepTime);
        }, 30) + ' min',
        icon: Utensils,
        action: order.status === 'preparing' ? `Listo aprox: ${estimatedReadyTime?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : undefined
      },
      {
        id: 'ready',
        title: 'Listo para Recoger',
        description: 'El pedido está listo. Ve al restaurante para recogerlo.',
        status: order.status === 'ready' ? 'active' : 
                ['delivering', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        estimatedTime: '5-10 min',
        icon: Package,
        action: order.status === 'ready' ? 'Recoger Pedido' : undefined,
        actionHandler: order.status === 'ready' ? () => {
          onStatusUpdate(order.id, 'delivering');
          toast.success('¡Pedido recogido! Ahora dirígete al cliente.');
        } : undefined
      },
      {
        id: 'delivering',
        title: 'En Camino al Cliente',
        description: 'Dirígete a la dirección del cliente para entregar el pedido.',
        status: order.status === 'delivering' ? 'active' : 
                order.status === 'delivered' ? 'completed' : 'pending',
        estimatedTime: '10-20 min',
        icon: Car,
        action: order.status === 'delivering' ? 'Navegar al Cliente' : undefined,
        actionHandler: order.status === 'delivering' ? () => {
          onStartNavigation(order.deliveryInfo.address);
        } : undefined
      },
      {
        id: 'delivered',
        title: 'Entrega Completada',
        description: 'Confirma la entrega una vez que hayas entregado el pedido al cliente.',
        status: order.status === 'delivered' ? 'completed' : 'pending',
        icon: CheckCircle,
        action: order.status === 'delivering' ? 'Confirmar Entrega' : undefined,
        actionHandler: order.status === 'delivering' ? () => {
          onStatusUpdate(order.id, 'delivered');
          toast.success('¡Entrega completada! Ganancia agregada a tu cuenta.');
        } : undefined
      }
    ];

    return baseSteps;
  };

  const steps = getDeliverySteps();
  const activeStepIndex = steps.findIndex(step => step.status === 'active');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  // Calculate preparation progress for preparing status
  const getPreparationProgress = () => {
    if (order.status !== 'preparing' || !order.createdAt || !estimatedReadyTime) {
      return { progress: 0, timeRemaining: '' };
    }

    const now = new Date();
    const startTime = order.createdAt.toDate();
    const totalTime = estimatedReadyTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const progress = Math.min((elapsed / totalTime) * 100, 100);
    
    const remaining = Math.max(0, estimatedReadyTime.getTime() - now.getTime());
    const remainingMinutes = Math.ceil(remaining / (1000 * 60));
    const timeRemaining = remainingMinutes > 0 ? `${remainingMinutes} min restantes` : 'Listo!';

    return { progress, timeRemaining };
  };

  const { progress: prepProgress, timeRemaining } = getPreparationProgress();

  return (
    <div className="space-y-6">
      {/* Header with Order Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  Pedido #{order.id.slice(-8)}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-blue-700">
                  <span className="flex items-center">
                    <Utensils className="h-4 w-4 mr-1" />
                    {cook?.displayName || 'Cocinero'}
                  </span>
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {order.customerName}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {order.createdAt?.toDate().toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {formatPrice(order.total)}
              </div>
              <div className="text-sm text-blue-700">
                Ganancia: {formatPrice(order.deliveryFee || 2500)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso de la Entrega</span>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Paso {activeStepIndex + 1} de {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso General</span>
              <span>{Math.round(progressPercentage)}% completado</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Preparation Progress (only show when preparing) */}
          {order.status === 'preparing' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Timer className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-900">Preparación en curso</span>
                </div>
                <span className="text-sm font-bold text-orange-700">
                  {timeRemaining}
                </span>
              </div>
              <Progress value={prepProgress} className="h-2 mb-2" />
              <p className="text-xs text-orange-700">
                El cocinero está preparando tu pedido. Te notificaremos cuando esté listo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Pasos a Seguir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.status === 'active';
              const isCompleted = step.status === 'completed';
              
              return (
                <div
                  key={step.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                      : isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-400 text-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${
                        isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h4>
                      {step.estimatedTime && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {step.estimatedTime}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      isActive ? 'text-blue-800' : isCompleted ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.action && isActive && (
                      <div className="mt-3">
                        {step.actionHandler ? (
                          <Button
                            onClick={step.actionHandler}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {step.action}
                          </Button>
                        ) : (
                          <div className="flex items-center text-blue-600">
                            <Timer className="h-4 w-4 mr-2 animate-pulse" />
                            <span className="text-sm font-medium">{step.action}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => onStartNavigation(cook?.location?.address?.fullAddress || 'Dirección del cocinero')}
              className="flex items-center justify-center"
              disabled={!['ready', 'delivering'].includes(order.status)}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navegar al Cocinero
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onStartNavigation(order.deliveryInfo.address)}
              className="flex items-center justify-center"
              disabled={order.status !== 'delivering'}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Navegar al Cliente
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onCallCustomer(order.deliveryInfo.phone)}
              className="flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Llamar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dishes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Platos:</h4>
              <div className="space-y-2">
                {order.dishes.map((dish, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{dish.dishName} x {dish.quantity}</span>
                    <span className="font-medium">{formatPrice(dish.price * dish.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Información de Entrega:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{order.deliveryInfo.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{order.deliveryInfo.phone}</span>
                </div>
                {order.deliveryInfo.instructions && (
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="italic">&quot;{order.deliveryInfo.instructions}&quot;</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}