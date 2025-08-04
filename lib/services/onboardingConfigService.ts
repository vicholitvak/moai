import { db } from '../firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface FormField {
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

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  enabled: boolean;
  order: number;
}

export interface FormConfiguration {
  steps: FormStep[];
  lastUpdated: Date;
  updatedBy: string;
}

class OnboardingConfigService {
  private static instance: OnboardingConfigService;
  private cookerConfigCache: FormConfiguration | null = null;
  private driverConfigCache: FormConfiguration | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): OnboardingConfigService {
    if (!OnboardingConfigService.instance) {
      OnboardingConfigService.instance = new OnboardingConfigService();
    }
    return OnboardingConfigService.instance;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  async getCookerConfig(): Promise<FormConfiguration | null> {
    if (this.cookerConfigCache && this.isCacheValid()) {
      return this.cookerConfigCache;
    }

    try {
      const docRef = doc(db, 'onboardingConfigs', 'cooker');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        this.cookerConfigCache = docSnap.data() as FormConfiguration;
        this.cacheTimestamp = Date.now();
        return this.cookerConfigCache;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching cooker config:', error);
      return null;
    }
  }

  async getDriverConfig(): Promise<FormConfiguration | null> {
    if (this.driverConfigCache && this.isCacheValid()) {
      return this.driverConfigCache;
    }

    try {
      const docRef = doc(db, 'onboardingConfigs', 'driver');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        this.driverConfigCache = docSnap.data() as FormConfiguration;
        this.cacheTimestamp = Date.now();
        return this.driverConfigCache;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching driver config:', error);
      return null;
    }
  }

  async updateCookerConfig(config: FormConfiguration): Promise<void> {
    try {
      const docRef = doc(db, 'onboardingConfigs', 'cooker');
      await setDoc(docRef, {
        ...config,
        lastUpdated: new Date()
      });
      
      // Update cache
      this.cookerConfigCache = config;
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Error updating cooker config:', error);
      throw error;
    }
  }

  async updateDriverConfig(config: FormConfiguration): Promise<void> {
    try {
      const docRef = doc(db, 'onboardingConfigs', 'driver');
      await setDoc(docRef, {
        ...config,
        lastUpdated: new Date()
      });
      
      // Update cache
      this.driverConfigCache = config;
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Error updating driver config:', error);
      throw error;
    }
  }

  // Helper method to validate field based on configuration
  validateField(field: FormField, value: any): { isValid: boolean; error?: string } {
    // Check if field is enabled
    if (!field.enabled) {
      return { isValid: true }; // Skip validation for disabled fields
    }

    // Check required
    if (field.required && !value) {
      return { isValid: false, error: `${field.label} es requerido` };
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return { isValid: false, error: 'Email inválido' };
        }
        break;

      case 'phone':
        const phoneRegex = /^\+?[\d\s\-()]+$/;
        if (value && !phoneRegex.test(value)) {
          return { isValid: false, error: 'Teléfono inválido' };
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (field.validation?.min !== undefined && numValue < field.validation.min) {
          return { isValid: false, error: `El valor debe ser al menos ${field.validation.min}` };
        }
        if (field.validation?.max !== undefined && numValue > field.validation.max) {
          return { isValid: false, error: `El valor no puede ser mayor a ${field.validation.max}` };
        }
        break;

      case 'text':
      case 'textarea':
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (value && !regex.test(value)) {
            return { isValid: false, error: 'Formato inválido' };
          }
        }
        break;
    }

    return { isValid: true };
  }

  // Clear cache
  clearCache(): void {
    this.cookerConfigCache = null;
    this.driverConfigCache = null;
    this.cacheTimestamp = 0;
  }
}

export const onboardingConfigService = OnboardingConfigService.getInstance();