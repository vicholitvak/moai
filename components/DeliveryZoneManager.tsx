'use client';

import { useState, useEffect } from 'react';
import { LocationService } from '@/lib/services/locationService';
import type { DeliveryZone, Coordinates } from '@/lib/services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  MapPin, 
  Clock, 
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

interface DeliveryZoneManagerProps {
  onZoneUpdate?: (zones: DeliveryZone[]) => void;
}

const DeliveryZoneManager = ({ onZoneUpdate }: DeliveryZoneManagerProps) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveryZones();
  }, []);

  const loadDeliveryZones = () => {
    setLoading(true);
    try {
      const defaultZones = LocationService.getDefaultDeliveryZones();
      setZones(defaultZones);
      onZoneUpdate?.(defaultZones);
    } catch (error) {
      console.error('Error loading delivery zones:', error);
      toast.error('Error al cargar zonas de entrega');
    } finally {
      setLoading(false);
    }
  };

  const createNewZone = (): DeliveryZone => ({
    id: `zone-${Date.now()}`,
    name: '',
    coordinates: [],
    center: { 
      latitude: -33.4489, 
      longitude: -70.6693, 
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    },
    radius: 3000,
    deliveryFee: 2500,
    isActive: true,
    maxDeliveryTime: 45,
    priority: zones.length + 1,
    description: '',
    operatingHours: { start: '09:00', end: '22:00' }
  });

  const handleCreateZone = () => {
    const newZone = createNewZone();
    setEditingZone(newZone);
    setIsCreating(true);
  };

  const handleSaveZone = () => {
    if (!editingZone) return;

    if (!editingZone.name.trim()) {
      toast.error('El nombre de la zona es obligatorio');
      return;
    }

    if (editingZone.radius <= 0) {
      toast.error('El radio debe ser mayor a 0');
      return;
    }

    if (editingZone.deliveryFee < 0) {
      toast.error('La tarifa de entrega no puede ser negativa');
      return;
    }

    let updatedZones;
    if (isCreating) {
      updatedZones = [...zones, editingZone];
    } else {
      updatedZones = zones.map(zone => 
        zone.id === editingZone.id ? editingZone : zone
      );
    }

    setZones(updatedZones);
    onZoneUpdate?.(updatedZones);
    setEditingZone(null);
    setIsCreating(false);
    
    toast.success(isCreating ? 'Zona creada exitosamente' : 'Zona actualizada exitosamente');
  };

  const handleDeleteZone = (zoneId: string) => {
    const updatedZones = zones.filter(zone => zone.id !== zoneId);
    setZones(updatedZones);
    onZoneUpdate?.(updatedZones);
    toast.success('Zona eliminada exitosamente');
  };

  const handleToggleZone = (zoneId: string) => {
    const updatedZones = zones.map(zone =>
      zone.id === zoneId ? { ...zone, isActive: !zone.isActive } : zone
    );
    setZones(updatedZones);
    onZoneUpdate?.(updatedZones);
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
    setIsCreating(false);
  };

  const updateEditingZone = (field: keyof DeliveryZone, value: any) => {
    if (!editingZone) return;
    setEditingZone({ ...editingZone, [field]: value });
  };

  const updateOperatingHours = (field: 'start' | 'end', value: string) => {
    if (!editingZone?.operatingHours) return;
    setEditingZone({
      ...editingZone,
      operatingHours: {
        ...editingZone.operatingHours,
        [field]: value
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
          <p>Cargando zonas de entrega...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gestión de Zonas de Entrega
            </CardTitle>
            <Button onClick={handleCreateZone} className="bg-moai-orange hover:bg-moai-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Zona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-moai-orange">{zones.length}</div>
              <div className="text-sm text-muted-foreground">Total de zonas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {zones.filter(zone => zone.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Zonas activas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(zones.reduce((sum, zone) => sum + zone.deliveryFee, 0) / zones.length || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Tarifa promedio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(zones.reduce((sum, zone) => sum + zone.maxDeliveryTime, 0) / zones.length || 0)} min
              </div>
              <div className="text-sm text-muted-foreground">Tiempo promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Zone Form */}
      {editingZone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {isCreating ? 'Crear Nueva Zona' : 'Editar Zona de Entrega'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la zona *</Label>
                <Input
                  id="name"
                  value={editingZone.name}
                  onChange={(e) => updateEditingZone('name', e.target.value)}
                  placeholder="Ej: Centro de Santiago"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={editingZone.priority}
                  onChange={(e) => updateEditingZone('priority', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="radius">Radio (metros)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="100"
                  step="100"
                  value={editingZone.radius}
                  onChange={(e) => updateEditingZone('radius', parseInt(e.target.value) || 3000)}
                  placeholder="3000"
                />
              </div>

              <div>
                <Label htmlFor="deliveryFee">Tarifa de entrega (CLP)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  min="0"
                  step="100"
                  value={editingZone.deliveryFee}
                  onChange={(e) => updateEditingZone('deliveryFee', parseInt(e.target.value) || 2500)}
                  placeholder="2500"
                />
              </div>

              <div>
                <Label htmlFor="maxDeliveryTime">Tiempo máximo (minutos)</Label>
                <Input
                  id="maxDeliveryTime"
                  type="number"
                  min="15"
                  step="5"
                  value={editingZone.maxDeliveryTime}
                  onChange={(e) => updateEditingZone('maxDeliveryTime', parseInt(e.target.value) || 45)}
                  placeholder="45"
                />
              </div>

              <div>
                <Label htmlFor="centerLat">Latitud del centro</Label>
                <Input
                  id="centerLat"
                  type="number"
                  step="0.0001"
                  value={editingZone.center.latitude}
                  onChange={(e) => updateEditingZone('center', {
                    ...editingZone.center,
                    latitude: parseFloat(e.target.value) || -33.4489
                  })}
                  placeholder="-33.4489"
                />
              </div>

              <div>
                <Label htmlFor="centerLng">Longitud del centro</Label>
                <Input
                  id="centerLng"
                  type="number"
                  step="0.0001"
                  value={editingZone.center.longitude}
                  onChange={(e) => updateEditingZone('center', {
                    ...editingZone.center,
                    longitude: parseFloat(e.target.value) || -70.6693
                  })}
                  placeholder="-70.6693"
                />
              </div>

              <div>
                <Label htmlFor="startTime">Hora de inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editingZone.operatingHours?.start || '09:00'}
                  onChange={(e) => updateOperatingHours('start', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endTime">Hora de cierre</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editingZone.operatingHours?.end || '22:00'}
                  onChange={(e) => updateOperatingHours('end', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={editingZone.description || ''}
                onChange={(e) => updateEditingZone('description', e.target.value)}
                placeholder="Descripción de la zona de entrega"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editingZone.isActive}
                onChange={(e) => updateEditingZone('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Zona activa</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveZone} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Crear Zona' : 'Guardar Cambios'}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <Card key={zone.id} className={`${zone.isActive ? '' : 'opacity-60'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-moai-orange" />
                  {zone.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                    {zone.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Button
                    onClick={() => handleToggleZone(zone.id)}
                    variant="outline"
                    size="sm"
                  >
                    {zone.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Radio</div>
                  <div className="text-muted-foreground">{formatDistance(zone.radius)}</div>
                </div>
                <div>
                  <div className="font-medium">Tarifa</div>
                  <div className="text-muted-foreground">{formatPrice(zone.deliveryFee)}</div>
                </div>
                <div>
                  <div className="font-medium">Tiempo máximo</div>
                  <div className="text-muted-foreground">{zone.maxDeliveryTime} min</div>
                </div>
                <div>
                  <div className="font-medium">Prioridad</div>
                  <div className="text-muted-foreground">#{zone.priority}</div>
                </div>
              </div>

              {zone.operatingHours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {zone.operatingHours.start} - {zone.operatingHours.end}
                  </span>
                </div>
              )}

              {zone.description && (
                <p className="text-sm text-muted-foreground">
                  {zone.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                Centro: {zone.center.latitude.toFixed(4)}, {zone.center.longitude.toFixed(4)}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingZone(zone)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDeleteZone(zone.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay zonas de entrega</h3>
            <p className="text-muted-foreground mb-4">
              Crea la primera zona de entrega para comenzar a gestionar los deliveries
            </p>
            <Button onClick={handleCreateZone} className="bg-moai-orange hover:bg-moai-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Zona
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryZoneManager;