'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, User, ChefHat, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Role configuration
const ROLES = [
  {
    value: 'Client',
    label: 'Cliente',
    icon: ShoppingBag,
    description: 'Ordena deliciosa comida casera de cocineros locales',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    benefits: [
      '🍽️ Comida casera auténtica',
      '📱 Seguimiento en tiempo real',
      '⭐ Reviews y calificaciones'
    ]
  },
  {
    value: 'Cooker',
    label: 'Cocinero',
    icon: ChefHat,
    description: 'Comparte tus habilidades culinarias y gana dinero desde casa',
    color: 'bg-gradient-to-r from-atacama-orange to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    benefits: [
      '💰 Gana dinero cocinando',
      '🏠 Trabaja desde casa',
      '👥 Construye tu clientela'
    ]
  },
  {
    value: 'Driver',
    label: 'Conductor',
    icon: Truck,
    description: 'Entrega comida y gana ingresos flexibles en tu tiempo libre',
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    benefits: [
      '🚗 Horarios flexibles',
      '💵 Pagos inmediatos',
      '📊 Optimización de rutas'
    ]
  }
];

// Utility function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo. Por favor, inicia sesión.';
    case 'auth/invalid-email':
      return 'Por favor, ingresa un correo electrónico válido.';
    case 'auth/operation-not-allowed':
      return 'El registro con email/contraseña no está habilitado. Contacta soporte.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de red. Por favor, verifica tu conexión e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
      return 'El registro fue cancelado.';
    case 'auth/popup-blocked':
      return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e intenta de nuevo.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este email usando un método diferente.';
    default:
      return 'Ocurrió un error durante el registro. Por favor, intenta de nuevo.';
  }
};

// Form validation
const validateEmail = (email: string): string | null => {
  if (!email) return 'El correo electrónico es requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Por favor, ingresa un correo electrónico válido';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  return null;
};

const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/(?=.*[a-z])/.test(password)) strength++;
  if (/(?=.*[A-Z])/.test(password)) strength++;
  if (/(?=.*\d)/.test(password)) strength++;
  if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
  
  if (strength <= 2) return { strength, label: 'Débil', color: 'bg-red-500' };
  if (strength <= 4) return { strength, label: 'Media', color: 'bg-yellow-500' };
  return { strength, label: 'Fuerte', color: 'bg-green-500' };
};

