'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, AlertTriangle, CheckCircle, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface IngredientStock {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: string;
  lastUpdated: Date;
}

interface InventoryManagementProps {
  cookerId: string;
  dishes: any[];
  onIngredientUpdate?: (ingredientId: string, available: boolean) => void;
}

export function InventoryManagement({ cookerId, dishes, onIngredientUpdate }: InventoryManagementProps) {
  const [ingredients, setIngredients] = useState<IngredientStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    minThreshold: 0,
    category: 'proteínas'
  });

  // Extract unique ingredients from all dishes
  useEffect(() => {
    const uniqueIngredients = new Set<string>();
    dishes.forEach(dish => {
      if (dish.ingredients && Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((ing: string) => uniqueIngredients.add(ing));
      }
    });

    // Initialize inventory with ingredients from dishes
    const initialInventory: IngredientStock[] = Array.from(uniqueIngredients).map((ing, index) => ({
      id: `ing-${index}`,
      name: ing,
      quantity: Math.floor(Math.random() * 20), // Random initial quantity for demo
      unit: 'kg',
      minThreshold: 2,
      category: categorizeIngredient(ing),
      lastUpdated: new Date()
    }));

    setIngredients(initialInventory);
  }, [dishes]);

  const categorizeIngredient = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pollo') || lowerName.includes('carne') || lowerName.includes('pescado')) {
      return 'proteínas';
    }
    if (lowerName.includes('tomate') || lowerName.includes('lechuga') || lowerName.includes('cebolla')) {
      return 'verduras';
    }
    if (lowerName.includes('arroz') || lowerName.includes('pasta') || lowerName.includes('pan')) {
      return 'carbohidratos';
    }
    if (lowerName.includes('aceite') || lowerName.includes('sal') || lowerName.includes('pimienta')) {
      return 'condimentos';
    }
    return 'otros';
  };

  const updateQuantity = (id: string, change: number) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const newQuantity = Math.max(0, ing.quantity + change);

        // Check if ingredient is now below threshold
        if (newQuantity <= ing.minThreshold && ing.quantity > ing.minThreshold) {
          toast.warning(`¡${ing.name} está bajo en stock!`, {
            description: `Quedan solo ${newQuantity} ${ing.unit}. Considera reabastecer.`
          });
        }

        return { ...ing, quantity: newQuantity, lastUpdated: new Date() };
      }
      return ing;
    }));
  };

  const addNewIngredient = () => {
    if (!newIngredient.name.trim()) {
      toast.error('El nombre del ingrediente es requerido');
      return;
    }

    const ingredient: IngredientStock = {
      id: `ing-${Date.now()}`,
      ...newIngredient,
      lastUpdated: new Date()
    };

    setIngredients(prev => [...prev, ingredient]);
    setNewIngredient({
      name: '',
      quantity: 0,
      unit: 'kg',
      minThreshold: 0,
      category: 'proteínas'
    });
    setIsAddingNew(false);
    toast.success('Ingrediente agregado al inventario');
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) {
      return { label: 'Sin stock', color: 'bg-red-500', textColor: 'text-red-500' };
    }
    if (quantity <= threshold) {
      return { label: 'Bajo', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    }
    return { label: 'Disponible', color: 'bg-green-500', textColor: 'text-green-500' };
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'proteínas', 'verduras', 'carbohidratos', 'condimentos', 'otros'];
  const lowStockCount = ingredients.filter(ing => ing.quantity <= ing.minThreshold).length;
  const outOfStockCount = ingredients.filter(ing => ing.quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">{ingredients.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-bold">{lowStockCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold">{outOfStockCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ingrediente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="proteínas">Proteínas</SelectItem>
                  <SelectItem value="verduras">Verduras</SelectItem>
                  <SelectItem value="carbohidratos">Carbohidratos</SelectItem>
                  <SelectItem value="condimentos">Condimentos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Add New Ingredient Form */}
          {isAddingNew && (
            <Card className="mb-4 border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Nuevo Ingrediente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Pollo"
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={newIngredient.category}
                      onValueChange={(value) => setNewIngredient(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proteínas">Proteínas</SelectItem>
                        <SelectItem value="verduras">Verduras</SelectItem>
                        <SelectItem value="carbohidratos">Carbohidratos</SelectItem>
                        <SelectItem value="condimentos">Condimentos</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad Inicial</Label>
                    <Input
                      type="number"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Unidad</Label>
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(value) => setNewIngredient(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="g">Gramos (g)</SelectItem>
                        <SelectItem value="L">Litros (L)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Umbral Mínimo</Label>
                    <Input
                      type="number"
                      value={newIngredient.minThreshold}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, minThreshold: parseFloat(e.target.value) || 0 }))}
                      placeholder="Alerta cuando quede menos de..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addNewIngredient}>
                    Guardar Ingrediente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients List */}
          <div className="space-y-2">
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterCategory !== 'all'
                  ? 'No se encontraron ingredientes con los filtros aplicados'
                  : 'No hay ingredientes en el inventario. Agrega tu primer ingrediente.'}
              </div>
            ) : (
              filteredIngredients.map(ingredient => {
                const status = getStockStatus(ingredient.quantity, ingredient.minThreshold);
                return (
                  <Card key={ingredient.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{ingredient.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {ingredient.category}
                                </Badge>
                                <Badge className={`text-xs ${status.color} text-white`}>
                                  {status.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {ingredient.quantity} <span className="text-sm font-normal text-muted-foreground">{ingredient.unit}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Mínimo: {ingredient.minThreshold} {ingredient.unit}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(ingredient.id, -1)}
                              disabled={ingredient.quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(ingredient.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}