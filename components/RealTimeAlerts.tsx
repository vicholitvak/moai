'use client';

import { useState, useEffect, useRef } from 'react';
import { NotificationService, type NotificationMessage } from '@/lib/services/notificationService';
import { onSnapshot, query, where, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  Package,
  Clock,
  Star,
  MessageCircle,
  TrendingUp,
  Utensils,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface RealTimeAlertsProps {
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  showSound?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface AlertNotification extends NotificationMessage {
  showTime: number;
  isVisible: boolean;
  body?: string;
  actionUrl?: string;
  createdAt?: Date;
}

const RealTimeAlerts = ({ 
  maxVisible = 3,
  autoHide = true,
  autoHideDelay = 8000,
  showSound = true,
  position = 'top-right'
}: RealTimeAlertsProps) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastNotificationTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      initializeNotifications();
      setupRealtimeListener();
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.remove();
      }
    };
  }, [user]);

  useEffect(() => {
    // Auto-hide alerts
    if (autoHide) {
      const timer = setInterval(() => {
        setAlerts(prev => {
          const now = Date.now();
          return prev.filter(alert => now - alert.showTime < autoHideDelay);
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    
    return () => {}; // No-op cleanup when autoHide is false
  }, [autoHide, autoHideDelay]);

  const initializeNotifications = async () => {
    if (!user) return;

    try {
      // Initialize notification service
      NotificationService.initialize();
      
      // Get initial unread count
      const count = await NotificationService.getUnreadCount(user.uid);
      setUnreadCount(count);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupRealtimeListener = () => {
    if (!user) return;

    // Listen for new notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!isInitialized) {
        setIsInitialized(true);
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() } as NotificationMessage;
          
          // Only show new notifications (not from initial load)
          const notificationTime = notification.createdAt?.getTime() || Date.now();
          if (notificationTime > lastNotificationTime.current) {
            showAlert(notification);
            lastNotificationTime.current = notificationTime;
          }
        }
      });

      // Update unread count
      setUnreadCount(snapshot.size);
    });

    return unsubscribe;
  };

  const showAlert = (notification: NotificationMessage) => {
    const alertNotification: AlertNotification = {
      ...notification,
      showTime: Date.now(),
      isVisible: true
    };

    setAlerts(prev => {
      // Remove excess alerts if we're at the limit
      const filteredAlerts = prev.filter((_, index) => index < maxVisible - 1);
      return [alertNotification, ...filteredAlerts];
    });

    // Play notification sound
    if (showSound && notification.priority !== 'low') {
      playNotificationSound(notification.priority);
    }

    // Show toast for high priority notifications
    if (notification.priority === 'high') {
      toast(notification.title, {
        description: notification.body,
        action: notification.actionUrl ? {
          label: 'Ver',
          onClick: () => window.location.href = notification.actionUrl!
        } : undefined
      });
    }
  };

  const playNotificationSound = (priority: NotificationMessage['priority']) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Different sounds for different priorities
    const soundFile = priority === 'high' ? '/sounds/urgent.mp3' : '/sounds/notification.mp3';
    
    audioRef.current.src = soundFile;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(error => {
      console.warn('Could not play notification sound:', error);
    });
  };

  const handleDismissAlert = async (alertId: string) => {
    // Mark as read
    await NotificationService.markAsRead(alertId);
    
    // Remove from alerts
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleAlertClick = async (alert: AlertNotification) => {
    // Mark as read
    await handleDismissAlert(alert.id!);
    
    // Navigate if there's an action URL
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  const getAlertIcon = (type: NotificationMessage['type'], priority: NotificationMessage['priority']) => {
    const iconClass = priority === 'high' ? 'text-red-600' : 
                     priority === 'normal' ? 'text-blue-600' : 'text-gray-600';

    switch (type) {
      case 'order_update':
        return <Package className={`h-4 w-4 ${iconClass}`} />;
      case 'delivery_update':
        return <Clock className={`h-4 w-4 ${iconClass}`} />;
      case 'promotion':
        return <TrendingUp className={`h-4 w-4 ${iconClass}`} />;
      case 'new_dish':
        return <Utensils className={`h-4 w-4 ${iconClass}`} />;
      case 'message':
        return <Star className={`h-4 w-4 ${iconClass}`} />;
      case 'review':
        return <MessageCircle className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getPriorityBadge = (priority: NotificationMessage['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-600 text-white">Urgente</Badge>;
      case 'normal':
        return <Badge className="bg-blue-600 text-white">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Info</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600 text-white">Medio</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff}m`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Alert notifications */}
      <div className={`fixed ${getPositionClasses()} z-50 space-y-2 w-80 max-w-[calc(100vw-2rem)]`}>
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`shadow-lg border-l-4 ${
              alert.priority === 'high' ? 'border-l-red-500 bg-red-50' :
              alert.priority === 'normal' ? 'border-l-blue-500 bg-blue-50' :
              'border-l-gray-400 bg-gray-50'
            } animate-in slide-in-from-right duration-300`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type, alert.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {getPriorityBadge(alert.priority)}
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                    {alert.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {alert.body}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleAlertClick(alert)}
                        className="bg-moai-orange hover:bg-moai-orange/90 text-white text-xs h-7"
                      >
                        Ver detalles
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissAlert(alert.id!)}
                      className="text-xs h-7 px-2"
                    >
                      Marcar leída
                    </Button>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissAlert(alert.id!)}
                  className="p-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unread count indicator (for navigation) */}
      {unreadCount > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="shadow-md">
            <CardContent className="p-2">
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-moai-orange" />
                <span className="font-medium">
                  {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default RealTimeAlerts;