import { z } from 'zod';

// Order item schema
export const orderItemSchema = z.object({
  dishId: z.string().min(1, 'ID del plato es requerido'),
  dishName: z.string().min(1, 'Nombre del plato es requerido'),
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(50, 'La cantidad máxima es 50'),
  unitPrice: z.number()
    .positive('El precio unitario debe ser mayor a 0')
    .min(100, 'El precio mínimo es $100 CLP')
    .max(100000, 'El precio máximo por item es $100,000 CLP'),
  cookerId: z.string().min(1, 'ID del cocinero es requerido'),
  specialInstructions: z.string()
    .max(200, 'Las instrucciones especiales no pueden exceder 200 caracteres')
    .optional()
});

// Delivery address schema
export const deliveryAddressSchema = z.object({
  street: z.string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(100, 'La dirección no puede exceder 100 caracteres'),
  city: z.string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(50, 'La ciudad no puede exceder 50 caracteres')
    .default('Santiago'),
  region: z.string()
    .min(2, 'La región debe tener al menos 2 caracteres')
    .max(50, 'La región no puede exceder 50 caracteres')
    .default('Región Metropolitana'),
  zipCode: z.string()
    .regex(/^\d{7}$/, 'El código postal debe tener 7 dígitos')
    .optional(),
  apartment: z.string()
    .max(20, 'El número de apartamento no puede exceder 20 caracteres')
    .optional(),
  deliveryInstructions: z.string()
    .max(300, 'Las instrucciones de entrega no pueden exceder 300 caracteres')
    .optional()
});

// Payment method schema
export const paymentMethodSchema = z.object({
  type: z.enum(['cash', 'card', 'transfer'], {
    message: 'Método de pago inválido'
  }),
  cardToken: z.string().optional(), // For tokenized card payments
  transferReference: z.string().optional() // For bank transfers
}).refine(
  (data) => {
    // Card payments require a token
    if (data.type === 'card' && !data.cardToken) {
      return false;
    }
    // Transfer payments require a reference
    if (data.type === 'transfer' && !data.transferReference) {
      return false;
    }
    return true;
  },
  {
    message: 'Información de pago incompleta',
    path: ['type']
  }
);

// Create order schema
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'Debe tener al menos un item en el pedido')
    .max(20, 'Máximo 20 items por pedido'),
  deliveryAddress: deliveryAddressSchema,
  paymentMethod: paymentMethodSchema,
  tip: z.number()
    .min(0, 'La propina no puede ser negativa')
    .max(10000, 'La propina máxima es $10,000 CLP')
    .default(0),
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
}).refine(
  (data) => {
    // Calculate total to ensure it's reasonable
    const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const total = subtotal + data.tip;
    return total >= 1000 && total <= 500000; // Between $1,000 and $500,000 CLP
  },
  {
    message: 'El total del pedido debe estar entre $1,000 y $500,000 CLP',
    path: ['items']
  }
);

// Update order status schema
export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'ID del pedido es requerido'),
  status: z.enum([
    'pending',
    'accepted', 
    'preparing',
    'ready',
    'delivering',
    'delivered',
    'cancelled'
  ], {
    message: 'Estado de pedido inválido'
  }),
  estimatedDeliveryTime: z.number()
    .int('El tiempo estimado debe ser un número entero')
    .min(10, 'El tiempo mínimo de entrega es 10 minutos')
    .max(180, 'El tiempo máximo de entrega es 180 minutos')
    .optional(),
  cancellationReason: z.string()
    .min(10, 'Debe proporcionar una razón para la cancelación')
    .max(300, 'La razón no puede exceder 300 caracteres')
    .optional()
}).refine(
  (data) => {
    // Cancelled orders must have a reason
    if (data.status === 'cancelled' && !data.cancellationReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Las órdenes canceladas requieren una razón',
    path: ['cancellationReason']
  }
);

// Order search/filter schema
export const orderSearchSchema = z.object({
  status: z.enum([
    'pending',
    'accepted', 
    'preparing',
    'ready',
    'delivering',
    'delivered',
    'cancelled'
  ]).optional(),
  customerId: z.string().optional(),
  cookerId: z.string().optional(),
  driverId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional()
}).refine(
  (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
  {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['dateTo']
  }
).refine(
  (data) => !data.minAmount || !data.maxAmount || data.minAmount <= data.maxAmount,
  {
    message: 'El monto mínimo debe ser menor o igual al monto máximo',
    path: ['maxAmount']
  }
);

// Order review schema
export const orderReviewSchema = z.object({
  orderId: z.string().min(1, 'ID del pedido es requerido'),
  rating: z.number()
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  comment: z.string()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(500, 'El comentario no puede exceder 500 caracteres'),
  cookRating: z.number()
    .int('La calificación del cocinero debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  driverRating: z.number()
    .int('La calificación del conductor debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5')
    .optional()
});

export type OrderItemFormData = z.infer<typeof orderItemSchema>;
export type DeliveryAddressFormData = z.infer<typeof deliveryAddressSchema>;
export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>;
export type OrderSearchFormData = z.infer<typeof orderSearchSchema>;
export type OrderReviewFormData = z.infer<typeof orderReviewSchema>;