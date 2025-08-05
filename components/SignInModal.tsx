'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Utility function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.';
    default:
      return 'An error occurred during sign-in. Please try again.';
  }
};

// Form validation
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

const SignInModal = ({ isOpen, onOpenChange }: SignInModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setEmailError('');
    setPasswordError('');
    
    // Validate form
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
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back! You\'ve signed in successfully.');
      onOpenChange(false);
      // AuthHandler will handle role-based routing
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getFirebaseErrorMessage(err as AuthError)
        : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setIsGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      toast.success('Welcome back! You\'ve signed in with Google successfully.');
      onOpenChange(false);
      // AuthHandler will handle role-based routing
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getFirebaseErrorMessage(err as AuthError)
        : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail('');
      setPassword('');
      setError('');
      setEmailError('');
      setPasswordError('');
      setIsLoading(false);
      setIsGoogleLoading(false);
      setShowPassword(false);
      setRememberMe(false);
    }
    onOpenChange(open);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-atacama-beige/20 shadow-2xl bg-white/95 backdrop-blur-sm">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold text-atacama-brown">Bienvenido de Vuelta</DialogTitle>
          <DialogDescription className="text-atacama-brown/70">
            Inicia sesión en tu cuenta para continuar tu viaje culinario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Google Sign In Button */}
          <Button 
            variant="outline" 
            className="w-full h-11 font-medium border-2 border-atacama-beige/30 hover:bg-atacama-beige/10 hover:border-atacama-orange/30 transition-colors" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
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
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">O inicia sesión con email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
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
                  onChange={handleEmailChange}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-atacama-brown">
                  Contraseña
                </Label>
                <button
                  type="button"
                  className="text-sm text-atacama-orange hover:text-atacama-orange/80 font-medium transition-colors"
                  onClick={() => toast.info('La función de restablecimiento de contraseña está en desarrollo!')}
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
                  onChange={handlePasswordChange}
                  placeholder="Ingresa tu contraseña"
                  className={`pl-10 pr-10 h-11 border-atacama-beige/40 focus-visible:ring-atacama-orange focus-visible:border-atacama-orange ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="current-password"
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
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-atacama-orange bg-background border-atacama-beige/40 rounded focus:ring-atacama-orange focus:ring-2"
                disabled={isLoading || isGoogleLoading}
              />
              <Label htmlFor="remember" className="text-sm text-atacama-brown/70 cursor-pointer">
                Recordarme por 30 días
              </Label>
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;