'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
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
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-up was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'An error occurred during sign-up. Please try again.';
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
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
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
  
  if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
  if (strength <= 4) return { strength, label: 'Medium', color: 'bg-yellow-500' };
  return { strength, label: 'Strong', color: 'bg-green-500' };
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
  const [acceptTerms, setAcceptTerms] = useState(false);

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
    
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), { 
        role,
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        displayName: userCredential.user.displayName || email.split('@')[0]
      });
      toast.success(`Welcome to Moai! Your ${role.toLowerCase()} account has been created successfully.`);
      onOpenChange(false);
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
    
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }
    
    setIsGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      // Save the selected role and additional user info to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), { 
        role,
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        photoURL: userCredential.user.photoURL
      });
      toast.success(`Welcome to Moai! Your ${role.toLowerCase()} account has been created successfully.`);
      onOpenChange(false);
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
      setAcceptTerms(false);
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
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto m-2 sm:m-0">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold text-foreground">Join Moai</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create your account to start your culinary adventure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Google Sign Up Button */}
          <Button 
            variant="outline" 
            className="w-full h-12 sm:h-11 font-medium border-2 hover:bg-gray-50 transition-colors text-sm sm:text-base" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="mr-2 w-4 h-4 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">
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
              <span className="bg-background px-3 text-muted-foreground font-medium">O crea con email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Quiero unirme como...
              </Label>
              <ToggleGroup 
                type="single" 
                value={role} 
                onValueChange={(value) => setRole(value || 'Client')} 
                className="grid grid-cols-3 gap-2 w-full" 
                variant="outline"
              >
                <ToggleGroupItem value="Client" className="text-xs sm:text-sm py-3 px-2 sm:px-3 flex-1 text-center min-h-[44px]">Cliente</ToggleGroupItem>
                <ToggleGroupItem value="Cooker" className="text-xs sm:text-sm py-3 px-2 sm:px-3 flex-1 text-center min-h-[44px]">Cocinero</ToggleGroupItem>
                <ToggleGroupItem value="Driver" className="text-xs sm:text-sm py-3 px-2 sm:px-3 flex-1 text-center min-h-[44px]">Conductor</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground text-center">
                {role === 'Client' && 'Ordena deliciosa comida casera de cocineros locales'}
                {role === 'Cooker' && 'Comparte tus habilidades culinarias y gana dinero'}
                {role === 'Driver' && 'Entrega comida y gana ingresos flexibles'}
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email-signup" className="text-sm font-medium text-foreground">
                Dirección de Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-signup"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  className={`pl-10 h-11 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
              <Label htmlFor="password-signup" className="text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password-signup"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Ingresa tu contraseña segura"
                  className={`pl-10 pr-10 h-11 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading || isGoogleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-500' : 'text-green-500'
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

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 mt-0.5"
                disabled={isLoading || isGoogleLoading}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-5">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                  onClick={() => toast.info('Terms and conditions coming soon!')}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                  onClick={() => toast.info('Privacy policy coming soon!')}
                >
                  Privacy Policy
                </button>
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
              className="w-full h-12 sm:h-11 font-semibold text-sm sm:text-base" 
              disabled={isLoading || isGoogleLoading || !email || !password || !acceptTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create ${role} Account`
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;