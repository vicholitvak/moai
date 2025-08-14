'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminService, OrdersService } from '@/lib/firebase/dataService';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Order, Cook, Driver } from '@/lib/firebase/dataService';
import { formatPrice } from '@/lib/utils';
import { 
  Activity,
  Bell,
  Clock,
  DollarSign,
  Eye,
  LogOut,
  Package,
  RefreshCw,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle,
  Timer,
  Crown,
  Trash2,
  ChefHat,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const RealTimeMap = dynamic(() => import('@/components/ui/real-time-map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface AdminStats {
  totalOrders: number;
  activeOrders: number;
  pendingApproval: number;
  totalRevenue: number;
  activeDrivers: number;
  activeCooks: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // State
  const [orders, setOrders] = useState<Array<Order & { cookInfo?: Cook; driverInfo?: Driver }>>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    activeOrders: 0,
    pendingApproval: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    activeCooks: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Check admin permissions
  useEffect(() => {
    const checkAdminStatus = async (): Promise<void> => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const adminStatus = await AdminService.isAdmin(user.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  // Real-time orders subscription
  useEffect(() => {
    if (!isAdmin) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Get detailed orders with cook and driver info
      try {
        const detailedOrders = await OrdersService.getOrdersWithDetails();
        setOrders(detailedOrders);
        calculateStats(ordersData);
      } catch (error) {
        console.error('Error fetching detailed orders:', error);
        setOrders(ordersData as any);
        calculateStats(ordersData);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const calculateStats = (ordersData: Order[]): void => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = ordersData.filter(order => {
      const orderDate = order.createdAt?.toDate();
      return orderDate && orderDate >= today;
    });

    const activeOrders = ordersData.filter(order => 
      ['pending_approval', 'pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(order.status)
    );

    const pendingApproval = ordersData.filter(order => order.status === 'pending_approval');

    const totalRevenue = todayOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    setStats({
      totalOrders: todayOrders.length,
      activeOrders: activeOrders.length,
      pendingApproval: pendingApproval.length,
      totalRevenue,
      activeDrivers: 0, // Would be calculated from driver data
      activeCooks: 0    // Would be calculated from cook data
    });
  };

  const getStatusColor = (status: Order['status']): string => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': 
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']): JSX.Element => {
    switch (status) {
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'pending': return <Timer className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Activity className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'delivering': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': 
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Order['status']): string => {
    const statusMap = {
      'pending_approval': 'Esperando Aprobación',
      'pending': 'Pendiente',
      'accepted': 'Aceptada',
      'preparing': 'Preparando',
      'ready': 'Lista',
      'delivering': 'En Camino',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada',
      'rejected': 'Rechazada'
    };
    return statusMap[status] || status;
  };

  const handleDeleteOrder = async (): Promise<void> => {
    if (!orderToDelete) return;
    
    try {
      const success = await OrdersService.deleteOrder(orderToDelete);
      if (success) {
        toast.success('Pedido eliminado correctamente');
        // Orders will be updated automatically via real-time subscription
      } else {
        toast.error('Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Error al eliminar el pedido');
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const openDeleteDialog = (orderId: string): void => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor en tiempo real · {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Órdenes Hoy</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Órdenes Activas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeOrders}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Esperando Aprobación</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ingresos Hoy</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Órdenes en Tiempo Real</TabsTrigger>
            <TabsTrigger value="tracking">Seguimiento GPS</TabsTrigger>
            <TabsTrigger value="system">Estado del Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Órdenes en Tiempo Real
                  <Badge variant="outline" className="ml-auto">
                    {orders.length} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay órdenes todavía
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 20).map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <Badge className={getStatusColor(order.status)}>
                                {formatStatus(order.status)}
                              </Badge>
                            </div>
                            
                            <div>
                              <p className="font-medium">#{order.id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.customerName} • {order.dishes?.length || 0} items
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total || 0)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.createdAt?.toDate().toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Cook and Driver Info */}
                        <div className="flex items-center gap-6 mb-3 text-sm">
                          {order.cookInfo && (
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-orange-600" />
                              <span className="text-muted-foreground">Cocinero:</span>
                              <span className="font-medium">{order.cookInfo.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ⭐ {order.cookInfo.rating?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          )}
                          
                          {order.driverInfo && (
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-blue-600" />
                              <span className="text-muted-foreground">Conductor:</span>
                              <span className="font-medium">{order.driverInfo.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ⭐ {order.driverInfo.rating?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(order.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Seguimiento GPS en Tiempo Real
                  <Badge variant="outline" className="ml-auto">
                    {orders.filter(order => order.status === 'en_viaje').length} en viaje
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.filter(order => order.status === 'en_viaje').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay entregas en viaje en este momento
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.filter(order => order.status === 'en_viaje').map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Pedido #{order.id.slice(-8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName} • {order.dishes?.length || 0} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total || 0)}</p>
                            <Badge className="bg-blue-100 text-blue-800">En Viaje</Badge>
                          </div>
                        </div>

                        {/* Driver Info */}
                        {order.driverInfo && (
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{order.driverInfo.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  ⭐ {order.driverInfo.rating?.toFixed(1) || 'N/A'} • {order.driverInfo.vehicleType || 'Vehículo'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Real-time Map */}
                        <RealTimeMap
                          orderId={order.id}
                          customerLocation={{
                            lat: -33.4489, // You'll need to geocode the actual address
                            lng: -70.6693,
                            address: order.deliveryInfo?.address || 'Dirección no disponible'
                          }}
                          estimatedTime={30} // This should come from tracking data
                          isAdmin={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Cocineros Activos</span>
                      <Badge variant="outline">{stats.activeCooks}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Conductores Activos</span>
                      <Badge variant="outline">{stats.activeDrivers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Órdenes en Proceso</span>
                      <Badge variant="outline">{stats.activeOrders}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.pendingApproval > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">
                          {stats.pendingApproval} órdenes esperando aprobación
                        </span>
                      </div>
                    )}
                    {stats.pendingApproval === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        ✅ Todo funcionando correctamente
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pedido?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El pedido #{orderToDelete?.slice(-8)} será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;