function SignUpPageContent() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  let user = null;
  try {
    const authData = useAuth();
    user = authData?.user;
  } catch (error) {
    console.error('Auth context error:', error);
  }

  // Handle redirect when user is authenticated
  useEffect(() => {
    if (user) {
      router.push(returnUrl);
    }
  }, [user, router, returnUrl]);

  // Show loading while redirecting
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atacama-orange mx-auto mb-4"></div>
          <p className="text-atacama-brown/70">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRole(roleValue);
    setStep('form');
  };

  const handleBackToRoles = () => {
    setStep('role');
    setError('');
    setEmailError('');
    setPasswordError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document with selected role
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        displayName: userCredential.user.displayName || (userCredential.user.email ? userCredential.user.email.split('@')[0] : 'Usuario'),
        uid: userCredential.user.uid,
        role: selectedRole
      });
      toast.success(`¡Bienvenido! Tu cuenta de ${ROLES.find(r => r.value === selectedRole)?.label.toLowerCase()} ha sido creada.`);
      router.push(returnUrl);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists, if not create it with selected role
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: new Date().toISOString(),
          displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
          uid: user.uid,
          role: selectedRole
        });
      }
      
      toast.success(`¡Bienvenido! Tu cuenta de ${ROLES.find(r => r.value === selectedRole)?.label.toLowerCase()} ha sido creada con Google.`);
      router.push(returnUrl);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const selectedRoleData = ROLES.find(r => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-atacama-brown hover:text-atacama-orange transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <h1 className="text-4xl font-bold text-atacama-brown mb-2">Únete a LicanÑam</h1>
          <p className="text-lg text-atacama-brown/70">
            {step === 'role' 
              ? 'Elige cómo quieres formar parte de nuestra comunidad culinaria'
              : `Completa tu registro como ${selectedRoleData?.label}`
            }
          </p>
        </div>

        {step === 'role' ? (
          /* Role Selection */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ROLES.map((role, index) => {
                const IconComponent = role.icon;
                return (
                  <motion.div
                    key={role.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 hover:border-atacama-orange/50"
                      onClick={() => handleRoleSelect(role.value)}
                    >
                      <CardHeader className="text-center">
                        <div className={`w-16 h-16 rounded-full ${role.color} ${role.hoverColor} mx-auto mb-4 flex items-center justify-center transition-all duration-300`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-atacama-brown">
                          {role.label}
                        </CardTitle>
                        <CardDescription className="text-sm text-atacama-brown/70">
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {role.benefits.map((benefit, idx) => (
                            <div key={idx} className="text-sm text-atacama-brown/80 flex items-center gap-2">
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className={`w-full mt-4 ${role.color} ${role.hoverColor} text-white font-semibold`}
                          onClick={() => handleRoleSelect(role.value)}
                        >
                          Elegir {role.label}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Registration Form */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-2 border-atacama-beige/20 shadow-2xl">
              <CardHeader className="text-center space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToRoles}
                  className="self-start mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cambiar rol
                </Button>
                
                {selectedRoleData && (
                  <div className={`w-12 h-12 rounded-full ${selectedRoleData.color} mx-auto mb-4 flex items-center justify-center`}>
                    <selectedRoleData.icon className="h-6 w-6 text-white" />
                  </div>
                )}
                
                <CardTitle className="text-2xl font-bold text-atacama-brown">
                  Registro de {selectedRoleData?.label}
                </CardTitle>
                <CardDescription className="text-atacama-brown/70">
                  {selectedRoleData?.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Google Sign Up Button */}
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full h-11 font-semibold bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
                  variant="outline"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando con Google...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </Button>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-atacama-brown/70 font-medium">O regístrate con email</span>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-atacama-beige/40" />
                  </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-sm font-medium text-atacama-brown">
                      Dirección de Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-atacama-brown/60" />
                      <Input
                        id="email-signup"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        placeholder="name@example.com"
                        className={`pl-10 h-11 border-atacama-beige/40 focus-visible:ring-atacama-orange focus-visible:border-atacama-orange ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        autoComplete="email"
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 bg-destructive rounded-full"></span>
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-sm font-medium text-atacama-brown">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-atacama-brown/60" />
                      <Input
                        id="password-signup"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder="Ingresa tu contraseña"
                        className={`pl-10 pr-10 h-11 border-atacama-beige/40 focus-visible:ring-atacama-orange focus-visible:border-atacama-orange ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        autoComplete="new-password"
                        disabled={isLoading || isGoogleLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-atacama-brown/60 hover:text-atacama-brown transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isLoading || isGoogleLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fortaleza de la contraseña:</span>
                          <span className={`font-medium ${
                            passwordStrength.label === 'Débil' ? 'text-red-500' :
                            passwordStrength.label === 'Media' ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {passwordError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 bg-destructive rounded-full"></span>
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* General Error */}
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive text-center font-medium">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 font-semibold bg-atacama-orange hover:bg-atacama-orange/90 text-white" 
                    disabled={isLoading || isGoogleLoading || !email || !password}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>

                {/* Sign In Link */}
                <p className="text-center text-sm text-atacama-brown/70">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-atacama-orange hover:text-atacama-orange/80 font-medium transition-colors">
                    Inicia Sesión
                  </Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atacama-orange mx-auto mb-4"></div>
          <p className="text-atacama-brown/70">Cargando...</p>
        </div>
      </div>
    }>
      <SignUpPageContent />
    </Suspense>
  );
}