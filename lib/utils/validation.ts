import { z } from 'zod';

// Type for validation result
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.issues.forEach((err: { path: (string | number)[]; message: string }) => {
        const field = err.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(err.message);
      });

      return {
        success: false,
        errors,
        message: 'Datos inválidos. Por favor revisa los campos marcados.'
      };
    }
    
    return {
      success: false,
      message: 'Error de validación inesperado'
    };
  }
}

// Safe parse with detailed error handling
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: Record<string, string[]> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const details: Record<string, string[]> = {};
  result.error.issues.forEach((err: { path: (string | number)[]; message: string }) => {
    const field = err.path.join('.');
    if (!details[field]) {
      details[field] = [];
    }
    details[field].push(err.message);
  });
  
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError?.message || 'Datos inválidos',
    details
  };
}

// Sanitize input by removing potentially dangerous characters
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item: unknown) => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}

// Validate and sanitize data
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  // First sanitize if it's an object
  let sanitizedData = data;
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    sanitizedData = sanitizeObject(data as Record<string, unknown>);
  }
  
  return validateData(schema, sanitizedData);
}

// Format validation errors for display
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ');
  
  return errorMessages;
}

// Get first error message from validation errors
export function getFirstError(errors: Record<string, string[]>): string | null {
  const firstField = Object.keys(errors)[0];
  if (!firstField || !errors[firstField] || errors[firstField].length === 0) {
    return null;
  }
  return errors[firstField][0];
}

// Check if a field has validation errors
export function hasFieldError(errors: Record<string, string[]> | undefined, field: string): boolean {
  return Boolean(errors?.[field] && errors[field].length > 0);
}

// Get field error message
export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | null {
  return errors?.[field]?.[0] ?? null;
}

// Rate limiting validation for sensitive operations
export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  keyGenerator: (data: unknown) => string; // Generate unique key for rate limiting
}

const rateLimitStorage = new Map<string, { attempts: number; resetTime: number }>();

export function checkRateLimit(data: unknown, options: RateLimitOptions): boolean {
  const key = options.keyGenerator(data);
  const now = Date.now();
  
  const record = rateLimitStorage.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStorage.set(key, {
      attempts: 1,
      resetTime: now + options.windowMs
    });
    return true;
  }
  
  if (record.attempts >= options.maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  record.attempts++;
  return true;
}

// Clear expired rate limit records
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStorage.entries()) {
    if (now > record.resetTime) {
      rateLimitStorage.delete(key);
    }
  }
}

// Validation middleware for API routes
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): ValidationResult<T> => {
    return validateAndSanitize(schema, data);
  };
}