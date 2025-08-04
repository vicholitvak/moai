import { useState, useEffect } from 'react';
import { onboardingConfigService, FormConfiguration } from '@/lib/services/onboardingConfigService';

export function useOnboardingConfig(type: 'cooker' | 'driver') {
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadedConfig = type === 'cooker' 
          ? await onboardingConfigService.getCookerConfig()
          : await onboardingConfigService.getDriverConfig();
        
        setConfig(loadedConfig);
      } catch (err) {
        console.error('Error loading onboarding config:', err);
        setError('Failed to load form configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [type]);

  const refresh = async () => {
    onboardingConfigService.clearCache();
    await loadConfig();
  };

  return { config, loading, error, refresh };
}

// Default configurations to use as fallback
export const DEFAULT_COOKER_CONFIG: FormConfiguration = {
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
  updatedBy: 'system'
};

export const DEFAULT_DRIVER_CONFIG: FormConfiguration = {
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
  updatedBy: 'system'
};