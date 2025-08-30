'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  Users, 
  Star,
  ChefHat,
  Eye,
  Edit,
  Settings,
  Bell,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditDishModal from '@/components/EditDishModal';
import CookerSettingsModal from '@/components/CookerSettingsModal';
import { DishesService, OrdersService, CooksService, AnalyticsService, type Dish, type Order, type Cook } from '@/lib/firebase/dataService';

export default function CookerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Firebase data states
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cookProfile, setCookProfile] = useState<Cook | null>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeDishes: 0,
    pendingOrders: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Load cook profile
        const profile = await CooksService.getCookById(user.uid);
        setCookProfile(profile);
        
        // Load dishes
        const dishesData = await DishesService.getDishesByCook(user.uid);
        setDishes(dishesData);
        
        // Load orders
        const ordersData = await OrdersService.getOrdersByCook(user.uid);
        setOrders(ordersData);
        
        // Load stats
        const statsData = await AnalyticsService.getCookStats(user.uid);
        setStats(statsData);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.uid]);
  
  // Set up real-time order updates
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = OrdersService.subscribeToOrderUpdates(user.uid, (updatedOrders) => {
      setOrders(updatedOrders);
    });
    
    return unsubscribe;
  }, [user?.uid]);

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setIsEditModalOpen(true);
  };

  const handleSaveDish = async (updatedDish: Partial<Dish>) => {
    if (!editingDish?.id) return;
    
    try {
      const success = await DishesService.updateDish(editingDish.id, updatedDish);
      if (success) {
        // Refresh dishes data
        const dishesData = await DishesService.getDishesByCook(user?.uid ?? '');
        setDishes(dishesData);
        console.log('Dish updated successfully');
      }
    } catch (error) {
      console.error('Error updating dish:', error);
    } finally {
      setIsEditModalOpen(false);
      setEditingDish(null);
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const success = await OrdersService.updateOrderStatus(orderId, newStatus);
      if (success) {
        console.log('Order status updated successfully');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, description }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    description?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-emerald-500">{trend}</span> {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const DishCard = ({ dish, onEdit }: { dish: Dish; onEdit: (dish: Dish) => void }) => (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        <img 
          src={dish.image} 
          alt={dish.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge className={dish.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {dish.isAvailable ? 'Disponible' : 'Agotado'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{dish.name}</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{dish.category}</p>
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-primary">${dish.price.toLocaleString('es-CL')}</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{dish.rating}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
          <span>{dish.reviewCount} reviews</span>
          <span>Total</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(dish)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">{order.customerName}</h3>
            <div className="text-sm text-muted-foreground">
              {order.dishes.map((dish, index) => (
                <div key={index}>{dish.dishName} x{dish.quantity}</div>
              ))}
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status === 'pending' ? 'Pendiente' :
             order.status === 'accepted' ? 'Aceptado' :
             order.status === 'preparing' ? 'Preparando' :
             order.status === 'ready' ? 'Listo' :
             order.status === 'delivering' ? 'En camino' :
             order.status === 'delivered' ? 'Entregado' :
             order.status === 'cancelled' ? 'Cancelado' : order.status}
          </Badge>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold">${order.total.toLocaleString('es-CL')}</span>
          <div className="text-sm text-muted-foreground">
            <div>Pedido: {order.orderTime?.toDate()?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) ?? 'N/A'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Ver detalles
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
          >
            Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return <div>Please log in to access the cooker dashboard.</div>;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={cookProfile?.avatar ?? user.photoURL ?? '/api/placeholder/50/50'} />
                <AvatarFallback>{cookProfile?.displayName?.charAt(0) ?? user.displayName?.charAt(0) ?? 'C'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">¡Hola, {cookProfile?.displayName ?? user.displayName ?? 'Cocinero'}!</h1>
                <p className="text-muted-foreground">Gestiona tus platos y pedidos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'dishes', label: 'My Dishes' },
            { id: 'orders', label: 'Orders' },
            { id: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Ganancias Totales"
                value={`$${stats.totalEarnings.toLocaleString('es-CL')}`}
                icon={TrendingUp}
                trend="+12%"
                description="del mes pasado"
              />
              <StatCard
                title="Platos Activos"
                value={stats.activeDishes}
                icon={ChefHat}
                trend="+2"
                description="nuevos esta semana"
              />
              <StatCard
                title="Pedidos Pendientes"
                value={stats.pendingOrders}
                icon={Clock}
                trend="-3"
                description="desde ayer"
              />
              <StatCard
                title="Calificación Promedio"
                value={stats.averageRating.toFixed(1)}
                icon={Star}
                trend="+0.2"
                description="este mes"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.dishes.map((dish) => dish.dishName).join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toLocaleString('es-CL')}</p>
                        <Badge className={getStatusColor(order.status)} variant="secondary">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Dishes</CardTitle>
                  <CardDescription>Your most popular dishes this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dishes
                    .sort((a, b) => b.reviewCount - a.reviewCount)
                    .slice(0, 3)
                    .map((dish) => (
                      <div key={dish.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{dish.name}</p>
                          <p className="text-sm text-muted-foreground">{dish.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{dish.reviewCount} reviews</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{dish.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Dishes Tab */}
        {activeTab === 'dishes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">My Dishes</h2>
                <p className="text-muted-foreground">Manage your menu items</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Dish
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.length > 0 ? (
                dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} onEdit={handleEditDish} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes platos aún</h3>
                  <p className="text-muted-foreground mb-4">Comienza agregando tu primer plato al menú</p>
                  <Button>Agregar Plato</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Orders</h2>
              <p className="text-muted-foreground">Manage incoming orders</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pedidos pendientes</h3>
                  <p className="text-muted-foreground">Los nuevos pedidos aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">Track your performance</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Analytics charts coming soon!</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Customer data coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dish Modal */}
      <EditDishModal
        dish={editingDish as any}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDish(null);
        }}
        onSave={handleSaveDish}
      />

      {/* Settings Modal */}
      <CookerSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(settings: Record<string, unknown>) => {
          console.log('Settings saved:', settings);
          setIsSettingsModalOpen(false);
        }}
        currentUser={user}
      />
    </div>
  );
}
