'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Home, 
  ShoppingBag,
  Clock,
  Star,
  Heart,
  Download,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [offlineData, setOfflineData] = useState({
    favoriteOrders: [],
    recentSearches: [],
    cachedDishes: [],
    savedData: 0
  });

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada');
      
      // Redirect to home after connection is restored
      setTimeout(() => {
        router.push('/client/home');
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data
    loadOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const loadOfflineData = async () => {
    try {
      // Load cached data from localStorage or IndexedDB
      const favorites = JSON.parse(localStorage.getItem('offline_favorites') || '[]');
      const searches = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      const dishes = JSON.parse(localStorage.getItem('cached_dishes') || '[]');
      
      // Calculate saved data size
      const dataSize = new Blob([
        localStorage.getItem('offline_favorites') || '',
        localStorage.getItem('recent_searches') || '',
        localStorage.getItem('cached_dishes') || ''
      ]).size;

      setOfflineData({
        favoriteOrders: favorites,
        recentSearches: searches,
        cachedDishes: dishes,
        savedData: Math.round(dataSize / 1024) // KB
      });
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Test connection with a simple fetch
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
        toast.success('Conexión restaurada');
        router.push('/client/home');
      }
    } catch (error) {
      toast.error('Aún sin conexión');
    }
  };

  const goToHome = () => {
    router.push('/client/home');
  };

  const clearOfflineData = () => {
    localStorage.removeItem('offline_favorites');
    localStorage.removeItem('recent_searches'); 
    localStorage.removeItem('cached_dishes');
    
    setOfflineData({
      favoriteOrders: [],
      recentSearches: [],
      cachedDishes: [],
      savedData: 0
    });
    
    toast.success('Datos offline eliminados');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {isOnline ? (
              <Wifi className="h-16 w-16 mx-auto text-green-500" />
            ) : (
              <WifiOff className="h-16 w-16 mx-auto text-red-500" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            {isOnline ? '¡Conexión Restaurada!' : 'Sin Conexión'}
          </h1>
          
          <p className="text-muted-foreground">
            {isOnline 
              ? 'Tu conexión a internet ha sido restaurada. Redirigiendo...'
              : 'No hay conexión a internet. Algunos contenidos están disponibles offline.'
            }
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Estado de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Estado actual:</span>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </Badge>
            </div>
            
            {!isOnline && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span>Intentos de reconexión:</span>
                  <span className="font-mono">{retryCount}</span>
                </div>
                
                <Button 
                  onClick={handleRetry}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar Conexión
                </Button>
              </>
            )}
            
            {isOnline && (
              <Button 
                onClick={goToHome}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Offline Features */}
        {!isOnline && (
          <>
            {/* Available Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Funciones Disponibles Offline</CardTitle>
                <CardDescription>
                  Estas acciones funcionan sin conexión a internet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/favorites')}
                  >
                    <Heart className="h-6 w-6" />
                    <span>Favoritos</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/orders/history')}
                  >
                    <Clock className="h-6 w-6" />
                    <span>Historial</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/search')}
                  >
                    <Star className="h-6 w-6" />
                    <span>Búsquedas</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/profile')}
                  >
                    <ShoppingBag className="h-6 w-6" />
                    <span>Perfil</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offline Data */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Datos Guardados Offline
                </CardTitle>
                <CardDescription>
                  Información disponible sin conexión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Pedidos favoritos:</span>
                  <Badge variant="secondary">{offlineData.favoriteOrders.length}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Búsquedas recientes:</span>
                  <Badge variant="secondary">{offlineData.recentSearches.length}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Platos en caché:</span>
                  <Badge variant="secondary">{offlineData.cachedDishes.length}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Espacio utilizado:</span>
                  <Badge variant="outline">{offlineData.savedData} KB</Badge>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearOfflineData}
                    className="w-full"
                  >
                    Limpiar Datos Offline
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Consejos para Uso Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Los datos se sinronizarán automáticamente cuando se restaure la conexión</li>
                  <li>• Puedes ver tu historial de pedidos y platos favoritos</li>
                  <li>• Las búsquedas recientes están disponibles sin conexión</li>
                  <li>• Los cambios se guardarán localmente hasta que haya conexión</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Auto-redirect progress for online users */}
        {isOnline && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Redirigiendo al inicio en unos segundos...
                </p>
                <Progress value={66} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}