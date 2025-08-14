import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { validateData, ValidationResult, sanitizeObject } from '@/lib/utils/validation';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialData?: Partial<T>;
  onSubmit?: (data: T) => void | Promise<void>;
  sanitize?: boolean;
}

interface FormValidationReturn<T> {
  data: Partial<T>;
  errors: Record<string, string[]>;
  isValid: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  setValue: (field: keyof T, value: any) => void;
  setData: (newData: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validate: () => ValidationResult<T>;
  validateField: (field: keyof T) => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasFieldError: (field: keyof T) => boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialData = {},
  onSubmit,
  sanitize = true
}: UseFormValidationOptions<T>): FormValidationReturn<T> {
  const [data, setDataState] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized validation state
  const { isValid, hasErrors } = useMemo(() => {
    const result = schema.safeParse(data);
    return {
      isValid: result.success,
      hasErrors: Object.keys(errors).length > 0
    };
  }, [data, errors, schema]);

  // Set individual field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setDataState(prev => ({
      ...prev,
      [field]: sanitize && typeof value === 'string' ? value.trim() : value
    }));
    
    // Clear field error when value changes
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors, sanitize]);

  // Set multiple field values
  const setData = useCallback((newData: Partial<T>) => {
    const processedData = sanitize ? sanitizeObject(newData) : newData;
    setDataState(prev => ({ ...prev, ...processedData }));
  }, [sanitize]);

  // Set field error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: [error]
    }));
  }, []);

  // Clear field error
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validate all data
  const validate = useCallback((): ValidationResult<T> => {
    const result = validateData(schema, data);
    
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
    }
    
    return result;
  }, [schema, data]);

  // Validate single field
  const validateField = useCallback((field: keyof T): boolean => {
    try {
      // Create a partial schema for just this field
      const fieldSchema = schema.pick({ [field]: true } as any);
      const fieldData = { [field]: data[field] };
      const result = fieldSchema.safeParse(fieldData);
      
      if (!result.success) {
        const fieldErrors = result.error.errors
          .filter(err => err.path[0] === field)
          .map(err => err.message);
        
        if (fieldErrors.length > 0) {
          setError(field, fieldErrors[0]);
          return false;
        }
      } else {
        clearError(field);
        return true;
      }
    } catch (error) {
      // If schema.pick is not available or fails, validate the whole object
      const result = schema.safeParse(data);
      if (!result.success) {
        const fieldErrors = result.error.errors
          .filter(err => err.path[0] === field)
          .map(err => err.message);
        
        if (fieldErrors.length > 0) {
          setError(field, fieldErrors[0]);
          return false;
        }
      }
    }
    
    clearError(field);
    return true;
  }, [schema, data, setError, clearError]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const result = validate();
      
      if (result.success && result.data && onSubmit) {
        await onSubmit(result.data);
        // Reset form after successful submission
        setDataState(initialData);
        setErrors({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // You might want to set a general error here
      setError('submit' as keyof T, 'Error al enviar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validate, onSubmit, initialData, setError]);

  // Reset form
  const reset = useCallback(() => {
    setDataState(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  // Get field error message
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string]?.[0];
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: keyof T): boolean => {
    return Boolean(errors[field as string] && errors[field as string].length > 0);
  }, [errors]);

  return {
    data,
    errors,
    isValid,
    isSubmitting,
    hasErrors,
    setValue,
    setData,
    setError,
    clearError,
    clearAllErrors,
    validate,
    validateField,
    handleSubmit,
    reset,
    getFieldError,
    hasFieldError
  };
}

// Specialized hook for async validation (useful for checking unique emails, etc.)
export function useAsyncFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T> & {
    asyncValidators?: Record<keyof T, (value: any) => Promise<string | null>>;
  }
) {
  const formValidation = useFormValidation(options);
  const [asyncValidating, setAsyncValidating] = useState<Set<keyof T>>(new Set());

  const validateFieldAsync = useCallback(async (field: keyof T): Promise<boolean> => {
    const { asyncValidators } = options;
    
    if (!asyncValidators || !asyncValidators[field]) {
      return formValidation.validateField(field);
    }

    setAsyncValidating(prev => new Set(prev).add(field));
    
    try {
      // First validate with regular schema
      const isValidSync = formValidation.validateField(field);
      
      if (!isValidSync) {
        return false;
      }

      // Then validate with async validator
      const asyncError = await asyncValidators[field](formValidation.data[field]);
      
      if (asyncError) {
        formValidation.setError(field, asyncError);
        return false;
      }

      return true;
    } catch (error) {
      formValidation.setError(field, 'Error de validación');
      return false;
    } finally {
      setAsyncValidating(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  }, [options, formValidation]);

  const isFieldValidating = useCallback((field: keyof T): boolean => {
    return asyncValidating.has(field);
  }, [asyncValidating]);

  return {
    ...formValidation,
    validateFieldAsync,
    isFieldValidating,
    isAsyncValidating: asyncValidating.size > 0
  };
}

// Debounce hook for search inputs
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};