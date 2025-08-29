'use client';

import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserRole {
  role: 'customer' | 'cooker' | 'driver' | 'admin';
  isAdmin: boolean;
  permissions?: string[];
}

export interface UserProfile extends UserRole {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
}

class AuthService {
  // Verificar si el usuario es admin basado en custom claims y Firestore
  static async checkAdminStatus(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    try {
      // 1. Primero verificar custom claims del token
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin === true) {
        return true;
      }
      
      // 2. Verificar en la colección de admins en Firestore
      const adminRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminRef);
      
      if (adminDoc.exists() && adminDoc.data().isActive === true) {
        // Actualizar el custom claim si no está presente
        // Esto normalmente se haría en una Cloud Function
        return true;
      }
      
      // 3. Verificar el rol del usuario en la colección users
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
  
  // Obtener el perfil completo del usuario con roles y permisos
  static async getUserProfile(user: User | null): Promise<UserProfile | null> {
    if (!user) return null;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      const isAdmin = await this.checkAdminStatus(user);
      
      return {
        uid: user.uid,
        email: user.email ?? '',
        displayName: userData.displayName ?? user.displayName ?? '',
        role: userData.role ?? 'customer',
        isAdmin,
        permissions: userData.permissions ?? [],
        createdAt: userData.createdAt?.toDate() ?? new Date(),
        lastLogin: new Date()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
  
  // Verificar permisos específicos
  static async hasPermission(user: User | null, permission: string): Promise<boolean> {
    if (!user) return false;
    
    const profile = await this.getUserProfile(user);
    if (!profile) return false;
    
    // Los admins tienen todos los permisos
    if (profile.isAdmin) return true;
    
    // Verificar permisos específicos
    return profile.permissions?.includes(permission) || false;
  }
  
  // Actualizar el rol del usuario (solo para admins)
  static async updateUserRole(
    adminUser: User,
    targetUserId: string,
    newRole: UserRole['role']
  ): Promise<boolean> {
    try {
      // Verificar que el usuario actual es admin
      const isAdmin = await this.checkAdminStatus(adminUser);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can update user roles');
      }
      
      // Actualizar el rol en Firestore
      const userRef = doc(db, 'users', targetUserId);
      await setDoc(userRef, {
        role: newRole,
        updatedBy: adminUser.uid,
        updatedAt: new Date()
      }, { merge: true });
      
      // Si se está promoviendo a admin, agregar a la colección de admins
      if (newRole === 'admin') {
        const adminRef = doc(db, 'admins', targetUserId);
        await setDoc(adminRef, {
          isActive: true,
          promotedBy: adminUser.uid,
          promotedAt: new Date()
        });
      } else {
        // Si se está removiendo el rol de admin, marcar como inactivo
        const adminRef = doc(db, 'admins', targetUserId);
        await setDoc(adminRef, {
          isActive: false,
          demotedBy: adminUser.uid,
          demotedAt: new Date()
        }, { merge: true });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }
  
  // Lista de correos autorizados como super admins (solo para bootstrap inicial)
  private static readonly SUPER_ADMIN_EMAILS = [
    'admin@moai.com',
    'superadmin@moai.com'
  ];
  
  // Bootstrap inicial de admin (solo usar en desarrollo)
  static async bootstrapAdmin(user: User): Promise<boolean> {
    if (!user.email || !this.SUPER_ADMIN_EMAILS.includes(user.email)) {
      return false;
    }
    
    try {
      // Crear entrada en la colección de admins
      const adminRef = doc(db, 'admins', user.uid);
      await setDoc(adminRef, {
        email: user.email,
        isActive: true,
        isSuperAdmin: true,
        createdAt: new Date()
      });
      
      // Actualizar el rol en la colección de usuarios
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        role: 'admin',
        isSuperAdmin: true
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error bootstrapping admin:', error);
      return false;
    }
  }
}

export default AuthService;