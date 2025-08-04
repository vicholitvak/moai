'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminService, DriversService, CooksService, DishesService } from '@/lib/firebase/dataService';
import type { Cook, Driver, Dish } from '@/lib/firebase/dataService';
import DriverTrackingMap from '@/components/DriverTrackingMap';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Mock admin stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1247,
    totalCooks: 89,
    totalDrivers: 156,
    totalClients: 1002,
    totalOrders: 3456,
    totalDishes: 567,
    todayRevenue: 2450000,
    activeOrders: 23
  });

  // Check if user is admin (you can modify this logic)
  const isAdmin = user?.email === 'admin@moai.com' || user?.uid === 'admin' || user?.email?.includes('admin');
  
  console.log('Admin check:', {
    userEmail: user?.email,
    userUID: user?.uid,
    isAdmin,
    adminEmail: user?.email === 'admin@moai.com',
    adminUID: user?.uid === 'admin',
    emailIncludesAdmin: user?.email?.includes('admin')
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/');
    } else {
      loadData();
    }
  }, [user, isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { cooks, drivers, dishes } = await AdminService.getAllUsers();
      setCooks(cooks);
      setDrivers(drivers);
      setDishes(dishes);
      
      // Update stats with real data
      setStats(prev => ({
        ...prev,
        totalCooks: cooks.length,
        totalDrivers: drivers.length,
        totalDishes: dishes.length,
        totalUsers: cooks.length + drivers.length + prev.totalClients
      }));
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
      const success = await AdminService.deleteCook(cookId, user!.uid);
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
      const success = await AdminService.deleteDriver(driverId, user!.uid);
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
      adminUserId: user!.uid,
      adminEmail: user!.email,
      isAdmin
    });

    setDeletingId(dishId);
    try {
      const success = await AdminService.deleteDish(dishId, user!.uid);
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
        code: (error as any).code,
        message: (error as any).message,
        dishId,
        adminId: user!.uid
      });
      toast.error(`Error al eliminar el plato: ${(error as any).message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleDishAvailability = async (dishId: string, dishName: string, currentAvailability: boolean) => {
    setDeletingId(dishId); // Reuse loading state
    try {
      const success = await DishesService.updateDish(dishId, { isAvailable: !currentAvailability });
      if (success) {
        setDishes(prev => prev.map(dish => 
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
    // Navigate to the respective dashboard
    switch (role) {
      case 'client':
        router.push('/dishes');
        break;
      case 'cooker':
        router.push('/cooker/dashboard');
        break;
      case 'driver':
        router.push('/driver/dashboard');
        break;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, description, color = "text-primary" }: any) => (
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
    icon: any;
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
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Panel de Administrador</h1>
                <p className="text-muted-foreground">¡Hola, {user.displayName || user.email}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
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
            { id: 'role-testing', label: 'Prueba de Roles' },
            { id: 'data-management', label: 'Gestión de Datos' },
            { id: 'driver-tracking', label: 'Seguimiento de Conductores' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'management', label: 'Configuración' }
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
                      <li>• Haz clic en "Probar como [Rol]" para navegar al dashboard correspondiente</li>
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
                  Cocineros ({cooks.length})
                </CardTitle>
                <CardDescription>Gestionar perfiles de cocineros y sus platos</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : cooks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay cocineros registrados</p>
                ) : (
                  <div className="space-y-3">
                    {cooks.map((cook) => (
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
                  Conductores ({drivers.length})
                </CardTitle>
                <CardDescription>Gestionar perfiles de conductores</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : drivers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay conductores registrados</p>
                ) : (
                  <div className="space-y-3">
                    {drivers.map((driver) => (
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
                  Platos ({dishes.length})
                </CardTitle>
                <CardDescription>Gestionar platos disponibles en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : dishes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay platos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {dishes.map((dish) => {
                      const cook = cooks.find(c => c.id === dish.cookerId);
                      return (
                        <div key={dish.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src={dish.image} 
                              alt={dish.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgyOFYyOEgyMFYyMFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
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
            
            <DriverTrackingMap drivers={drivers} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">Métricas y estadísticas del sistema</p>
            </div>
            
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Avanzados</h3>
              <p className="text-muted-foreground">
                Gráficos detallados y métricas avanzadas estarán disponibles próximamente
              </p>
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Gestión del Sistema</h2>
              <p className="text-muted-foreground">Herramientas de administración y configuración del sistema</p>
            </div>
            
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
                      <p className="text-xs text-muted-foreground">"Empanadas Caseras" requiere revisión - Hace 4 horas</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
