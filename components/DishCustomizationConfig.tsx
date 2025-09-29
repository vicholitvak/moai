'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CustomizationGroup,
  CustomizationOption,
  DishCustomization,
  PRESET_CUSTOMIZATION_GROUPS
} from '@/types/dishCustomization';
import { toast } from 'sonner';

interface DishCustomizationConfigProps {
  initialCustomization?: DishCustomization;
  onSave: (customization: DishCustomization) => void;
}

export function DishCustomizationConfig({
  initialCustomization,
  onSave
}: DishCustomizationConfigProps) {
  const [enabled, setEnabled] = useState(initialCustomization?.enabled || false);
  const [groups, setGroups] = useState<CustomizationGroup[]>(
    initialCustomization?.groups || []
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const addGroup = () => {
    const newGroup: CustomizationGroup = {
      id: `group-${Date.now()}`,
      name: '',
      description: '',
      required: false,
      selectionType: 'single',
      options: []
    };
    setGroups([...groups, newGroup]);
    setExpandedGroups(prev => new Set([...prev, newGroup.id]));
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupId);
      return newSet;
    });
  };

  const updateGroup = (groupId: string, updates: Partial<CustomizationGroup>) => {
    setGroups(groups.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const addOption = (groupId: string) => {
    const newOption: CustomizationOption = {
      id: `option-${Date.now()}`,
      name: '',
      price: 0,
      available: true
    };

    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: [...g.options, newOption] };
      }
      return g;
    }));
  };

  const removeOption = (groupId: string, optionId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter(o => o.id !== optionId) };
      }
      return g;
    }));
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<CustomizationOption>
  ) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(o => (o.id === optionId ? { ...o, ...updates } : o))
        };
      }
      return g;
    }));
  };

  const loadPreset = (presetKey: string) => {
    const preset = PRESET_CUSTOMIZATION_GROUPS[presetKey as keyof typeof PRESET_CUSTOMIZATION_GROUPS];
    if (!preset) return;

    const newGroups: CustomizationGroup[] = preset.map((groupTemplate, index) => ({
      id: `group-${Date.now()}-${index}`,
      name: groupTemplate.name,
      description: '',
      required: groupTemplate.required,
      selectionType: groupTemplate.selectionType,
      minSelections: groupTemplate.minSelections,
      maxSelections: groupTemplate.maxSelections,
      options: groupTemplate.options.map((optTemplate, optIndex) => ({
        id: `option-${Date.now()}-${index}-${optIndex}`,
        name: optTemplate.name,
        price: optTemplate.price,
        available: true
      }))
    }));

    setGroups(newGroups);
    setEnabled(true);
    toast.success('Plantilla cargada exitosamente');
  };

  const handleSave = () => {
    // Validación
    if (enabled) {
      const hasEmptyGroupNames = groups.some(g => !g.name.trim());
      if (hasEmptyGroupNames) {
        toast.error('Todos los grupos deben tener un nombre');
        return;
      }

      const hasEmptyOptions = groups.some(g =>
        g.options.some(o => !o.name.trim())
      );
      if (hasEmptyOptions) {
        toast.error('Todas las opciones deben tener un nombre');
        return;
      }

      const hasGroupsWithoutOptions = groups.some(g => g.options.length === 0);
      if (hasGroupsWithoutOptions) {
        toast.error('Todos los grupos deben tener al menos una opción');
        return;
      }
    }

    const customization: DishCustomization = {
      enabled,
      groups
    };

    onSave(customization);
    toast.success('Configuración guardada');
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personalización de Plato</CardTitle>
              <CardDescription>
                Permite que los clientes personalicen este plato con diferentes opciones
              </CardDescription>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
      </Card>

      {enabled && (
        <>
          {/* Preset Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantillas Rápidas</CardTitle>
              <CardDescription>
                Carga una plantilla predefinida y personalízala según tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('wraps')}
                  className="text-xs"
                >
                  🌯 Wraps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('sushi')}
                  className="text-xs"
                >
                  🍣 Sushi Básico
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('burgers')}
                  className="text-xs"
                >
                  🍔 Hamburguesas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('pizza')}
                  className="text-xs"
                >
                  🍕 Pizza
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('salads')}
                  className="text-xs"
                >
                  🥗 Ensaladas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('popcorn')}
                  className="text-xs"
                >
                  🍿 Popcorn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('choclitos')}
                  className="text-xs"
                >
                  🌽 Choclitos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('sopapillas')}
                  className="text-xs"
                >
                  🫓 Sopapillas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('armaturoll')}
                  className="text-xs"
                >
                  🍱 Arma tu Roll
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('gohan')}
                  className="text-xs"
                >
                  🍚 Gohan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset('tacos')}
                  className="text-xs"
                >
                  🌮 Tacos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customization Groups */}
          <div className="space-y-4">
            {groups.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(group.id);

              return (
                <Card key={group.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => toggleGroupExpanded(group.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {group.name || `Grupo ${groupIndex + 1}`}
                            </span>
                            {group.required && (
                              <Badge variant="destructive" className="text-xs">
                                Requerido
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {group.selectionType === 'single' ? 'Única' : 'Múltiple'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {group.options.length} opciones
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGroup(group.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-0">
                      {/* Group Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre del Grupo</Label>
                          <Input
                            value={group.name}
                            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                            placeholder="Ej: Tipo de Tortilla"
                          />
                        </div>

                        <div>
                          <Label>Tipo de Selección</Label>
                          <Select
                            value={group.selectionType}
                            onValueChange={(value) =>
                              updateGroup(group.id, {
                                selectionType: value as 'single' | 'multiple'
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Única (Radio)</SelectItem>
                              <SelectItem value="multiple">Múltiple (Checkbox)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Descripción (Opcional)</Label>
                          <Input
                            value={group.description || ''}
                            onChange={(e) =>
                              updateGroup(group.id, { description: e.target.value })
                            }
                            placeholder="Descripción breve"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={group.required}
                              onCheckedChange={(checked) =>
                                updateGroup(group.id, { required: checked })
                              }
                            />
                            <Label className="text-sm">Requerido</Label>
                          </div>
                        </div>

                        {group.selectionType === 'multiple' && (
                          <>
                            <div>
                              <Label>Mínimo de Selecciones</Label>
                              <Input
                                type="number"
                                min="0"
                                value={group.minSelections || ''}
                                onChange={(e) =>
                                  updateGroup(group.id, {
                                    minSelections: parseInt(e.target.value) || undefined
                                  })
                                }
                                placeholder="Sin mínimo"
                              />
                            </div>
                            <div>
                              <Label>Máximo de Selecciones</Label>
                              <Input
                                type="number"
                                min="1"
                                value={group.maxSelections || ''}
                                onChange={(e) =>
                                  updateGroup(group.id, {
                                    maxSelections: parseInt(e.target.value) || undefined
                                  })
                                }
                                placeholder="Sin máximo"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Options */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">Opciones</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(group.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Opción
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {group.options.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50"
                            >
                              <Input
                                value={option.name}
                                onChange={(e) =>
                                  updateOption(group.id, option.id, { name: e.target.value })
                                }
                                placeholder="Nombre de la opción"
                                className="flex-1 bg-white"
                              />
                              <Input
                                type="number"
                                value={option.price}
                                onChange={(e) =>
                                  updateOption(group.id, option.id, {
                                    price: parseFloat(e.target.value) || 0
                                  })
                                }
                                placeholder="Precio"
                                className="w-24 bg-white"
                              />
                              <Switch
                                checked={option.available}
                                onCheckedChange={(checked) =>
                                  updateOption(group.id, option.id, { available: checked })
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(group.id, option.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Add Group Button */}
          <Button onClick={addGroup} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Grupo de Opciones
          </Button>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button onClick={handleSave} size="lg" className="px-8">
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}