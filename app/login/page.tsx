// app/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

// Utility function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No se encontró una cuenta con este correo.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Por favor, intenta de nuevo.';
    case 'auth/invalid-email':
      return 'Por favor, ingresa un correo electrónico válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada. Por favor, contacta soporte.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
    case 'auth/network-request-failed':
      return 'Error de red. Por favor, verifica tu conexión e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
      return 'El inicio de sesión fue cancelado.';
    case 'auth/popup-blocked':
      return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e intenta de nuevo.';
    default:
      return 'Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo.';
  }
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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

  // Show loading or return null while redirecting
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('¡Bienvenido de vuelta! Has iniciado sesión exitosamente.');
      // Redirection handled by AuthContext and root page.tsx
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'code' in error
        ? getFirebaseErrorMessage(error as AuthError)
        : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      toast.success('¡Bienvenido de vuelta! Has iniciado sesión con Google exitosamente.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'code' in error
        ? getFirebaseErrorMessage(error as AuthError)
        : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg bg-white/95 backdrop-blur-sm p-8 shadow-2xl border-2 border-atacama-beige/20">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-atacama-brown">Bienvenido de Vuelta</h2>
            <p className="text-atacama-brown/70">
              Inicia sesión en tu cuenta para continuar tu viaje culinario.
            </p>
          </div>

          <div className="space-y-6 mt-6">
            {/* Google Sign In Button */}
            <Button 
              variant="outline" 
              className="w-full h-11 font-medium border-2 border-atacama-beige/30 hover:bg-atacama-beige/10 hover:border-atacama-orange/30 transition-colors" 
              onClick={handleGoogleSignIn} 
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <div className="mr-2 w-4 h-4 bg-gradient-to-r from-atacama-orange via-atacama-brown to-atacama-beige rounded-sm flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
              )}
              Continuar con Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-atacama-beige/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-atacama-brown/70 font-medium">O inicia sesión con email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-atacama-brown">
                  Dirección de Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-atacama-brown/60" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 h-11 border-atacama-beige/40 focus-visible:ring-atacama-orange focus-visible:border-atacama-orange"
                    autoComplete="email"
                    disabled={loading || googleLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-atacama-brown">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-atacama-orange hover:text-atacama-orange/80 font-medium transition-colors"
                    onClick={() => toast.info('¡La función de restablecimiento de contraseña está en desarrollo!')}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-atacama-brown/60" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="pl-10 pr-10 h-11 border-atacama-beige/40 focus-visible:ring-atacama-orange focus-visible:border-atacama-orange"
                    autoComplete="current-password"
                    disabled={loading || googleLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-atacama-brown/60 hover:text-atacama-brown transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={loading || googleLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                disabled={loading || googleLoading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-atacama-brown/70">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="text-atacama-orange hover:text-atacama-orange/80 font-medium transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atacama-orange mx-auto mb-4"></div>
          <p className="text-atacama-brown/70">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}