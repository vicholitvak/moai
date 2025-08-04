'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ChefHat, 
  Truck, 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'multiselect' | 'number' | 'file' | 'location' | 'time';
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  enabled: boolean;
  order: number;
}

interface FormConfiguration {
  steps: FormStep[];
  lastUpdated: Date;
  updatedBy: string;
}

const DEFAULT_COOKER_CONFIG: FormConfiguration = {
  steps: [
    {
      id: 'personal',
      title: 'Información Personal',
      description: 'Cuéntanos sobre ti',
      enabled: true,
      order: 1,
      fields: [
        { id: 'displayName', label: 'Nombre Completo', type: 'text', required: true, enabled: true, order: 1 },
        { id: 'phone', label: 'Teléfono', type: 'phone', required: true, enabled: true, order: 2 },
        { id: 'bio', label: 'Biografía', type: 'textarea', required: false, enabled: true, order: 3 }
      ]
    },
    {
      id: 'location',
      title: 'Ubicación de Cocina',
      description: 'Dónde preparas tus platos',
      enabled: true,
      order: 2,
      fields: [
        { id: 'street', label: 'Calle', type: 'text', required: true, enabled: true, order: 1 },
        { id: 'city', label: 'Ciudad', type: 'text', required: true, enabled: true, order: 2 },
        { id: 'state', label: 'Estado/Provincia', type: 'text', required: true, enabled: true, order: 3 },
        { id: 'zipCode', label: 'Código Postal', type: 'text', required: true, enabled: true, order: 4 }
      ]
    },
    {
      id: 'culinary',
      title: 'Perfil Culinario',
      description: 'Tu experiencia y especialidades',
      enabled: true,
      order: 3,
      fields: [
        { id: 'yearsExperience', label: 'Años de Experiencia', type: 'number', required: true, enabled: true, order: 1, validation: { min: 0, max: 50 } },
        { id: 'specialties', label: 'Especialidades', type: 'multiselect', required: true, enabled: true, order: 2, options: ['Italiana', 'Mexicana', 'China', 'Japonesa', 'Peruana', 'Argentina', 'Vegetariana', 'Vegana'] },
        { id: 'cookingStyle', label: 'Estilo de Cocina', type: 'select', required: true, enabled: true, order: 3, options: ['Tradicional', 'Moderna', 'Fusión', 'Gourmet', 'Casera'] },
        { id: 'languages', label: 'Idiomas', type: 'multiselect', required: false, enabled: true, order: 4, options: ['Español', 'Inglés', 'Portugués', 'Italiano', 'Francés'] }
      ]
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Horarios y preferencias',
      enabled: true,
      order: 4,
      fields: [
        { id: 'workingHours', label: 'Horario de Trabajo', type: 'time', required: true, enabled: true, order: 1 },
        { id: 'workingDays', label: 'Días de Trabajo', type: 'multiselect', required: true, enabled: true, order: 2, options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
        { id: 'maxOrdersPerDay', label: 'Máximo de Órdenes por Día', type: 'number', required: true, enabled: true, order: 3, validation: { min: 1, max: 100 } },
        { id: 'deliveryRadius', label: 'Radio de Entrega (km)', type: 'number', required: true, enabled: true, order: 4, validation: { min: 1, max: 50 } },
        { id: 'selfDelivery', label: 'Entrega Propia', type: 'select', required: true, enabled: true, order: 5, options: ['Sí', 'No'] }
      ]
    }
  ],
  lastUpdated: new Date(),
  updatedBy: ''
};

const DEFAULT_DRIVER_CONFIG: FormConfiguration = {
  steps: [
    {
      id: 'personal',
      title: 'Información Personal',
      description: 'Datos básicos de contacto',
      enabled: true,
      order: 1,
      fields: [
        { id: 'displayName', label: 'Nombre Completo', type: 'text', required: true, enabled: true, order: 1 },
        { id: 'phone', label: 'Teléfono', type: 'phone', required: true, enabled: true, order: 2 }
      ]
    },
    {
      id: 'vehicle',
      title: 'Vehículo',
      description: 'Información de tu vehículo',
      enabled: true,
      order: 2,
      fields: [
        { id: 'vehicleType', label: 'Tipo de Vehículo', type: 'select', required: true, enabled: true, order: 1, options: ['Bicicleta', 'Motocicleta', 'Auto'] },
        { id: 'make', label: 'Marca', type: 'text', required: true, enabled: true, order: 2 },
        { id: 'model', label: 'Modelo', type: 'text', required: true, enabled: true, order: 3 },
        { id: 'year', label: 'Año', type: 'number', required: true, enabled: true, order: 4, validation: { min: 1990, max: new Date().getFullYear() + 1 } },
        { id: 'licensePlate', label: 'Placa', type: 'text', required: true, enabled: true, order: 5 },
        { id: 'color', label: 'Color', type: 'text', required: true, enabled: true, order: 6 }
      ]
    },
    {
      id: 'documents',
      title: 'Documentación',
      description: 'Licencia y papeles del vehículo',
      enabled: true,
      order: 3,
      fields: [
        { id: 'driverLicense', label: 'Licencia de Conducir', type: 'file', required: true, enabled: true, order: 1 },
        { id: 'vehicleRegistration', label: 'Registro del Vehículo', type: 'file', required: true, enabled: true, order: 2 },
        { id: 'insuranceProof', label: 'Prueba de Seguro', type: 'file', required: true, enabled: true, order: 3 }
      ]
    },
    {
      id: 'preferences',
      title: 'Preferencias',
      description: 'Horarios y áreas de trabajo',
      enabled: true,
      order: 4,
      fields: [
        { id: 'workingHours', label: 'Horario de Trabajo', type: 'time', required: true, enabled: true, order: 1 },
        { id: 'workingDays', label: 'Días de Trabajo', type: 'multiselect', required: true, enabled: true, order: 2, options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
        { id: 'preferredAreas', label: 'Áreas Preferidas', type: 'multiselect', required: false, enabled: true, order: 3, options: ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'] }
      ]
    },
    {
      id: 'payment',
      title: 'Pago',
      description: 'Información bancaria',
      enabled: true,
      order: 5,
      fields: [
        { id: 'accountHolderName', label: 'Titular de la Cuenta', type: 'text', required: true, enabled: true, order: 1 },
        { id: 'bankName', label: 'Banco', type: 'text', required: true, enabled: true, order: 2 },
        { id: 'accountNumber', label: 'Número de Cuenta', type: 'text', required: true, enabled: true, order: 3 },
        { id: 'routingNumber', label: 'RUT', type: 'text', required: true, enabled: true, order: 4 }
      ]
    }
  ],
  lastUpdated: new Date(),
  updatedBy: ''
};

export default function OnboardingFormManager() {
  const [cookerConfig, setCookerConfig] = useState<FormConfiguration>(DEFAULT_COOKER_CONFIG);
  const [driverConfig, setDriverConfig] = useState<FormConfiguration>(DEFAULT_DRIVER_CONFIG);
  const [activeTab, setActiveTab] = useState<'cooker' | 'driver'>('cooker');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      const cookerDoc = await getDoc(doc(db, 'onboardingConfigs', 'cooker'));
      if (cookerDoc.exists()) {
        setCookerConfig(cookerDoc.data() as FormConfiguration);
      }
      
      const driverDoc = await getDoc(doc(db, 'onboardingConfigs', 'driver'));
      if (driverDoc.exists()) {
        setDriverConfig(driverDoc.data() as FormConfiguration);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      
      await setDoc(doc(db, 'onboardingConfigs', 'cooker'), {
        ...cookerConfig,
        lastUpdated: new Date(),
        updatedBy: 'admin' // TODO: Get actual admin user ID
      });
      
      await setDoc(doc(db, 'onboardingConfigs', 'driver'), {
        ...driverConfig,
        lastUpdated: new Date(),
        updatedBy: 'admin' // TODO: Get actual admin user ID
      });
      
      toast.success('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error saving configurations:', error);
      toast.error('Error al guardar las configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const updateFieldProperty = (stepId: string, fieldId: string, property: string, value: any) => {
    const config = activeTab === 'cooker' ? cookerConfig : driverConfig;
    const setter = activeTab === 'cooker' ? setCookerConfig : setDriverConfig;
    
    setter({
      ...config,
      steps: config.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            fields: step.fields.map(field => {
              if (field.id === fieldId) {
                return { ...field, [property]: value };
              }
              return field;
            })
          };
        }
        return step;
      })
    });
  };

  const toggleStepEnabled = (stepId: string) => {
    const config = activeTab === 'cooker' ? cookerConfig : driverConfig;
    const setter = activeTab === 'cooker' ? setCookerConfig : setDriverConfig;
    
    setter({
      ...config,
      steps: config.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, enabled: !step.enabled };
        }
        return step;
      })
    });
  };

  const addFieldOption = (stepId: string, fieldId: string, newOption: string) => {
    const config = activeTab === 'cooker' ? cookerConfig : driverConfig;
    const setter = activeTab === 'cooker' ? setCookerConfig : setDriverConfig;
    
    setter({
      ...config,
      steps: config.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            fields: step.fields.map(field => {
              if (field.id === fieldId && field.options) {
                return { ...field, options: [...field.options, newOption] };
              }
              return field;
            })
          };
        }
        return step;
      })
    });
  };

  const removeFieldOption = (stepId: string, fieldId: string, optionToRemove: string) => {
    const config = activeTab === 'cooker' ? cookerConfig : driverConfig;
    const setter = activeTab === 'cooker' ? setCookerConfig : setDriverConfig;
    
    setter({
      ...config,
      steps: config.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            fields: step.fields.map(field => {
              if (field.id === fieldId && field.options) {
                return { ...field, options: field.options.filter(opt => opt !== optionToRemove) };
              }
              return field;
            })
          };
        }
        return step;
      })
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentConfig = activeTab === 'cooker' ? cookerConfig : driverConfig;

  return (
    <Card className="max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Gestión de Formularios de Onboarding</CardTitle>
            <CardDescription>
              Configura los campos y pasos de los formularios de registro
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? 'Editar' : 'Vista Previa'}
            </Button>
            <Button
              onClick={saveConfigurations}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'cooker' | 'driver')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cooker" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Formulario de Cocineros
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Formulario de Conductores
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6 mt-6">
            {currentConfig.steps.map((step, stepIndex) => (
              <Card key={step.id} className={!step.enabled ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <Badge variant="outline">{stepIndex + 1}</Badge>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{step.title}</h3>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={step.enabled}
                      onCheckedChange={() => toggleStepEnabled(step.id)}
                    />
                  </div>
                </CardHeader>
                {step.enabled && (
                  <CardContent className="space-y-4">
                    {step.fields.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className={`border rounded-lg p-4 space-y-3 ${!field.enabled ? 'opacity-50 bg-gray-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Label className="font-medium">{field.label}</Label>
                                <Badge variant="secondary" className="text-xs">
                                  {field.type}
                                </Badge>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Requerido
                                  </Badge>
                                )}
                              </div>
                              
                              {previewMode ? (
                                <div className="mt-2">
                                  {field.type === 'text' || field.type === 'phone' || field.type === 'email' ? (
                                    <Input
                                      placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
                                      disabled
                                    />
                                  ) : field.type === 'textarea' ? (
                                    <textarea
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
                                      disabled
                                      rows={3}
                                    />
                                  ) : field.type === 'select' || field.type === 'multiselect' ? (
                                    <Select disabled>
                                      <SelectTrigger>
                                        <SelectValue placeholder={`Seleccione ${field.label.toLowerCase()}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map(option => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : field.type === 'number' ? (
                                    <Input
                                      type="number"
                                      placeholder={field.placeholder || '0'}
                                      disabled
                                      min={field.validation?.min}
                                      max={field.validation?.max}
                                    />
                                  ) : field.type === 'file' ? (
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                      <p className="text-sm text-gray-500">Cargar archivo</p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`${field.id}-enabled`}
                                        checked={field.enabled}
                                        onCheckedChange={(checked) => 
                                          updateFieldProperty(step.id, field.id, 'enabled', checked)
                                        }
                                      />
                                      <Label htmlFor={`${field.id}-enabled`}>Habilitado</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`${field.id}-required`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => 
                                          updateFieldProperty(step.id, field.id, 'required', checked)
                                        }
                                      />
                                      <Label htmlFor={`${field.id}-required`}>Requerido</Label>
                                    </div>
                                  </div>

                                  {field.placeholder !== undefined && (
                                    <div>
                                      <Label className="text-xs">Texto de ayuda</Label>
                                      <Input
                                        value={field.placeholder}
                                        onChange={(e) => 
                                          updateFieldProperty(step.id, field.id, 'placeholder', e.target.value)
                                        }
                                        placeholder="Texto de ayuda para el campo"
                                        className="mt-1"
                                      />
                                    </div>
                                  )}

                                  {field.options && (
                                    <div>
                                      <Label className="text-xs">Opciones</Label>
                                      <div className="space-y-2 mt-2">
                                        {field.options.map(option => (
                                          <div key={option} className="flex items-center gap-2">
                                            <Input value={option} disabled className="flex-1" />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeFieldOption(step.id, field.id, option)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            const newOption = prompt('Nueva opción:');
                                            if (newOption) {
                                              addFieldOption(step.id, field.id, newOption);
                                            }
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Agregar opción
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {field.validation && (
                                    <div className="grid grid-cols-2 gap-3">
                                      {field.validation.min !== undefined && (
                                        <div>
                                          <Label className="text-xs">Mínimo</Label>
                                          <Input
                                            type="number"
                                            value={field.validation.min}
                                            onChange={(e) => {
                                              const newValidation = { ...field.validation, min: parseInt(e.target.value) };
                                              updateFieldProperty(step.id, field.id, 'validation', newValidation);
                                            }}
                                            className="mt-1"
                                          />
                                        </div>
                                      )}
                                      {field.validation.max !== undefined && (
                                        <div>
                                          <Label className="text-xs">Máximo</Label>
                                          <Input
                                            type="number"
                                            value={field.validation.max}
                                            onChange={(e) => {
                                              const newValidation = { ...field.validation, max: parseInt(e.target.value) };
                                              updateFieldProperty(step.id, field.id, 'validation', newValidation);
                                            }}
                                            className="mt-1"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {!previewMode && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <p>
                Los cambios en la configuración de los formularios afectarán inmediatamente a los nuevos registros.
                Asegúrate de probar los cambios antes de guardar.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}