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
  LogOut,
  Power,
  PowerOff,
  Truck,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Timer,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  Utensils,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditDishModal from '@/components/EditDishModal';
import CookerSettingsModal from '@/components/CookerSettingsModal';
import { AddDishModal } from '@/components/AddDishModal';
import CookerOnboarding from '@/components/CookerOnboarding';
// import LocationSetup from '@/components/LocationSetup'; // Unused import
import { DishesService, OrdersService, CooksService, AnalyticsService, type Dish, type Order, type Cook } from '@/lib/firebase/dataService';

export default function CookerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  
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
        
        if (!profile) {
          // No profile exists, show onboarding
          setShowOnboarding(true);
          setLoading(false);
          return;
        }
        
        // Check if profile is complete
        const isComplete = !!(
          profile.displayName &&
          profile.location?.address?.street &&
          profile.location?.address?.city &&
          profile.specialties?.length > 0 &&
          profile.cookingStyle &&
          profile.settings?.workingDays?.length > 0
        );
        
        if (!isComplete) {
          // Profile exists but incomplete, show onboarding
          setShowOnboarding(true);
          setLoading(false);
          return;
        }
        
        setCookProfile(profile);
        setProfileCompleted(true);
        
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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setProfileCompleted(true);
    // Reload the data after onboarding is complete
    if (user?.uid) {
      const loadData = async () => {
        const profile = await CooksService.getCookById(user.uid);
        setCookProfile(profile);
        
        // Load dishes and orders
        const [dishesData, ordersData] = await Promise.all([
          DishesService.getDishesByCook(user.uid),
          OrdersService.getOrdersByCook(user.uid)
        ]);
        
        setDishes(dishesData);
        setOrders(ordersData);
        
        // Update stats
        const totalEarnings = ordersData.reduce((sum, order) => sum + order.total, 0);
        const activeDishes = dishesData.filter(dish => dish.isAvailable).length;
        const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
        
        setStats({
          totalEarnings,
          activeDishes,
          pendingOrders,
          averageRating: profile?.rating || 0
        });
      };
      
      loadData();
    }
  };
  
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
        const dishesData = await DishesService.getDishesByCook(user!.uid);
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
      // If accepting order and cook has self-delivery, set driverId to cookerId
      if (newStatus === 'accepted' && cookProfile?.settings?.selfDelivery) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Update order with self-delivery info
          await OrdersService.updateOrder(orderId, {
            status: newStatus,
            driverId: user?.uid, // Cook is the driver
            isSelfDelivery: true
          });
          console.log('Order accepted with self-delivery');
          return;
        }
      }
      
      const success = await OrdersService.updateOrderStatus(orderId, newStatus);
      if (success) {
        console.log('Order status updated successfully');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAddDish = async (dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;
    
    try {
      const dishId = await DishesService.createDish(dishData);
      if (dishId) {
        console.log('Dish added successfully with ID:', dishId);
        
        // Use fallback method directly to avoid index issues when adding dishes
        console.log('Refreshing dishes list after adding new dish...');
        try {
          // Try the indexed method first
          const dishesData = await DishesService.getDishesByCook(user.uid);
          setDishes(dishesData);
          console.log('Successfully refreshed dishes using indexed query');
        } catch (indexError) {
          console.warn('Index not available, using fallback method:', indexError);
          // Use fallback method that doesn't require indexes
          try {
            const fallbackDishes = await DishesService.getDishesByCookFallback(user.uid);
            setDishes(fallbackDishes);
            console.log('Successfully refreshed dishes using fallback method');
          } catch (fallbackError) {
            console.error('Both indexed and fallback methods failed:', fallbackError);
            // As last resort, just reload the page data
            window.location.reload();
          }
        }
        
        // Try to refresh stats
        try {
          const statsData = await AnalyticsService.getCookStats(user.uid);
          setStats(statsData);
        } catch (statsError) {
          console.warn('Error refreshing stats:', statsError);
          // Manually update stats count
          setStats(prev => ({
            ...prev,
            activeDishes: prev.activeDishes + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error adding dish:', error);
      // Show user-friendly error message
      alert('Error al agregar el plato. Por favor, intenta de nuevo.');
    }
  };

  const handleToggleIndividualAvailability = async (dishId: string, isAvailable: boolean) => {
    try {
      const success = await DishesService.updateDish(dishId, { isAvailable });
      if (success) {
        // Update local state immediately for better UX
        setDishes(prev => prev.map(dish => 
          dish.id === dishId ? { ...dish, isAvailable } : dish
        ));
        
        // Refresh stats
        if (user?.uid) {
          const statsData = await AnalyticsService.getCookStats(user.uid);
          setStats(statsData);
        }
        
        console.log(`Dish ${isAvailable ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error updating dish availability:', error);
    }
  };

  const handleToggleAllAvailability = async (isAvailable: boolean) => {
    if (!user?.uid || dishes.length === 0) return;
    
    setIsUpdatingAvailability(true);
    
    try {
      // Update all dishes in parallel
      const updatePromises = dishes.map(dish => 
        DishesService.updateDish(dish.id, { isAvailable })
      );
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        // Update local state
        setDishes(prev => prev.map(dish => ({ ...dish, isAvailable })));
        
        // Refresh stats
        const statsData = await AnalyticsService.getCookStats(user.uid);
        setStats(statsData);
        
        console.log(`${successCount} dishes ${isAvailable ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error updating all dishes availability:', error);
    } finally {
      setIsUpdatingAvailability(false);
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

  const StatCard = ({ title, value, icon: Icon, trend, description }: any) => (
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

  const DishCard = ({ dish, onEdit, onToggleAvailability }: { 
    dish: Dish; 
    onEdit: (dish: Dish) => void;
    onToggleAvailability: (dishId: string, isAvailable: boolean) => void;
  }) => (
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
        <div className="flex gap-2 mb-3">
          <Button 
            variant={dish.isAvailable ? "default" : "outline"}
            size="sm" 
            className="flex-1"
            onClick={() => onToggleAvailability(dish.id, !dish.isAvailable)}
          >
            {dish.isAvailable ? (
              <>
                <Power className="h-4 w-4 mr-1" />
                Disponible
              </>
            ) : (
              <>
                <PowerOff className="h-4 w-4 mr-1" />
                No disponible
              </>
            )}
          </Button>
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

  // Enhanced Order Card Component for active orders
  const EnhancedOrderCard = ({ order, isPriority }: { order: Order; isPriority: boolean }) => {
    const getStatusColor = (status: Order['status']) => {
      switch (status) {
        case 'pending': return 'bg-red-100 text-red-800 border-red-300';
        case 'accepted': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'ready': return 'bg-green-100 text-green-800 border-green-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    };

    const getStatusText = (status: Order['status']) => {
      switch (status) {
        case 'pending': return 'Nuevo Pedido';
        case 'accepted': return 'Aceptado';
        case 'preparing': return 'Preparando';
        case 'ready': return 'Listo';
        default: return status;
      }
    };

    const getNextAction = (status: Order['status']) => {
      switch (status) {
        case 'pending': return { action: 'accepted', text: 'Aceptar Pedido', color: 'bg-green-600 hover:bg-green-700' };
        case 'accepted': return { action: 'preparing', text: 'Iniciar Preparación', color: 'bg-blue-600 hover:bg-blue-700' };
        case 'preparing': return { action: 'ready', text: 'Marcar como Listo', color: 'bg-orange-600 hover:bg-orange-700' };
        case 'ready': return null;
        default: return null;
      }
    };

    const nextAction = getNextAction(order.status);
    
    return (
      <Card className={`transition-all duration-300 hover:shadow-lg ${isPriority ? 'ring-2 ring-red-200 bg-red-50/50' : 'hover:shadow-md'}`}>
        <CardContent className="p-5">
          {/* Header with Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
                {isPriority && <span className="text-xl">🚨</span>}
              </div>
              <Badge className={`${getStatusColor(order.status)} text-xs font-medium border`}>
                {getStatusText(order.status)}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">${order.total.toLocaleString('es-CL')}</div>
              <div className="text-xs text-gray-500">
                {order.orderTime?.toDate()?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Platos ({order.dishes.length})</span>
            </div>
            <div className="space-y-1">
              {order.dishes.slice(0, 3).map((dish, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{dish.dishName} x{dish.quantity}</span>
                  <span className="font-medium text-gray-900">${(dish.price * dish.quantity).toLocaleString('es-CL')}</span>
                </div>
              ))}
              {order.dishes.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{order.dishes.length - 3} platos más
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 text-xs">{order.deliveryInfo.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 text-xs">{order.deliveryInfo.phone}</span>
            </div>
            {order.isSelfDelivery && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Truck className="h-4 w-4" />
                <span className="text-xs font-medium">Entregarás tú mismo</span>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          {order.deliveryInfo.instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-yellow-800">Instrucciones:</span>
                  <p className="text-sm text-yellow-700 mt-1">{order.deliveryInfo.instructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {nextAction && (
              <Button 
                onClick={() => handleUpdateOrderStatus(order.id, nextAction.action as Order['status'])}
                className={`flex-1 ${nextAction.color} text-white`}
                size="sm"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {nextAction.text}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`tel:${order.deliveryInfo.phone}`)}
              className="flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Compact Order Card for completed orders
  const CompactOrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm">{order.customerName}</span>
          </div>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
            {order.status === 'delivered' ? 'Entregado' : 'En camino'}
          </Badge>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          {order.dishes.length} plato{order.dishes.length > 1 ? 's' : ''}
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-green-600">${order.total.toLocaleString('es-CL')}</span>
          <span className="text-xs text-gray-500">
            {order.orderTime?.toDate()?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
          </span>
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
            {order.isSelfDelivery && (
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <Truck className="h-3 w-3" />
                <span>Entregarás tú mismo</span>
              </div>
            )}
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
            <div>Pedido: {order.orderTime?.toDate()?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) || 'N/A'}</div>
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

  // Show onboarding if profile is not complete
  if (showOnboarding) {
    return <CookerOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={cookProfile?.avatar || user.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo=' } />
                <AvatarFallback>{cookProfile?.displayName?.charAt(0) || user.displayName?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">¡Hola, {cookProfile?.displayName || user.displayName || 'Cocinero'}!</h1>
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
              <div className="flex items-center gap-3">
                {dishes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleAllAvailability(true)}
                      disabled={isUpdatingAvailability || dishes.every(dish => dish.isAvailable)}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {isUpdatingAvailability ? 'Actualizando...' : 'Activar Todos'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleAllAvailability(false)}
                      disabled={isUpdatingAvailability || dishes.every(dish => !dish.isAvailable)}
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      {isUpdatingAvailability ? 'Actualizando...' : 'Desactivar Todos'}
                    </Button>
                  </div>
                )}
                <Button onClick={() => setIsAddDishModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Dish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.length > 0 ? (
                dishes.map((dish) => (
                  <DishCard 
                    key={dish.id} 
                    dish={dish} 
                    onEdit={handleEditDish}
                    onToggleAvailability={handleToggleIndividualAvailability}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes platos aún</h3>
                  <p className="text-muted-foreground mb-4">Comienza agregando tu primer plato al menú</p>
                  <Button onClick={() => setIsAddDishModalOpen(true)}>Agregar Plato</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Enhanced Orders Header with Stats */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h2>
                  <p className="text-gray-600 mt-1">Administra todos tus pedidos de manera eficiente</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{orders.filter(o => o.status === 'pending').length}</div>
                    <div className="text-xs text-gray-500">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'preparing').length}</div>
                    <div className="text-xs text-gray-500">Preparando</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'ready').length}</div>
                    <div className="text-xs text-gray-500">Listos</div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-medium">{orders.length} Total</div>
                  <div className="text-xs text-gray-500">Hoy</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <div className="text-sm font-medium">${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-CL')}</div>
                  <div className="text-xs text-gray-500">Ingresos</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <div className="text-sm font-medium">4.8</div>
                  <div className="text-xs text-gray-500">Promedio</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Bell className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-medium">{orders.filter(o => ['pending', 'accepted'].includes(o.status)).length}</div>
                  <div className="text-xs text-gray-500">Urgentes</div>
                </div>
              </div>
            </div>

            {/* Orders by Status Sections */}
            {orders.length > 0 ? (
              <div className="space-y-8">
                {/* Pending Orders - Highest Priority */}
                {orders.filter(order => order.status === 'pending').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-red-700">🚨 Pedidos Pendientes</h3>
                        <p className="text-sm text-red-600">¡Requieren atención inmediata!</p>
                      </div>
                      <div className="ml-auto bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {orders.filter(order => order.status === 'pending').length} nuevos
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {orders.filter(order => order.status === 'pending').map((order) => (
                        <EnhancedOrderCard key={order.id} order={order} isPriority={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Accepted/Preparing Orders */}
                {orders.filter(order => ['accepted', 'preparing'].includes(order.status)).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ChefHat className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-700">👨‍🍳 En Preparación</h3>
                        <p className="text-sm text-blue-600">Pedidos que estás preparando</p>
                      </div>
                      <div className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {orders.filter(order => ['accepted', 'preparing'].includes(order.status)).length} activos
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {orders.filter(order => ['accepted', 'preparing'].includes(order.status)).map((order) => (
                        <EnhancedOrderCard key={order.id} order={order} isPriority={false} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready Orders */}
                {orders.filter(order => order.status === 'ready').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-700">✅ Listos para Entrega</h3>
                        <p className="text-sm text-green-600">Esperando ser recogidos</p>
                      </div>
                      <div className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {orders.filter(order => order.status === 'ready').length} completados
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {orders.filter(order => order.status === 'ready').map((order) => (
                        <EnhancedOrderCard key={order.id} order={order} isPriority={false} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Orders - Collapsible */}
                {orders.filter(order => ['delivering', 'delivered'].includes(order.status)).length > 0 && (
                  <div className="border-t pt-6">
                    <details className="group">
                      <summary className="flex items-center gap-3 mb-4 cursor-pointer">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-700">📦 Historial Reciente</h3>
                          <p className="text-sm text-gray-600">Pedidos completados hoy</p>
                        </div>
                        <div className="ml-auto bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {orders.filter(order => ['delivering', 'delivered'].includes(order.status)).length} completados
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
                        {orders.filter(order => ['delivering', 'delivered'].includes(order.status)).map((order) => (
                          <CompactOrderCard key={order.id} order={order} />
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <ChefHat className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Todo tranquilo por aquí!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No tienes pedidos pendientes en este momento. Los nuevos pedidos aparecerán aquí 
                  tan pronto como los clientes hagan sus órdenes.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Ver mis platos
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar nuevo plato
                  </Button>
                </div>
              </div>
            )}
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
        dish={editingDish}
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
        onSave={async (settings: any) => {
          try {
            // Update cook profile with new settings
            await CooksService.updateCook(user?.uid || '', {
              displayName: settings.displayName,
              bio: settings.bio,
              avatar: settings.avatar,
              coverImage: settings.coverImage,
              location: {
                ...cookProfile?.location,
                address: {
                  ...cookProfile?.location?.address,
                  fullAddress: settings.location
                }
              },
              deliveryRadius: settings.deliveryRadius,
              specialties: settings.specialties,
              languages: settings.languages,
              settings: {
                autoAcceptOrders: settings.autoAcceptOrders,
                maxOrdersPerDay: settings.maxOrdersPerDay,
                selfDelivery: settings.selfDelivery,
                workingHours: settings.workingHours,
                workingDays: settings.workingDays,
                currency: settings.currency,
                timezone: settings.timezone,
                language: settings.language
              }
            });
            
            // Refresh cook profile
            const profile = await CooksService.getCookById(user?.uid || '');
            setCookProfile(profile);
            console.log('Settings saved successfully');
          } catch (error) {
            console.error('Error saving settings:', error);
          }
          setIsSettingsModalOpen(false);
        }}
        currentUser={user}
      />

      {/* Add Dish Modal */}
      <AddDishModal
        isOpen={isAddDishModalOpen}
        onClose={() => setIsAddDishModalOpen(false)}
        onSave={handleAddDish}
        cookerId={user?.uid || ''}
        cookerName={cookProfile?.displayName || user?.displayName || 'Cocinero'}
        cookerAvatar={cookProfile?.avatar || user?.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo='}
        cookerRating={cookProfile?.rating || 0}
      />
    </div>
  );
}
