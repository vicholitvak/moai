'use client';

import { useState, useEffect } from 'react';
import { NotificationService, type NotificationMessage, type NotificationSettings } from '@/lib/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff,
  Check,
  CheckCheck,
  X,
  Settings,
  Trash2,
  Mail,
  Clock,
  Star,
  Package,
  MessageCircle,
  TrendingUp,
  Utensils,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  showSettings?: boolean;
}

const NotificationCenter = ({ isOpen, onClose, showSettings = false }: NotificationCenterProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
      loadSettings();
    }
  }, [user, isOpen]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userNotifications = await NotificationService.getUserNotifications(user.uid, 50);
      setNotifications(userNotifications);
      
      const count = await NotificationService.getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await NotificationService.getUserSettings(user.uid);
      if (userSettings) {
        setSettings(userSettings);
      } else {
        // Initialize push notifications
        const token = await NotificationService.requestPermission(user.uid);
        if (token) {
          const newSettings = await NotificationService.getUserSettings(user.uid);
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await NotificationService.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  const handleUpdateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!user || !settings) return;
    
    try {
      await NotificationService.updateUserSettings(user.uid, updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!user) return;
    
    try {
      const token = await NotificationService.requestPermission(user.uid);
      if (token) {
        await handleUpdateSettings({ pushNotifications: true });
        toast.success('Notificaciones push activadas');
      } else {
        toast.error('No se pudo activar las notificaciones push');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Error al activar notificaciones push');
    }
  };

  const getNotificationIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'order_update':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'delivery_update':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'promotion':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'new_dish':
        return <Utensils className="h-4 w-4 text-purple-600" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-indigo-600" />;
      case 'review':
        return <Star className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationTypeText = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'order_update': return 'Pedido';
      case 'delivery_update': return 'Entrega';
      case 'promotion': return 'Promoción';
      case 'new_dish': return 'Nuevo Plato';
      case 'message': return 'Mensaje';
      case 'review': return 'Reseña';
      default: return 'Sistema';
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('es-CL');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Centro de Notificaciones
              {unreadCount > 0 && (
                <Badge className="bg-moai-orange text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {showSettings && (
                <div className="flex items-center gap-1">
                  <Button
                    variant={activeTab === 'notifications' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('notifications')}
                    className={activeTab === 'notifications' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Notificaciones
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('settings')}
                    className={activeTab === 'settings' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configuración
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          {activeTab === 'notifications' ? (
            <div>
              {/* Notification Actions */}
              {notifications.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Marcar todas como leídas
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <div className="divide-y">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
                    <p>Cargando notificaciones...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                    <p className="text-muted-foreground">
                      Las nuevas notificaciones aparecerán aquí
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-moai-orange' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {getNotificationTypeText(notification.type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-moai-orange rounded-full"></div>
                                )}
                              </div>
                              
                              <h4 className="font-semibold text-sm mb-1">
                                {notification.title}
                              </h4>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.body}
                              </p>
                              
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    Ver detalles
                                  </Button>
                                </Link>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id!)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id!)}
                                className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Settings Tab */
            <div className="p-4 space-y-6">
              {/* Push Notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones Push
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activar notificaciones push</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones en tiempo real en tu dispositivo
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings?.pushNotifications || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleEnablePushNotifications();
                          } else {
                            handleUpdateSettings({ pushNotifications: false });
                          }
                        }}
                      />
                      {settings?.pushNotifications ? (
                        <Volume2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones por email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe resúmenes y notificaciones importantes por email
                      </p>
                    </div>
                    <Switch
                      checked={settings?.emailNotifications || false}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ emailNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Preferencias</h3>
                <div className="space-y-3">
                  {[
                    { key: 'orderUpdates', label: 'Actualizaciones de pedidos', icon: Package },
                    { key: 'deliveryUpdates', label: 'Actualizaciones de entrega', icon: Clock },
                    { key: 'promotions', label: 'Promociones y ofertas', icon: TrendingUp },
                    { key: 'newDishes', label: 'Nuevos platos', icon: Utensils },
                    { key: 'messages', label: 'Mensajes', icon: MessageCircle },
                    { key: 'reviews', label: 'Reseñas y calificaciones', icon: Star }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Label>{label}</Label>
                      </div>
                      <Switch
                        checked={settings?.preferences[key as keyof typeof settings.preferences] || false}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({
                            preferences: {
                              ...settings?.preferences,
                              [key]: checked
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notification Schedule */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horario de Notificaciones
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hora de inicio</Label>
                    <Input
                      type="time"
                      value={settings?.schedule.startTime || '08:00'}
                      onChange={(e) => 
                        handleUpdateSettings({
                          schedule: {
                            ...settings?.schedule,
                            startTime: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Hora de fin</Label>
                    <Input
                      type="time"
                      value={settings?.schedule.endTime || '22:00'}
                      onChange={(e) => 
                        handleUpdateSettings({
                          schedule: {
                            ...settings?.schedule,
                            endTime: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Las notificaciones no urgentes se enviarán solo durante este horario
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;