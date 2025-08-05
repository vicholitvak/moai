'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SignUpModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Utility function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo. Por favor, inicia sesión.';
    case 'auth/invalid-email':
      return 'Por favor, ingresa un correo electrónico válido.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de red. Por favor, verifica tu conexión e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
      return 'El registro fue cancelado.';
    case 'auth/popup-blocked':
      return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e intenta de nuevo.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
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
  if (!/(?=.*[a-z])/.test(password)) return 'La contraseña debe contener al menos una letra minúscula';
  if (!/(?=.*[A-Z])/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula';
  if (!/(?=.*\d)/.test(password)) return 'La contraseña debe contener al menos un número';
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

const SignUpModal = ({ isOpen, onOpenChange }: SignUpModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Client');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Ensure the user document is created with the selected role
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, { 
        role,
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        displayName: userCredential.user.displayName || email.split('@')[0],
        uid: userCredential.user.uid
      });
      
      // Wait a moment to ensure Firestore has processed the write
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a refresh of the auth state to pick up the new role
      await auth.currentUser?.reload();
      
      toast.success(`¡Bienvenido a LicanÑam! Tu cuenta de ${role.toLowerCase() === 'client' ? 'cliente' : role.toLowerCase() === 'cooker' ? 'cocinero' : 'conductor'} ha sido creada exitosamente.`);
      
      // Redirect based on role immediately
      onOpenChange(false);
      window.location.reload(); // Force a full reload to ensure AuthContext picks up the new role
    } catch (err: any) {
      const errorMessage = err?.code 
        ? getFirebaseErrorMessage(err as AuthError)
        : 'An unexpected error occurred. Please try again.';
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
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user already exists in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Existing user - they should use sign in instead
        toast.error('Ya tienes una cuenta. Por favor, usa el botón de iniciar sesión.');
        await auth.signOut();
        onOpenChange(false);
        return;
      }
      
      // New user - create their document with selected role
      await setDoc(userDocRef, { 
        role,
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        photoURL: userCredential.user.photoURL,
        uid: userCredential.user.uid
      });
      
      // Wait a moment to ensure Firestore has processed the write
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a refresh of the auth state to pick up the new role
      await auth.currentUser?.reload();
      
      toast.success(`¡Bienvenido a LicanÑam! Tu cuenta de ${role.toLowerCase() === 'client' ? 'cliente' : role.toLowerCase() === 'cooker' ? 'cocinero' : 'conductor'} ha sido creada exitosamente.`);
      
      // Redirect based on role immediately
      onOpenChange(false);
      window.location.reload(); // Force a full reload to ensure AuthContext picks up the new role
    } catch (err: any) {
      const errorMessage = err?.code 
        ? getFirebaseErrorMessage(err as AuthError)
        : 'An unexpected error occurred. Please try again.';
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
      setRole('Client');
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

  const passwordStrength = getPasswordStrength(password);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-atacama-beige/20 shadow-2xl bg-white/95 backdrop-blur-sm">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold text-atacama-brown">Únete a LicanÑam</DialogTitle>
          <DialogDescription className="text-atacama-brown/70">
            Crea tu cuenta para comenzar tu aventura culinaria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Google Sign Up Button */}
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
              <span className="bg-background px-3 text-muted-foreground font-medium">O regístrate con email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-atacama-brown flex items-center gap-2">
                <User className="h-4 w-4 text-atacama-orange" />
                Quiero unirme como...
              </Label>
              <ToggleGroup 
                type="single" 
                value={role} 
                onValueChange={(value) => setRole(value || 'Client')} 
                className="grid grid-cols-3 gap-2 w-full" 
                variant="outline"
              >
                <ToggleGroupItem value="Client" className="text-sm py-2.5 px-3 flex-1 text-center border-atacama-beige/40 data-[state=on]:bg-atacama-orange data-[state=on]:text-white data-[state=on]:hover:bg-atacama-orange/90 hover:bg-atacama-beige/10 hover:text-atacama-brown transition-colors">Cliente</ToggleGroupItem>
                <ToggleGroupItem value="Cooker" className="text-sm py-2.5 px-3 flex-1 text-center border-atacama-beige/40 data-[state=on]:bg-atacama-orange data-[state=on]:text-white data-[state=on]:hover:bg-atacama-orange/90 hover:bg-atacama-beige/10 hover:text-atacama-brown transition-colors">Cocinero</ToggleGroupItem>
                <ToggleGroupItem value="Driver" className="text-sm py-2.5 px-3 flex-1 text-center border-atacama-beige/40 data-[state=on]:bg-atacama-orange data-[state=on]:text-white data-[state=on]:hover:bg-atacama-orange/90 hover:bg-atacama-beige/10 hover:text-atacama-brown transition-colors">Conductor</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-atacama-brown/70 text-center">
                {role === 'Client' && 'Ordena deliciosa comida casera de cocineros locales'}
                {role === 'Cooker' && 'Comparte tus habilidades culinarias y gana dinero'}
                {role === 'Driver' && 'Entrega comida y gana ingresos flexibles'}
              </p>
            </div>

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
              <Label htmlFor="password-signup" className="text-sm font-medium text-atacama-brown">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-atacama-brown/60" />
                <Input
                  id="password-signup"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Ingresa tu contraseña segura"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;