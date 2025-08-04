import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    district: string; // Comuna in Chile
    details?: string; // Apartment number, building name, etc.
    instructions?: string; // Delivery instructions
    fullAddress: string; // Complete formatted address
  };
  isProfileComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class UserProfileService {
  private static collection = 'userProfiles';

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, this.collection, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Create user profile
  static async createUserProfile(
    userId: string, 
    email: string, 
    displayName: string
  ): Promise<UserProfile | null> {
    try {
      const now = Timestamp.now();
      const profile: UserProfile = {
        id: userId,
        email,
        displayName,
        phone: '',
        address: {
          street: '',
          city: 'Santiago',
          district: '',
          details: '',
          instructions: '',
          fullAddress: ''
        },
        isProfileComplete: false,
        createdAt: now,
        updatedAt: now
      };

      const docRef = doc(db, this.collection, userId);
      await setDoc(docRef, profile);
      
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string, 
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, userId);
      
      // Check if profile is complete after update
      const isComplete = this.checkProfileComplete({
        phone: updates.phone || '',
        address: updates.address || {
          street: '',
          city: '',
          district: '',
          fullAddress: ''
        }
      });

      const updateData = {
        ...updates,
        isProfileComplete: isComplete,
        updatedAt: Timestamp.now()
      };

      // Update full address if address components are provided
      if (updates.address) {
        updateData.address = {
          ...updates.address,
          fullAddress: this.formatFullAddress(updates.address)
        };
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Check if profile is complete (has required fields)
  private static checkProfileComplete(profile: Partial<UserProfile>): boolean {
    return !!(
      profile.phone && 
      profile.address?.street && 
      profile.address?.city && 
      profile.address?.district
    );
  }

  // Format full address for display and delivery
  private static formatFullAddress(address: UserProfile['address']): string {
    const parts = [
      address.street,
      address.details,
      address.district,
      address.city
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Get or create user profile (used in AuthContext)
  static async getOrCreateProfile(
    userId: string, 
    email: string, 
    displayName: string
  ): Promise<UserProfile | null> {
    try {
      // Try to get existing profile
      let profile = await this.getUserProfile(userId);
      
      if (!profile) {
        // Create new profile if doesn't exist
        profile = await this.createUserProfile(userId, email, displayName);
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting or creating user profile:', error);
      return null;
    }
  }

  // Chilean communes (comunas) for address selection
  static getChileanCommunes(): string[] {
    return [
      'Las Condes',
      'Providencia',
      'Santiago',
      'Ñuñoa',
      'La Reina',
      'Vitacura',
      'Lo Barnechea',
      'Macul',
      'Peñalolén',
      'La Florida',
      'Puente Alto',
      'Maipú',
      'Las Rozas',
      'Quilicura',
      'Huechuraba',
      'Recoleta',
      'Independencia',
      'Conchalí',
      'Renca',
      'Quinta Normal',
      'Estación Central',
      'Cerrillos',
      'Maipú',
      'Pudahuel',
      'Lo Prado',
      'Cerro Navia',
      'San Miguel',
      'San Joaquín',
      'Pedro Aguirre Cerda',
      'Lo Espejo',
      'El Bosque',
      'La Cisterna',
      'San Ramón',
      'La Granja',
      'La Pintana'
    ].sort();
  }

  // Validate Chilean phone number
  static validateChileanPhone(phone: string): boolean {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Chilean mobile numbers: +56 9 XXXX XXXX (9 digits after country code)
    // Chilean landlines: +56 2 XXXX XXXX (8 digits after area code)
    return (
      cleanPhone.length === 11 && cleanPhone.startsWith('569') || // Mobile with country code
      cleanPhone.length === 10 && cleanPhone.startsWith('56') || // Landline with country code  
      cleanPhone.length === 9 && cleanPhone.startsWith('9') || // Mobile without country code
      cleanPhone.length === 8 && cleanPhone.startsWith('2') // Landline without country code
    );
  }

  // Format Chilean phone number for display
  static formatChileanPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      // Mobile: 9 XXXX XXXX
      return `${cleanPhone.slice(0, 1)} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
    } else if (cleanPhone.length === 8 && cleanPhone.startsWith('2')) {
      // Landline: 2 XXXX XXXX
      return `${cleanPhone.slice(0, 1)} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
    }
    
    return phone; // Return as-is if doesn't match expected format
  }
}