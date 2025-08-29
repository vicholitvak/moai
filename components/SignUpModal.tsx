"use client";

import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from 'react-icons/fc';

interface SignUpModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const getFirebaseErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo. Por favor, inicia sesión.';
    case 'auth/invalid-email':
      return 'Por favor, ingresa un correo electrónico válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    default:
      return 'Ocurrió un error durante el registro. Por favor, intenta de nuevo.';
  }
};


const roles = [
  { value: 'Client', label: 'Cliente' },
  { value: 'Cook', label: 'Cocinero' },
  { value: 'Driver', label: 'Repartidor' },
];

const SignUpModal = ({ isOpen, onOpenChange }: SignUpModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // TODO: Save role to user profile in Firestore
      toast.success('Cuenta creada exitosamente.');
      onOpenChange(false);
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
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // TODO: Save role to user profile in Firestore
      toast.success('Cuenta creada con Google.');
      onOpenChange(false);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
  <DialogContent className="bg-white border !shadow-none" style={{ background: '#fff', boxShadow: 'none' }}>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold text-atacama-brown">Crear Cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignUp} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atacama-orange"
              required
              disabled={isLoading || isGoogleLoading}
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <Button type="submit" className="w-full bg-atacama-orange text-white font-bold !shadow-none" style={{ boxShadow: 'none' }} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Crear Cuenta'}
          </Button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-sm">o</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <Button
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 !shadow-none"
          style={{ boxShadow: 'none' }}
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
        >
          <FcGoogle className="text-xl" />
          {isGoogleLoading ? 'Cargando...' : 'Registrarse con Google'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;