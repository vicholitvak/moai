'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminService, DishesService, OrdersService } from '@/lib/firebase/dataService';
import AuthService from '@/lib/services/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Cook, Driver, Dish, Order } from '@/lib/firebase/dataService';
import { LazyDriverTrackingMap } from '@/components/lazy/LazyDriverTrackingMap';
import { LazyAnalyticsDashboard } from '@/components/lazy/LazyAnalyticsDashboard';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { 
  Users,
  ChefHat,
  Car,
  ShoppingBag,
  Settings,
  Eye,
  LogOut,
  Crown,
  BarChart3,
  Database,
  Shield,
  RefreshCw,
  UserCheck,
  Activity,
  Trash2,
  AlertTriangle,
  Loader2,
  MapPin,
  ToggleLeft,
  ToggleRight,
  X,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  Search,
  Calendar,
  Download,
  PieChart,
  TrendingUp,
  Bell,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AdminStats {
  totalUsers: number;
  totalCooks: number;
  totalDrivers: number;
  totalClients: number;
  totalOrders: number;
  totalDishes: number;
  todayRevenue: number;
  activeOrders: number;
}

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [reportsPeriod, setReportsPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'order' | 'user' | 'system';
    title: string;
    message: string;
    time: Date;
    read: boolean;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Administrative settings state
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(false);
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState(0);
  const [serviceCommissionRate, setServiceCommissionRate] = useState(12);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCooks: 0,
    totalDrivers: 0,
    totalClients: 0,
    totalOrders: 0,
    totalDishes: 0,
    todayRevenue: 0,
    activeOrders: 0
  });

  // Check if user is admin using secure AuthService
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  
  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }

      try {
        const adminStatus = await AuthService.checkAdminStatus(user);
        setIsAdmin(adminStatus);
        
        // Bootstrap admin for super admin emails if not already admin
        if (!adminStatus && user.email && ['admin@moai.com', 'superadmin@moai.com'].includes(user.email)) {
          const bootstrapped = await AuthService.bootstrapAdmin(user);
          if (bootstrapped) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const switchRole = async (newRole: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      // Navigate directly to the appropriate dashboard with full page reload
      let targetUrl = '/dishes'; // default
      switch (newRole) {
        case 'Client':
          targetUrl = '/dishes';
          break;
        case 'Cooker':
          targetUrl = '/cooker/dashboard';
          break;
        case 'Driver':
          targetUrl = '/driver/dashboard';
          break;
        default:
          targetUrl = '/dishes';
      }
      
      // Use window.location.href for full page navigation to ensure auth context refresh
      window.location.href = targetUrl;
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminCheckLoading && (!user || !isAdmin)) {
      router.push('/');
    } else if (!adminCheckLoading && user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin, adminCheckLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { cooks, drivers, dishes } = await AdminService.getAllUsers();
      setCooks(cooks);
      setDrivers(drivers);
      setDishes(dishes);
      
      // Load all orders for order management
      try {
        const allOrders = await OrdersService.getAllOrders();
        setOrders(allOrders);
      } catch (error) {
        console.warn('Could not load orders:', error);
        setOrders([]);
      }
      
      // Try to get additional statistics
      let totalOrders = 0;
      let activeOrders = 0;
      let todayRevenue = 0;
      let totalClients = 0;
      
      try {
        // Get order statistics if OrdersService is available
        const ordersStats = await AdminService.getOrdersStatistics();
        totalOrders = ordersStats.totalOrders || 0;
        activeOrders = ordersStats.activeOrders || 0;
        todayRevenue = ordersStats.todayRevenue || 0;
      } catch (error) {
        console.warn('Order statistics not available:', error);
      }
      
      try {
        // Get user count if UserService is available
        const usersStats = await AdminService.getUsersStatistics();
        totalClients = usersStats.totalClients || 0;
      } catch (error) {
        console.warn('User statistics not available:', error);
      }
      
      // Update stats with real data
      setStats({
        totalCooks: cooks.length,
        totalDrivers: drivers.length,
        totalDishes: dishes.length,
        totalUsers: cooks.length + drivers.length + totalClients,
        totalOrders,
        activeOrders,
        todayRevenue,
        totalClients
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCook = async (cookId: string, cookName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al cocinero "${cookName}"? Esto también eliminará todos sus platos.`)) {
      return;
    }

    setDeletingId(cookId);
    try {
      const success = await AdminService.deleteCook(cookId, user?.uid || '');
      if (success) {
        setCooks(prev => prev.filter(cook => cook.id !== cookId));
        setDishes(prev => prev.filter(dish => dish.cookerId !== cookId));
        toast.success(`Cocinero "${cookName}" eliminado exitosamente`);
      } else {
        toast.error('Error al eliminar el cocinero');
      }
    } catch (error) {
      console.error('Error deleting cook:', error);
      toast.error('Error al eliminar el cocinero');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al conductor "${driverName}"?`)) {
      return;
    }

    setDeletingId(driverId);
    try {
      const success = await AdminService.deleteDriver(driverId, user?.uid || '');
      if (success) {
        setDrivers(prev => prev.filter(driver => driver.id !== driverId));
        toast.success(`Conductor "${driverName}" eliminado exitosamente`);
      } else {
        toast.error('Error al eliminar el conductor');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Error al eliminar el conductor');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el plato "${dishName}"?`)) {
      return;
    }

    console.log('Attempting to delete dish:', {
      dishId,
      dishName,
      adminUserId: user?.uid || '',
      adminEmail: user?.email || '',
      isAdmin
    });

    setDeletingId(dishId);
    try {
      const success = await AdminService.deleteDish(dishId, user?.uid || '');
      if (success) {
        setDishes(prev => prev.filter(dish => dish.id !== dishId));
        toast.success(`Plato "${dishName}" eliminado exitosamente`);
        console.log('Dish deleted successfully');
      } else {
        console.error('Dish deletion failed - service returned false');
        toast.error('Error al eliminar el plato');
      }
    } catch (error) {
      console.error('Error deleting dish:', error);
      console.error('Error details:', {
        code: error instanceof Error && 'code' in error ? (error as Error & { code: string }).code : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        dishId,
        adminId: user?.uid
      });
      toast.error(`Error al eliminar el plato: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleDishAvailability = async (dishId: string, dishName: string, currentAvailability: boolean) => {
    setDeletingId(dishId); // Reuse loading state
    try {
      const success = await DishesService.updateDish(dishId, { isAvailable: !currentAvailability });
      if (success) {
        setDishes(prev => (prev || []).map(dish => 
          dish.id === dishId 
            ? { ...dish, isAvailable: !currentAvailability }
            : dish
        ));
        toast.success(`"${dishName}" ${!currentAvailability ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        toast.error('Error al actualizar el plato');
      }
    } catch (error) {
      console.error('Error toggling dish availability:', error);
      toast.error('Error al actualizar el plato');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleSwitch = (role: 'client' | 'cooker' | 'driver') => {
    // For now, we'll comment out direct navigation to prevent admin profile creation
    // Instead, we should implement proper admin views for each entity type
    toast.info(`Funcionalidad de prueba de rol será implementada próximamente. Por ahora, gestiona ${role}s desde esta misma página.`);
    
    // TODO: Implement proper admin preview mode without role switching
    // switch (role) {
    //   case 'client':
    //     router.push('/dishes?admin_preview=true');
    //     break;
    //   case 'cooker':
    //     router.push('/cooker/dashboard?admin_preview=true');
    //     break;
    //   case 'driver':
    //     router.push('/driver/dashboard?admin_preview=true');
    //     break;
    // }
  };

  const handleUpdateDeliveryFee = async () => {
    setIsUpdatingSettings(true);
    try {
      // Here you would typically save to a settings collection in Firestore
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        deliveryFeeEnabled 
          ? `Tarifa de entrega actualizada a ${formatPrice(deliveryFeeAmount)}`
          : 'Entrega gratuita activada'
      );
    } catch (error) {
      console.error('Error updating delivery fee:', error);
      toast.error('Error al actualizar la tarifa de entrega');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleUpdateServiceCommission = async () => {
    setIsUpdatingSettings(true);
    try {
      // Here you would typically save to a settings collection in Firestore
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Comisión de servicio actualizada a ${serviceCommissionRate}%`);
    } catch (error) {
      console.error('Error updating service commission:', error);
      toast.error('Error al actualizar la comisión de servicio');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?')) {
      return;
    }

    setIsUpdatingSettings(true);
    try {
      // Reset to default values
      setDeliveryFeeEnabled(false);
      setDeliveryFeeAmount(0);
      setServiceCommissionRate(12);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configuración restablecida a valores por defecto');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Error al restablecer la configuración');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Financial report calculations
  const getFilteredOrdersByPeriod = (period: string) => {
    const now = new Date();
    const startOfPeriod = new Date();
    
    switch (period) {
      case 'today':
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startOfPeriod.setDate(now.getDate() - 7);
        break;
      case 'month':
        startOfPeriod.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startOfPeriod.setFullYear(now.getFullYear() - 1);
        break;
    }

    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : 
                      (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || 0));
      return orderDate >= startOfPeriod && order.status === 'delivered';
    });
  };

  const calculateFinancialMetrics = (period: string) => {
    const filteredOrders = getFilteredOrdersByPeriod(period);
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCommission = totalRevenue * (serviceCommissionRate / 100);
    const netRevenue = totalRevenue - totalCommission;
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Calculate revenue by cook
    const cookRevenue = filteredOrders.reduce((acc, order) => {
      const cookId = order.cookerId;
      const cookName = cooks.find(c => c.id === cookId)?.displayName || cookId;
      if (!acc[cookName]) {
        acc[cookName] = { revenue: 0, orders: 0 };
      }
      acc[cookName].revenue += order.total;
      acc[cookName].orders += 1;
      return acc;
    }, {} as Record<string, { revenue: number; orders: number }>);

    // Calculate daily revenue for the period
    const dailyRevenue = filteredOrders.reduce((acc, order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : 
                      (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || 0));
      const dateKey = orderDate.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalCommission,
      netRevenue,
      averageOrderValue,
      totalOrders: filteredOrders.length,
      cookRevenue: Object.entries(cookRevenue)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 10),
      dailyRevenue
    };
  };

  // Generate notifications based on current data
  const generateNotifications = useCallback(() => {
    const newNotifications = [];
    const now = new Date();

    // Check for pending orders
    const pendingOrders = orders.filter(order => order.status === 'pending');
    if (pendingOrders.length > 0) {
      newNotifications.push({
        id: 'pending-orders',
        type: 'order' as const,
        title: 'Órdenes Pendientes',
        message: `${pendingOrders.length} orden${pendingOrders.length > 1 ? 'es' : ''} esperando aceptación`,
        time: now,
        read: false
      });
    }

    // Check for orders taking too long
    const oldOrders = orders.filter(order => {
      const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : 
                      (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || 0));
      const hoursSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
      return ['accepted', 'preparing'].includes(order.status) && hoursSinceOrder > 2;
    });
    
    if (oldOrders.length > 0) {
      newNotifications.push({
        id: 'delayed-orders',
        type: 'order' as const,
        title: 'Órdenes Demoradas',
        message: `${oldOrders.length} orden${oldOrders.length > 1 ? 'es' : ''} llevan más de 2 horas en preparación`,
        time: now,
        read: false
      });
    }

    // Check for new registrations today
    const newCooksToday = cooks.filter(cook => {
      const cookDate = cook.createdAt?.toDate ? cook.createdAt.toDate() : 
                     (cook.createdAt instanceof Date ? cook.createdAt : new Date(cook.createdAt || 0));
      return cookDate.toDateString() === now.toDateString();
    });

    if (newCooksToday.length > 0) {
      newNotifications.push({
        id: 'new-cooks',
        type: 'user' as const,
        title: 'Nuevos Cocineros',
        message: `${newCooksToday.length} cocinero${newCooksToday.length > 1 ? 's' : ''} se ha${newCooksToday.length > 1 ? 'n' : ''} registrado hoy`,
        time: now,
        read: false
      });
    }

    return newNotifications;
  }, [orders, cooks]);

  // Update notifications when data changes
  useEffect(() => {
    if (orders.length > 0 || cooks.length > 0) {
      const newNotifications = generateNotifications();
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [orders, cooks, generateNotifications]);

  const StatCard = ({ title, value, icon: Icon, trend, description, color = "text-primary" }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    description?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500">{trend}</span> {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const RoleTestCard = ({ 
    title, 
    description, 
    icon: Icon, 
    role, 
    features, 
    color 
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    role: 'client' | 'cooker' | 'driver';
    features: string[];
    color: string;
  }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">Funcionalidades para probar:</h4>
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button 
            onClick={() => handleRoleSwitch(role)}
            className="w-full mt-4"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Probar como {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while checking admin status
  if (adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Verificando Acceso</h2>
            <p className="text-muted-foreground">
              Comprobando permisos de administrador...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">
              Solo los administradores pueden acceder a esta página.
            </p>
            <Button onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Mobile-Responsive Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title - Responsive */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex-shrink-0">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Panel de Administrador</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  ¡Hola, {user.displayName || user.email}!
                </p>
              </div>
            </div>

            {/* Desktop Menu - Hidden on Mobile */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notificaciones</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNotifications(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay notificaciones</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 hover:bg-gray-50 border-b last:border-b-0 ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'order' ? 'bg-orange-500' :
                                  notification.type === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.time.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          }}
                        >
                          Marcar todas como leídas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <ThemeToggle />
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

            {/* Mobile Menu Button - Visible on Mobile */}
            <div className="lg:hidden">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {showMobileMenu && (
            <div className="lg:hidden mt-4 pb-2 border-t pt-4">
              <div className="space-y-2">
                {/* Mobile User Info */}
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>

                {/* Mobile Notifications */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowMobileMenu(false);
                    }}
                    className="w-full justify-start relative"
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    Notificaciones
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </Button>

                  {/* Mobile Notifications Dropdown */}
                  {showNotifications && (
                    <div className="mt-2 w-full bg-white border rounded-lg shadow-lg">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Notificaciones</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNotifications(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay notificaciones</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {notifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 hover:bg-gray-50 border-b last:border-b-0 ${
                                  !notification.read ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    notification.type === 'order' ? 'bg-orange-500' :
                                    notification.type === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs truncate">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.time.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                          >
                            Marcar todas como leídas
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Settings */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </Button>

                {/* Mobile Logout */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowMobileMenu(false);
                    logout();
                  }}
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Mobile-Responsive Navigation Tabs */}
        <div className="mb-6">
          {/* Mobile Tab Selector (Dropdown) */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="overview">📊 Overview</option>
              <option value="orders">📦 Gestión de Órdenes</option>
              <option value="reports">💰 Reportes Financieros</option>
              <option value="role-testing">🎭 Prueba de Roles</option>
              <option value="data-management">🗄️ Gestión de Datos</option>
              <option value="driver-tracking">🚗 Seguimiento de Conductores</option>
              <option value="analytics">📈 Analytics</option>
              <option value="management">⚙️ Configuración</option>
            </select>
          </div>

          {/* Desktop/Tablet Scrollable Tabs */}
          <div className="hidden sm:block">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'orders', label: 'Órdenes', icon: '📦' },
                { id: 'reports', label: 'Reportes', icon: '💰' },
                { id: 'role-testing', label: 'Roles', icon: '🎭' },
                { id: 'data-management', label: 'Datos', icon: '🗄️' },
                { id: 'driver-tracking', label: 'Conductores', icon: '🚗' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'management', label: 'Config', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Usuarios"
                value={stats.totalUsers.toLocaleString()}
                icon={Users}
                trend="+12%"
                description="este mes"
                color="text-blue-600"
              />
              <StatCard
                title="Ingresos Hoy"
                value={`$${stats.todayRevenue.toLocaleString('es-CL')}`}
                icon={BarChart3}
                trend="+8%"
                description="vs ayer"
                color="text-green-600"
              />
              <StatCard
                title="Órdenes Activas"
                value={stats.activeOrders}
                icon={Activity}
                trend="+5"
                description="en tiempo real"
                color="text-orange-600"
              />
              <StatCard
                title="Total Platos"
                value={stats.totalDishes}
                icon={Database}
                trend="+23"
                description="esta semana"
                color="text-purple-600"
              />
            </div>

            {/* User Distribution */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Distribución de Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                        <span>Clientes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stats.totalClients}</span>
                        <Badge variant="secondary">{((stats.totalClients / stats.totalUsers) * 100).toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-green-500" />
                        <span>Cocineros</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stats.totalCooks}</span>
                        <Badge variant="secondary">{((stats.totalCooks / stats.totalUsers) * 100).toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-purple-500" />
                        <span>Conductores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stats.totalDrivers}</span>
                        <Badge variant="secondary">{((stats.totalDrivers / stats.totalUsers) * 100).toFixed(1)}%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Nuevo cocinero registrado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>15 nuevas órdenes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>3 conductores en línea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>Nuevo plato agregado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rendimiento del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Tiempo de respuesta</span>
                      <Badge className="bg-green-100 text-green-800">Excelente</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Disponibilidad</span>
                      <span className="font-semibold">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Órdenes completadas</span>
                      <span className="font-semibold">98.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Satisfacción promedio</span>
                      <span className="font-semibold">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Order Management Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
                <p className="text-muted-foreground">Monitorear y gestionar todas las órdenes en tiempo real</p>
              </div>
              <Button onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

            {/* Order Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {orders.filter(order => ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(order.status)).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {orders.filter(order => {
                      const today = new Date();
                      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || 0));
                      return order.status === 'delivered' && orderDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {formatPrice(orders.filter(order => {
                      const today = new Date();
                      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || 0));
                      return order.status === 'delivered' && orderDate.toDateString() === today.toDateString();
                    }).reduce((sum, order) => sum + order.total, 0))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={ordersFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdersFilter('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={ordersFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdersFilter('pending')}
                >
                  Pendientes
                </Button>
                <Button
                  variant={ordersFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdersFilter('active')}
                >
                  Activas
                </Button>
                <Button
                  variant={ordersFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdersFilter('completed')}
                >
                  Completadas
                </Button>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente, o cocinero..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {orders
                .filter(order => {
                  // Filter by status
                  if (ordersFilter === 'pending') return order.status === 'pending';
                  if (ordersFilter === 'active') return ['accepted', 'preparing', 'ready', 'delivering'].includes(order.status);
                  if (ordersFilter === 'completed') return ['delivered', 'cancelled'].includes(order.status);
                  return true;
                })
                .filter(order => {
                  // Filter by search
                  if (!ordersSearch) return true;
                  const searchLower = ordersSearch.toLowerCase();
                  return (
                    order.id.toLowerCase().includes(searchLower) ||
                    order.customerName?.toLowerCase().includes(searchLower) ||
                    order.cookerId?.toLowerCase().includes(searchLower)
                  );
                })
                .slice(0, 50) // Limit to 50 orders for performance
                .map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                              <Badge variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'cancelled' ? 'destructive' :
                                ['preparing', 'ready', 'delivering'].includes(order.status) ? 'secondary' :
                                'outline'
                              }>
                                {order.status === 'pending' && 'Pendiente'}
                                {order.status === 'accepted' && 'Aceptada'}
                                {order.status === 'preparing' && 'Preparando'}
                                {order.status === 'ready' && 'Lista'}
                                {order.status === 'delivering' && 'En camino'}
                                {order.status === 'delivered' && 'Entregada'}
                                {order.status === 'cancelled' && 'Cancelada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {order.customerName} | Cocinero: {cooks.find(c => c.id === order.cookerId)?.displayName || order.cookerId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 
                               (order.createdAt instanceof Date ? order.createdAt.toLocaleString() : new Date(order.createdAt || 0).toLocaleString())}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.dishes?.length || 0} item{(order.dishes?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Update order status logic here
                                  console.log('Force accept order:', order.id);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {['accepted', 'preparing', 'ready'].includes(order.status) && order.driverId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Track delivery logic here
                                  console.log('Track delivery:', order.id);
                                }}
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // View order details logic here
                                console.log('View order details:', order.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {orders.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay órdenes</h3>
                  <p className="text-muted-foreground">Las órdenes aparecerán aquí cuando los clientes empiecen a hacer pedidos.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Financial Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Reportes Financieros</h2>
                <p className="text-muted-foreground">Análisis detallado de ingresos, comisiones y métricas financieras</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={loadData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              <Button
                variant={reportsPeriod === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportsPeriod('today')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Hoy
              </Button>
              <Button
                variant={reportsPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportsPeriod('week')}
              >
                Últimos 7 días
              </Button>
              <Button
                variant={reportsPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportsPeriod('month')}
              >
                Último mes
              </Button>
              <Button
                variant={reportsPeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportsPeriod('year')}
              >
                Último año
              </Button>
            </div>

            {(() => {
              const metrics = calculateFinancialMetrics(reportsPeriod);
              
              return (
                <>
                  {/* Financial Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(metrics.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                          {metrics.totalOrders} órdenes completadas
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Comisiones Generadas</CardTitle>
                          <PieChart className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(metrics.totalCommission)}</div>
                        <p className="text-xs text-muted-foreground">
                          {serviceCommissionRate}% de comisión
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Ingreso Neto Cocineros</CardTitle>
                          <ChefHat className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(metrics.netRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                          Después de comisiones
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Valor Promedio Orden</CardTitle>
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(metrics.averageOrderValue)}</div>
                        <p className="text-xs text-muted-foreground">
                          Por orden completada
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Performing Cooks */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ChefHat className="h-5 w-5" />
                          Top Cocineros por Ingresos
                        </CardTitle>
                        <CardDescription>
                          Ranking de cocineros en el período seleccionado
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {metrics.cookRevenue.slice(0, 5).map(([cookName, data], index) => (
                            <div key={cookName} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{cookName}</p>
                                  <p className="text-sm text-muted-foreground">{data.orders} órdenes</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatPrice(data.revenue)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatPrice(data.revenue * (serviceCommissionRate / 100))} comisión
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Desglose de Ingresos
                        </CardTitle>
                        <CardDescription>
                          Distribución de ingresos por categoría
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Ingresos Brutos</span>
                            <span className="font-semibold">{formatPrice(metrics.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-600">Comisiones de Moai</span>
                            <span className="font-semibold text-blue-600">-{formatPrice(metrics.totalCommission)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-sm font-medium">Ingresos Netos Cocineros</span>
                            <span className="font-semibold text-green-600">{formatPrice(metrics.netRevenue)}</span>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Tasa de comisión actual</span>
                              <span className="font-medium">{serviceCommissionRate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Órdenes completadas</span>
                              <span className="font-medium">{metrics.totalOrders}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Valor promedio por orden</span>
                              <span className="font-medium">{formatPrice(metrics.averageOrderValue)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Revenue Chart (Simple representation) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Ingresos Diarios
                      </CardTitle>
                      <CardDescription>
                        Evolución de ingresos en el período seleccionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(metrics.dailyRevenue)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(-7) // Show last 7 days
                          .map(([date, revenue]) => (
                            <div key={date} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <span className="text-sm font-medium">
                                {new Date(date).toLocaleDateString('es-CL', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="w-20 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.max(10, (revenue / Math.max(...Object.values(metrics.dailyRevenue))) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="font-semibold text-sm w-20 text-right">
                                  {formatPrice(revenue)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {/* Role Testing Tab */}
        {activeTab === 'role-testing' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Prueba de Roles</h2>
              <p className="text-muted-foreground">
                Cambia entre diferentes roles para probar toda la funcionalidad de la aplicación
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <RoleTestCard
                title="Cliente"
                description="Explora y ordena comida"
                icon={ShoppingBag}
                role="client"
                color="bg-blue-500"
                features={[
                  "Navegar platos disponibles",
                  "Buscar y filtrar comida",
                  "Ver perfiles de cocineros",
                  "Agregar items al carrito",
                  "Proceso de checkout",
                  "Ver detalles de platos",
                  "Sistema de favoritos"
                ]}
              />

              <RoleTestCard
                title="Cocinero"
                description="Gestiona tu cocina y órdenes"
                icon={ChefHat}
                role="cooker"
                color="bg-green-500"
                features={[
                  "Dashboard de ganancias",
                  "Gestión de platos",
                  "Agregar nuevos platos",
                  "Toggle de disponibilidad",
                  "Ver órdenes pendientes",
                  "Actualizar estado de órdenes",
                  "Analytics de rendimiento",
                  "Configuración de perfil"
                ]}
              />

              <RoleTestCard
                title="Conductor"
                description="Maneja entregas y rutas"
                icon={Car}
                role="driver"
                color="bg-purple-500"
                features={[
                  "Dashboard de entregas",
                  "Ver entregas asignadas",
                  "Actualizar estado de entrega",
                  "Navegación GPS",
                  "Contactar clientes",
                  "Seguimiento de ganancias",
                  "Historial de entregas",
                  "Toggle online/offline"
                ]}
              />
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Instrucciones de Prueba
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Como probar:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Haz clic en &quot;Probar como [Rol]&quot; para navegar al dashboard correspondiente</li>
                      <li>• Todas las funcionalidades están disponibles con datos de prueba</li>
                      <li>• Puedes volver al panel admin en cualquier momento</li>
                      <li>• Los cambios se reflejan en tiempo real</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Datos de prueba:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Platos y cocineros chilenos realistas</li>
                      <li>• Órdenes y entregas simuladas</li>
                      <li>• Precios en pesos chilenos (CLP)</li>
                      <li>• Direcciones de Santiago</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data-management' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Gestión de Datos</h2>
                <p className="text-muted-foreground">Administrar cocineros, conductores y platos</p>
              </div>
              <Button onClick={loadData} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Actualizar Datos
              </Button>
            </div>

            {/* Cooks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Cocineros ({(cooks || []).length})
                </CardTitle>
                <CardDescription>Gestionar perfiles de cocineros y sus platos</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (cooks || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay cocineros registrados</p>
                ) : (
                  <div className="space-y-3">
                    {(cooks || []).map((cook) => (
                      <div key={cook.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={cook.avatar} />
                            <AvatarFallback>
                              <ChefHat className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{cook.displayName}</p>
                            <p className="text-sm text-muted-foreground">{cook.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                ⭐ {cook.rating.toFixed(1)}
                              </Badge>
                              <Badge variant="secondary">
                                {dishes.filter(d => d.cookerId === cook.id).length} platos
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCook(cook.id, cook.displayName)}
                          disabled={deletingId === cook.id}
                        >
                          {deletingId === cook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drivers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Conductores ({(drivers || []).length})
                </CardTitle>
                <CardDescription>Gestionar perfiles de conductores</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (drivers || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay conductores registrados</p>
                ) : (
                  <div className="space-y-3">
                    {(drivers || []).map((driver) => (
                      <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={driver.avatar} />
                            <AvatarFallback>
                              <Car className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{driver.displayName}</p>
                            <p className="text-sm text-muted-foreground">{driver.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                ⭐ {driver.rating.toFixed(1)}
                              </Badge>
                              <Badge variant={driver.isOnline ? 'default' : 'secondary'}>
                                {driver.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
                              </Badge>
                              <Badge variant="outline">
                                {driver.vehicleType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDriver(driver.id, driver.displayName)}
                          disabled={deletingId === driver.id}
                        >
                          {deletingId === driver.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dishes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Platos ({(dishes || []).length})
                </CardTitle>
                <CardDescription>Gestionar platos disponibles en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (dishes || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay platos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {(dishes || []).map((dish) => {
                      const cook = (cooks || []).find(c => c.id === dish.cookerId);
                      return (
                        <div key={dish.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={dish.image} 
                              alt={dish.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgyOFYyOEgyMFYyMFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                              }}
                            />
                            <div>
                              <p className="font-medium">{dish.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Por: {cook?.displayName || 'Cocinero desconocido'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {formatPrice(dish.price)}
                                </Badge>
                                <Badge variant="outline">
                                  ⭐ {dish.rating?.toFixed(1) || 'N/A'}
                                </Badge>
                                <Badge variant={dish.isAvailable ? 'default' : 'secondary'}>
                                  {dish.isAvailable ? '✅ Disponible' : '❌ No disponible'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleDishAvailability(dish.id, dish.name, dish.isAvailable)}
                              disabled={deletingId === dish.id}
                              className={dish.isAvailable ? 'text-green-600 hover:text-green-700 border-green-200' : 'text-gray-600 hover:text-gray-700'}
                            >
                              {deletingId === dish.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : dish.isAvailable ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDish(dish.id, dish.name)}
                              disabled={deletingId === dish.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning Card */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1">Advertencia</h4>
                    <p className="text-sm text-orange-700">
                      Al eliminar un cocinero, todos sus platos también serán eliminados permanentemente. 
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Driver Tracking Tab */}
        {activeTab === 'driver-tracking' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Seguimiento de Conductores</h2>
              <p className="text-muted-foreground">Monitor en tiempo real la ubicación y estado de todos los conductores</p>
            </div>
            
            <LazyDriverTrackingMap drivers={drivers} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">Métricas y estadísticas del sistema</p>
            </div>
            
            <LazyAnalyticsDashboard />
          </div>
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
              <p className="text-muted-foreground">Configurar tarifas de entrega, comisiones y otros ajustes del sistema</p>
            </div>
            
            {/* App Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Tarifas
                </CardTitle>
                <CardDescription>Gestionar tarifas de entrega y comisiones del servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Delivery Fee Settings */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Tarifa de Entrega
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={deliveryFeeEnabled ? "default" : "secondary"} 
                            className={deliveryFeeEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}
                          >
                            {deliveryFeeEnabled ? "ACTIVADO" : "DESACTIVADO (Entrega Gratis)"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tarifa Base</label>
                        <p className="text-sm text-muted-foreground">
                          {deliveryFeeEnabled ? formatPrice(deliveryFeeAmount) : "$0 CLP (configurado como gratuito)"}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Configuración Actual</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Entrega completamente gratuita para todos los pedidos</li>
                        <li>• Los cocineros no pagan tarifa de entrega</li>
                        <li>• Los clientes reciben entrega sin costo adicional</li>
                        <li>• Configuración ideal para atraer más pedidos</li>
                      </ul>
                    </div>
                  </div>

                  {/* Service Fee Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Comisión de Servicio
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ACTIVADO
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Porcentaje</label>
                        <p className="text-sm text-muted-foreground">{serviceCommissionRate}% del subtotal del pedido</p>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Comisión Activa</h5>
                      <p className="text-sm text-green-700">
                        Se aplica un {serviceCommissionRate}% de comisión sobre el subtotal de cada pedido para cubrir 
                        costos operativos de la plataforma.
                      </p>
                    </div>
                  </div>

                  {/* Active Admin Controls */}
                  <div className="space-y-6 pt-4 border-t">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Controles Administrativos
                    </h4>
                    
                    {/* Delivery Fee Control */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Modificar Tarifa de Entrega</Label>
                          <p className="text-sm text-muted-foreground">
                            Activar/desactivar y configurar la tarifa de entrega
                          </p>
                        </div>
                        <Switch
                          checked={deliveryFeeEnabled}
                          onCheckedChange={setDeliveryFeeEnabled}
                          disabled={isUpdatingSettings}
                        />
                      </div>
                      
                      {deliveryFeeEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="deliveryFee">Monto de la tarifa (CLP)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="deliveryFee"
                              type="number"
                              min="0"
                              step="100"
                              value={deliveryFeeAmount}
                              onChange={(e) => setDeliveryFeeAmount(Number(e.target.value))}
                              placeholder="Ej: 2000"
                              disabled={isUpdatingSettings}
                            />
                            <Button
                              onClick={handleUpdateDeliveryFee}
                              disabled={isUpdatingSettings}
                              className="whitespace-nowrap"
                            >
                              {isUpdatingSettings ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Settings className="h-4 w-4 mr-2" />
                              )}
                              Actualizar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {!deliveryFeeEnabled && (
                        <div className="flex justify-end">
                          <Button
                            onClick={handleUpdateDeliveryFee}
                            disabled={isUpdatingSettings}
                            variant="outline"
                          >
                            {isUpdatingSettings ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Settings className="h-4 w-4 mr-2" />
                            )}
                            Confirmar Entrega Gratis
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Service Commission Control */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Ajustar Comisión de Servicio</Label>
                        <p className="text-sm text-muted-foreground">
                          Configurar el porcentaje de comisión aplicado a cada pedido
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="serviceCommission">Porcentaje de comisión (%)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="serviceCommission"
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={serviceCommissionRate}
                            onChange={(e) => setServiceCommissionRate(Number(e.target.value))}
                            placeholder="Ej: 12"
                            disabled={isUpdatingSettings}
                          />
                          <Button
                            onClick={handleUpdateServiceCommission}
                            disabled={isUpdatingSettings}
                            className="whitespace-nowrap"
                          >
                            {isUpdatingSettings ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <BarChart3 className="h-4 w-4 mr-2" />
                            )}
                            Actualizar
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rango recomendado: 8% - 15%. Valor actual aplicado en nuevos pedidos.
                        </p>
                      </div>
                    </div>

                    {/* Reset Configuration */}
                    <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div>
                        <Label className="text-base font-medium text-orange-800">Restablecer Configuración</Label>
                        <p className="text-sm text-orange-700">
                          Volver a los valores predeterminados del sistema
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleResetSettings}
                        disabled={isUpdatingSettings}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        {isUpdatingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Restablecer Configuración
                      </Button>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">✅ Controles Activos</h5>
                      <p className="text-sm text-green-700">
                        Los controles administrativos están ahora disponibles y funcionales. 
                        Los cambios se aplicarán inmediatamente en la plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Actualizar Datos</p>
                    <p className="text-xs text-muted-foreground">Refrescar información</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={loadData}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
                </Button>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Base de Datos</p>
                    <p className="text-xs text-muted-foreground">Estado: Activa</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Verificar
                </Button>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Seguridad</p>
                    <p className="text-xs text-muted-foreground">Reglas activas</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Configurar
                </Button>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Sistema</p>
                    <p className="text-xs text-muted-foreground">Funcionando</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Monitorear
                </Button>
              </Card>
            </div>

            {/* Main Management Sections */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription>Administrar cuentas, roles y permisos de usuarios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
                      <p className="text-sm text-blue-700">Clientes</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{stats.totalCooks}</p>
                      <p className="text-sm text-orange-700">Cocineros</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.totalDrivers}</p>
                      <p className="text-sm text-green-700">Conductores</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verificar Cocineros Pendientes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Gestionar Permisos y Roles
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Usuarios Reportados
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <X className="h-4 w-4 mr-2" />
                      Cuentas Suspendidas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Gestión de Contenido
                  </CardTitle>
                  <CardDescription>Administrar platos, categorías y contenido del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{stats.totalDishes}</p>
                      <p className="text-sm text-purple-700">Platos Totales</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{dishes.filter(d => !d.isAvailable).length}</p>
                      <p className="text-sm text-red-700">No Disponibles</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="h-4 w-4 mr-2" />
                      Revisar Platos Reportados
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Gestionar Categorías
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Contenido Inapropiado
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Moderación Automática
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración del Sistema
                  </CardTitle>
                  <CardDescription>Ajustes globales, mantenimiento y configuración</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Estado del Sistema</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Firebase:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Geolocalización:</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Limitado</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagos:</span>
                        <Badge variant="outline">Pendiente</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Notificaciones:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Configurar Base de Datos
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Configurar Geolocalización
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpiar Cache del Sistema
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Reglas de Seguridad
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gestión Financiera
                  </CardTitle>
                  <CardDescription>Comisiones, pagos y reportes financieros</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">Resumen Financiero</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ingresos Hoy:</span>
                        <span className="font-bold text-green-600">{formatPrice(stats.todayRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comisión Moai (8%):</span>
                        <span className="font-bold">{formatPrice(stats.todayRevenue * 0.08)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Órdenes Activas:</span>
                        <span className="font-bold">{stats.activeOrders}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reportes Financieros
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Comisiones
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Pagos Pendientes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Disputas y Reembolsos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad Reciente del Sistema
                </CardTitle>
                <CardDescription>Últimas acciones administrativas y eventos del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nuevo cocinero registrado</p>
                      <p className="text-xs text-muted-foreground">María González se registró como cocinera - Hace 2 horas</p>
                    </div>
                    <Badge variant="outline">Nuevo</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Plato reportado por contenido</p>
                      <p className="text-xs text-muted-foreground">&quot;Empanadas Caseras&quot; requiere revisión - Hace 4 horas</p>
                    </div>
                    <Badge variant="destructive">Urgente</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Actualización de base de datos completada</p>
                      <p className="text-xs text-muted-foreground">Índices de Firestore actualizados correctamente - Hace 6 horas</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Conductor verificado</p>
                      <p className="text-xs text-muted-foreground">Carlos Mendoza completó verificación de documentos - Hace 1 día</p>
                    </div>
                    <Badge variant="outline">Verificado</Badge>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Ver Historial Completo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Role Switcher for Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Cambiar Rol (Testing)
                </CardTitle>
                <CardDescription>Cambiar rol para probar diferentes interfaces</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Rol actual: <strong>{role}</strong></p>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => switchRole('Client')} 
                    disabled={loading || role === 'Client'}
                    variant={role === 'Client' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Cliente
                  </Button>
                  <Button 
                    onClick={() => switchRole('Cooker')} 
                    disabled={loading || role === 'Cooker'}
                    variant={role === 'Cooker' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Cocinero
                  </Button>
                  <Button 
                    onClick={() => switchRole('Driver')} 
                    disabled={loading || role === 'Driver'}
                    variant={role === 'Driver' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Conductor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
