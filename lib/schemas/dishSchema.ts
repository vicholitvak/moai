import { z } from 'zod';

// Dish creation schema
export const addDishSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  price: z.number()
    .positive('El precio debe ser mayor a 0')
    .min(500, 'El precio mínimo es $500 CLP')
    .max(50000, 'El precio máximo es $50,000 CLP')
    .int('El precio debe ser un número entero'),
  
  category: z.enum(['Platos principales', 'Acompañamientos', 'Bebidas'], {
    message: 'Selecciona una categoría válida'
  }),
  
  prepTime: z.string()
    .min(1, 'El tiempo de preparación es requerido')
    .max(50, 'El tiempo de preparación es muy largo')
    .regex(/^\d+\s*(min|mins|minutos?|h|hrs?|horas?)$/i, 'Formato inválido. Ej: "30 mins", "1 hora"'),
  
  ingredients: z.array(z.string().min(1, 'El ingrediente no puede estar vacío'))
    .min(1, 'Debe tener al menos un ingrediente')
    .max(20, 'Máximo 20 ingredientes permitidos')
    .refine(
      (ingredients) => ingredients.every(ing => ing.trim().length > 0), 
      'Todos los ingredientes deben tener contenido válido'
    ),
  
  image: z.string()
    .min(1, 'La imagen es requerida')
    .refine(
      (img) => img.startsWith('data:image/') || img.startsWith('http'),
      'La imagen debe ser válida (base64 o URL)'
    ),
  
  images: z.array(z.string())
    .optional()
    .refine(
      (imgs) => !imgs || imgs.every(img => img.startsWith('data:image/') || img.startsWith('http')),
      'Todas las imágenes deben ser válidas (base64 o URL)'
    ),
  
  deliveryMode: z.enum(['cook', 'external'], {
    message: 'Selecciona un modo de entrega válido'
  }).optional(),
  
  deliveryFee: z.number()
    .min(0, 'La tarifa de entrega debe ser mayor o igual a 0')
    .optional()
});

// Dish update schema (all fields optional except ID)
export const updateDishSchema = z.object({
  id: z.string().min(1, 'ID del plato es requerido'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  price: z.number()
    .positive('El precio debe ser mayor a 0')
    .min(500, 'El precio mínimo es $500 CLP')
    .max(50000, 'El precio máximo es $50,000 CLP')
    .int('El precio debe ser un número entero')
    .optional(),
  isAvailable: z.boolean().optional()
});

// Input validation for dish search/filtering
export const dishSearchSchema = z.object({
  query: z.string()
    .max(100, 'La búsqueda no puede exceder 100 caracteres')
    .optional(),
  category: z.enum(['Platos principales', 'Acompañamientos', 'Bebidas'])
    .optional(),
  minPrice: z.number()
    .min(0, 'El precio mínimo debe ser mayor o igual a 0')
    .optional(),
  maxPrice: z.number()
    .min(0, 'El precio máximo debe ser mayor o igual a 0')
    .optional(),
  cookerId: z.string().optional()
}).refine(
  (data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
  {
    message: 'El precio mínimo debe ser menor o igual al precio máximo',
    path: ['maxPrice']
  }
);

export type AddDishFormData = z.infer<typeof addDishSchema>;
export type UpdateDishFormData = z.infer<typeof updateDishSchema>;
export type DishSearchData = z.infer<typeof dishSearchSchema>;