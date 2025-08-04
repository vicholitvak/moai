'use client';

import { useState, useEffect } from 'react';
import { DeliveryTrackingService } from '@/lib/services/deliveryTrackingService';
import type { DeliveryTracking } from '@/lib/services/deliveryTrackingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Clock, 
  Car, 
  CheckCircle, 
  Navigation,
  User,
  Timer
} from 'lucide-react';

interface DeliveryTrackerProps {
  orderId: string;
  customerView?: boolean;
}

const DeliveryTracker = ({ orderId, customerView = false }: DeliveryTrackerProps) => {
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = DeliveryTrackingService.subscribeToDeliveryTracking(
      orderId,
      (trackingData) => {
        setTracking(trackingData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const getStepTitle = (step: DeliveryTracking['currentStep']) => {
    switch (step) {
      case 'heading_to_pickup':
        return 'Conductor dirigiéndose al cocinero';
      case 'at_pickup':
        return 'Recogiendo el pedido';
      case 'heading_to_delivery':
        return 'En camino hacia ti';
      case 'delivered':
        return 'Pedido entregado';
      default:
        return 'Estado desconocido';
    }
  };

  const getStepIcon = (step: DeliveryTracking['currentStep']) => {
    switch (step) {
      case 'heading_to_pickup':
        return <Navigation className="h-4 w-4" />;
      case 'at_pickup':
        return <Timer className="h-4 w-4" />;
      case 'heading_to_delivery':
        return <Car className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStepColor = (step: DeliveryTracking['currentStep']) => {
    switch (step) {
      case 'heading_to_pickup':
        return 'bg-blue-100 text-blue-800';
      case 'at_pickup':
        return 'bg-orange-100 text-orange-800';
      case 'heading_to_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    
    const now = Date.now();
    const time = timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Hace menos de 1 minuto';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    return `Hace ${Math.floor(diff / 3600)} horas`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Cargando información de entrega...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Información de entrega no disponible</p>
            <p className="text-sm">El seguimiento comenzará cuando un conductor acepte el pedido</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Estado de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Driver Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{tracking.driverName}</p>
                <p className="text-sm text-muted-foreground">Tu conductor</p>
              </div>
            </div>

            {/* Current Step */}
            <div className="flex items-center gap-3">
              <Badge className={getStepColor(tracking.currentStep)}>
                <div className="flex items-center gap-1">
                  {getStepIcon(tracking.currentStep)}
                  {getStepTitle(tracking.currentStep)}
                </div>
              </Badge>
            </div>

            {/* Location Update */}
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Última actualización: {formatTimeAgo(tracking.currentLocation.timestamp)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ETA Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiempo Estimado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tracking.currentStep === 'heading_to_pickup' && tracking.estimatedPickupTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tracking.estimatedPickupTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hasta el cocinero
                </div>
              </div>
            )}
            
            {(tracking.currentStep === 'heading_to_delivery' || tracking.currentStep === 'at_pickup') && tracking.estimatedDeliveryTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tracking.estimatedDeliveryTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {customerView ? 'Hasta tu ubicación' : 'Hasta el cliente'}
                </div>
              </div>
            )}
            
            {tracking.totalEstimatedTime && tracking.currentStep !== 'delivered' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tracking.totalEstimatedTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tiempo total estimado
                </div>
              </div>
            )}

            {tracking.currentStep === 'delivered' && (
              <div className="text-center col-span-full">
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle className="h-8 w-8" />
                  ¡Entregado!
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tu pedido ha sido entregado exitosamente
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de la Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 'heading_to_pickup', title: 'Conductor en camino al cocinero' },
              { step: 'at_pickup', title: 'Recogiendo el pedido' },
              { step: 'heading_to_delivery', title: customerView ? 'En camino hacia ti' : 'En camino al cliente' },
              { step: 'delivered', title: 'Pedido entregado' }
            ].map((item, index) => {
              const isCompleted = getStepOrder(tracking.currentStep) > index;
              const isCurrent = tracking.currentStep === item.step;
              
              return (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                      {item.title}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge variant="default">Actual</Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800">Completado</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to determine step order for progress visualization
const getStepOrder = (step: DeliveryTracking['currentStep']): number => {
  switch (step) {
    case 'heading_to_pickup': return 0;
    case 'at_pickup': return 1;
    case 'heading_to_delivery': return 2;
    case 'delivered': return 3;
    default: return 0;
  }
};

export default DeliveryTracker;