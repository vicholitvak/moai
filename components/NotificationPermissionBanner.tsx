'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  X, 
  CheckCircle, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { PushNotificationService, type NotificationPermissionState } from '@/lib/services/pushNotificationService';
import { toast } from 'sonner';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
  showTestButton?: boolean;
}

export default function NotificationPermissionBanner({ 
  onPermissionGranted,
  onPermissionDenied,
  className = '',
  showTestButton = false
}: NotificationPermissionBannerProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    supported: false,
    serviceWorkerRegistered: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    initializeNotifications();
    
    // Check if user previously dismissed the banner
    const dismissed = localStorage.getItem('moai-notification-banner-dismissed');
    setIsDismissed(dismissed === 'true');
    
    // Check user notification preference
    setNotificationsEnabled(PushNotificationService.areNotificationsEnabled());
  }, []);

  const initializeNotifications = async () => {
    try {
      const state = await PushNotificationService.initialize();
      setPermissionState(state);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    
    try {
      const permission = await PushNotificationService.requestPermission();
      
      const newState = { ...permissionState, permission };
      setPermissionState(newState);
      
      if (permission === 'granted') {
        toast.success('¡Notificaciones activadas! Te mantendremos informado sobre tus pedidos.');
        onPermissionGranted?.();
        setIsDismissed(true);
        localStorage.setItem('moai-notification-banner-dismissed', 'true');
      } else if (permission === 'denied') {
        toast.error('Notificaciones desactivadas. Puedes activarlas desde la configuración del navegador.');
        onPermissionDenied?.();
      }
      
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error al solicitar permisos de notificación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await PushNotificationService.showTestNotification();
      toast.success('¡Notificación de prueba enviada!');
    } catch (error) {
      console.error('Error showing test notification:', error);
      toast.error('Error al enviar notificación de prueba');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('moai-notification-banner-dismissed', 'true');
  };

  const handleToggleNotifications = async () => {
    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);
    await PushNotificationService.setNotificationsEnabled(newEnabled);
    
    if (newEnabled && permissionState.permission !== 'granted') {
      handleRequestPermission();
    } else {
      toast.success(
        newEnabled 
          ? 'Notificaciones activadas' 
          : 'Notificaciones desactivadas'
      );
    }
  };

  // Don't show banner if not supported or already dismissed
  if (!permissionState.supported || isDismissed) {
    return null;
  }

  // Don't show if permission already granted and notifications enabled
  if (permissionState.permission === 'granted' && notificationsEnabled && !showTestButton) {
    return null;
  }

  const getStatusInfo = () => {
    if (permissionState.permission === 'granted') {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        status: 'Activadas',
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-800'
      };
    } else if (permissionState.permission === 'denied') {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        status: 'Bloqueadas',
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800'
      };
    } else {
      return {
        icon: <Bell className="h-5 w-5 text-blue-600" />,
        status: 'Disponibles',
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`${statusInfo.color} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {statusInfo.icon}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`font-semibold ${statusInfo.textColor}`}>
                  Notificaciones de Pedidos
                </h3>
                <Badge variant="outline" className="text-xs">
                  {statusInfo.status}
                </Badge>
              </div>
              
              <p className={`text-sm ${statusInfo.textColor} mb-3`}>
                {permissionState.permission === 'granted' 
                  ? notificationsEnabled
                    ? 'Recibirás notificaciones cuando tu pedido cambie de estado.'
                    : 'Las notificaciones están desactivadas. Actívalas para recibir actualizaciones de tus pedidos.'
                  : permissionState.permission === 'denied'
                  ? 'Las notificaciones están bloqueadas. Puedes activarlas desde la configuración del navegador.'
                  : 'Activa las notificaciones para recibir actualizaciones en tiempo real de tus pedidos.'
                }
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Main action button */}
                {permissionState.permission === 'default' && (
                  <Button 
                    onClick={handleRequestPermission} 
                    disabled={isLoading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Activando...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Activar Notificaciones
                      </>
                    )}
                  </Button>
                )}

                {/* Toggle button for granted permission */}
                {permissionState.permission === 'granted' && (
                  <Button 
                    onClick={handleToggleNotifications}
                    size="sm"
                    variant={notificationsEnabled ? "outline" : "default"}
                  >
                    {notificationsEnabled ? (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Activar
                      </>
                    )}
                  </Button>
                )}

                {/* Settings button for denied permission */}
                {permissionState.permission === 'denied' && (
                  <Button 
                    onClick={() => {
                      toast.info('Ve a la configuración de tu navegador para activar las notificaciones de Moai');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                )}

                {/* Test button (only shown when explicitly requested) */}
                {showTestButton && permissionState.permission === 'granted' && notificationsEnabled && (
                  <Button 
                    onClick={handleTestNotification}
                    size="sm"
                    variant="outline"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Probar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-2 h-8 w-8 p-0 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}