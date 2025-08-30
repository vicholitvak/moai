import { z } from 'zod';

// Email validation
const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'El email es requerido')
  .max(100, 'El email no puede exceder 100 caracteres')
  .toLowerCase();

// Password validation
const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .regex(/(?=.*[a-z])/, 'Debe contener al menos una letra minúscula')
  .regex(/(?=.*[A-Z])/, 'Debe contener al menos una letra mayúscula')
  .regex(/(?=.*\d)/, 'Debe contener al menos un número')
  .regex(/(?=.*[@$!%*?&])/, 'Debe contener al menos un carácter especial (@$!%*?&)');

// Chilean phone number validation
const phoneSchema = z.string()
  .regex(/^\+56[1-9]\d{8}$/, 'Formato de teléfono chileno inválido (+56xxxxxxxxx)')
  .or(z.string().regex(/^[1-9]\d{8}$/, 'Formato de teléfono inválido (xxxxxxxxx)'));

// Name validation (Chilean names)
const nameSchema = z.string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios')
  .transform(name => name.trim().replace(/\s+/g, ' '));

// Sign up schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: nameSchema,
  role: z.enum(['customer', 'cooker', 'driver'], {
    errorMap: () => ({ message: 'Selecciona un rol válido' })
  }),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'Debes aceptar los términos y condiciones')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
);

// Sign in schema (for email/password)
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida')
});

// Sign in with token schema (for Firebase Auth)
export const signInWithTokenSchema = z.object({
  idToken: z.string().min(1, 'Token de autenticación es requerido')
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword']
  }
);

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional(),
  bio: z.string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional()
});

// Cook profile schema
export const cookProfileSchema = z.object({
  displayName: nameSchema,
  phone: phoneSchema,
  address: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  bio: z.string()
    .min(20, 'La biografía debe tener al menos 20 caracteres')
    .max(500, 'La biografía no puede exceder 500 caracteres'),
  specialties: z.array(z.string().min(1))
    .min(1, 'Debe especificar al menos una especialidad')
    .max(10, 'Máximo 10 especialidades'),
  experience: z.string()
    .min(10, 'Describe tu experiencia (mínimo 10 caracteres)')
    .max(300, 'La descripción de experiencia no puede exceder 300 caracteres'),
  certifications: z.array(z.string()).optional()
});

// Driver profile schema
export const driverProfileSchema = z.object({
  displayName: nameSchema,
  phone: phoneSchema,
  vehicleType: z.enum(['bicycle', 'motorcycle', 'car'], {
    errorMap: () => ({ message: 'Selecciona un tipo de vehículo válido' })
  }),
  vehiclePlate: z.string()
    .min(6, 'La patente debe tener al menos 6 caracteres')
    .max(8, 'La patente no puede exceder 8 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'Formato de patente inválido')
    .transform(plate => plate.toUpperCase()),
  driverLicense: z.string()
    .min(8, 'La licencia debe tener al menos 8 caracteres')
    .max(12, 'La licencia no puede exceder 12 caracteres'),
  emergencyContact: z.object({
    name: nameSchema,
    phone: phoneSchema,
    relationship: z.string()
      .min(2, 'La relación debe tener al menos 2 caracteres')
      .max(30, 'La relación no puede exceder 30 caracteres')
  })
});

// Admin role assignment schema
export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  newRole: z.enum(['customer', 'cooker', 'driver', 'admin'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  reason: z.string()
    .min(10, 'Debe proporcionar una razón (mínimo 10 caracteres)')
    .max(200, 'La razón no puede exceder 200 caracteres')
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignInWithTokenFormData = z.infer<typeof signInWithTokenSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type CookProfileFormData = z.infer<typeof cookProfileSchema>;
export type DriverProfileFormData = z.infer<typeof driverProfileSchema>;
export type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>;