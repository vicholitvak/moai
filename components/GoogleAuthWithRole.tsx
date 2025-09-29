'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Loader2, ChefHat, Truck, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoogleAuthWithRoleProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
  className?: string;
}

// Role configuration
const ROLES = [
  {
    value: 'Client',
    label: 'Cliente',
    icon: ShoppingBag,
    description: 'Ordena deliciosa comida casera',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
  },
  {
    value: 'Cooker',
    label: 'Cocinero',
    icon: ChefHat,
    description: 'Comparte tus habilidades culinarias',
    color: 'bg-gradient-to-r from-atacama-orange to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
  },
  {
    value: 'Driver',
    label: 'Conductor',
    icon: Truck,
    description: 'Entrega comida y gana dinero',
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
  }
];

const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'El proceso fue cancelado.';
    case 'auth/popup-blocked':
      return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e intenta de nuevo.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este email usando un método diferente.';
    case 'auth/network-request-failed':
      return 'Error de red. Por favor, verifica tu conexión e intenta de nuevo.';
    default:
      return 'Ocurrió un error durante el proceso. Por favor, intenta de nuevo.';
  }
};

export default function GoogleAuthWithRole({
  onSuccess,
  onError,
  buttonText = "Continuar con Google",
  disabled = false,
  className = ""
}: GoogleAuthWithRoleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleGoogleClick = async () => {
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // User already exists, proceed normally
        toast.success('¡Bienvenido de vuelta!');
        onSuccess?.();
      } else {
        // New user, show role selection dialog
        setPendingUser(user);
        setShowRoleDialog(true);
      }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (roleValue: string) => {
    if (!pendingUser) return;

    setSelectedRole(roleValue);
    
    try {
      const userDocRef = doc(db, 'users', pendingUser.uid);
      await setDoc(userDocRef, {
        email: pendingUser.email,
        createdAt: new Date().toISOString(),
        displayName: pendingUser.displayName || (pendingUser.email ? pendingUser.email.split('@')[0] : 'Usuario'),
        uid: pendingUser.uid,
        role: roleValue
      });
      
      const roleLabel = ROLES.find(r => r.value === roleValue)?.label.toLowerCase();
      toast.success(`¡Bienvenido! Tu cuenta de ${roleLabel} ha sido creada con Google.`);
      
      setShowRoleDialog(false);
      setPendingUser(null);
      setSelectedRole('');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating user document:', error);
      toast.error('Error al completar el registro. Por favor, intenta de nuevo.');
      onError?.('Error al completar el registro');
    }
  };

  const handleDialogClose = () => {
    setShowRoleDialog(false);
    setPendingUser(null);
    setSelectedRole('');
    // Sign out the pending user since they haven't completed registration
    if (pendingUser) {
      auth.signOut();
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleGoogleClick}
        disabled={disabled || isLoading}
        className={`w-full h-11 font-semibold bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 ${className}`}
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {buttonText}
          </>
        )}
      </Button>

      {/* Role Selection Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md border-2 border-atacama-beige/20 shadow-2xl bg-white">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold text-atacama-brown">
              ¿Cómo quieres usar LicanÑam?
            </DialogTitle>
            <DialogDescription className="text-atacama-brown/70">
              Selecciona tu rol para personalizar tu experiencia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-6">
            {ROLES.map((role, index) => {
              const IconComponent = role.icon;
              return (
                <motion.div
                  key={role.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handleRoleSelection(role.value)}
                    className="w-full p-4 rounded-lg border-2 border-atacama-beige/30 hover:border-atacama-orange/50 transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${role.color} ${role.hoverColor} flex items-center justify-center transition-all duration-200 group-hover:scale-110`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-atacama-brown">{role.label}</div>
                        <div className="text-sm text-atacama-brown/70">{role.description}</div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleDialogClose}
              className="text-sm text-atacama-brown/70 hover:text-atacama-brown transition-colors"
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}