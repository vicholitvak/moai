'use client';

import { doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Types for location data
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Timestamp;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
}

export interface LocationData {
  coordinates: Coordinates;
  address: Address;
  isActive: boolean;
  lastUpdated: Timestamp;
}

export interface DriverLocation extends LocationData {
  driverId: string;
  isOnline: boolean;
  currentOrderId?: string;
  heading?: number; // Direction in degrees
  speed?: number; // Speed in km/h
}

export class LocationService {
  private static watchId: number | null = null;
  private static isTracking = false;

  // Get current position using browser geolocation API
  static async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Timestamp.now()
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    });
  }

  // Reverse geocoding to get address from coordinates
  static async getAddressFromCoordinates(lat: number, lng: number): Promise<Address> {
    // Check if OpenCage API key is available
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_OPENCAGE_API_KEY') {
      // API key not configured, use fallback address silently
      return {
        street: 'Dirección no disponible',
        city: 'San Pedro de Atacama',
        state: 'Región de Antofagasta',
        zipCode: '',
        country: 'Chile',
        fullAddress: 'San Pedro de Atacama, Región de Antofagasta, Chile'
      };
    }

    try {
      // Using OpenCage geocoding service
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&language=es&countrycode=cl`
      );
      
      if (!response.ok) {
        console.warn('Geocoding service temporarily unavailable, using fallback address');
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        return {
          street: `${components.house_number || ''} ${components.road || ''}`.trim(),
          city: components.city || components.town || components.village || 'Santiago',
          state: components.state || 'Región Metropolitana',
          zipCode: components.postcode || '',
          country: components.country || 'Chile',
          fullAddress: result.formatted
        };
      } else {
        // Fallback address for San Pedro de Atacama, Chile
        return {
          street: 'Dirección no disponible',
          city: 'San Pedro de Atacama',
          state: 'Región de Antofagasta',
          zipCode: '',
          country: 'Chile',
          fullAddress: 'San Pedro de Atacama, Región de Antofagasta, Chile'
        };
      }
    } catch (error) {
      // Only log unexpected errors, not expected fallback scenarios
      if (error instanceof Error && !error.message.includes('Geocoding service unavailable')) {
        console.error('Unexpected error getting address:', error);
      }
      // Return fallback San Pedro de Atacama address
      return {
        street: 'Dirección no disponible',
        city: 'San Pedro de Atacama',
        state: 'Región de Antofagasta',
        zipCode: '',
        country: 'Chile',
        fullAddress: 'San Pedro de Atacama, Región de Antofagasta, Chile'
      };
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Update cook/kitchen location in Firestore
  static async updateCookLocation(cookId: string): Promise<boolean> {
    try {
      const coordinates = await this.getCurrentPosition();
      const address = await this.getAddressFromCoordinates(
        coordinates.latitude, 
        coordinates.longitude
      );

      const locationData: LocationData = {
        coordinates,
        address,
        isActive: true,
        lastUpdated: Timestamp.now()
      };

      await updateDoc(doc(db, 'cooks', cookId), {
        location: locationData,
        'settings.lastLocationUpdate': Timestamp.now()
      });

      return true;
    } catch (error) {
      console.error('Error updating cook location:', error);
      return false;
    }
  }

  // Start real-time location tracking for drivers
  static startDriverTracking(driverId: string, onLocationUpdate?: (location: DriverLocation) => void): boolean {
    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return false;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return false;
    }

    this.isTracking = true;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Timestamp.now()
          };

          const address = await this.getAddressFromCoordinates(
            coordinates.latitude,
            coordinates.longitude
          );

          const driverLocation: any = {
            driverId,
            coordinates,
            address,
            isActive: true,
            isOnline: true,
            lastUpdated: Timestamp.now()
          };

          if (position.coords.heading !== null && position.coords.heading !== undefined) {
            driverLocation.heading = position.coords.heading;
          }
          
          if (position.coords.speed !== null && position.coords.speed !== undefined) {
            driverLocation.speed = position.coords.speed * 3.6; // Convert m/s to km/h
          }

          await updateDoc(doc(db, 'drivers', driverId), {
            currentLocation: driverLocation,
            lastLocationUpdate: Timestamp.now(),
            isOnline: true
          });

          if (onLocationUpdate) {
            onLocationUpdate(driverLocation);
          }

        } catch (error) {
          console.error('Error updating driver location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.stopDriverTracking(driverId);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000 // 5 seconds
      }
    );

    return true;
  }

  // Stop driver location tracking
  static async stopDriverTracking(driverId: string): Promise<void> {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;

    try {
      // Update driver status to offline
      await updateDoc(doc(db, 'drivers', driverId), {
        isOnline: false,
        lastLocationUpdate: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating driver offline status:', error);
    }
  }

  // Subscribe to driver location updates
  static subscribeToDriverLocation(driverId: string, callback: (location: DriverLocation | null) => void) {
    return onSnapshot(doc(db, 'drivers', driverId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const location = data.currentLocation as DriverLocation | null;
        callback(location);
      } else {
        callback(null);
      }
    });
  }

  // Get nearby cooks within delivery radius
  static async getNearbyCooks(userLat: number, userLng: number, maxDistance: number = 10): Promise<any[]> {
    try {
      // This is a simplified version. For production, you'd want to use Firestore's geohash queries
      // or a service like Google Maps Places API for more efficient location-based queries
      
      const cooksSnapshot = await import('@/lib/firebase/dataService').then(module => 
        module.CooksService.getAllCooks()
      );

      const nearbyCooks = cooksSnapshot
        .filter(cook => {
          if (!cook.location?.coordinates) return false;
          
          const distance = this.calculateDistance(
            userLat,
            userLng,
            cook.location.coordinates.latitude,
            cook.location.coordinates.longitude
          );
          
          return distance <= maxDistance;
        })
        .map(cook => ({
          ...cook,
          distance: this.calculateDistance(
            userLat,
            userLng,
            cook.location.coordinates.latitude,
            cook.location.coordinates.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      return nearbyCooks;
    } catch (error) {
      console.error('Error getting nearby cooks:', error);
      return [];
    }
  }

  // Estimate delivery time based on distance
  static estimateDeliveryTime(distance: number): number {
    // Base time + travel time (assuming average speed of 25 km/h in city)
    const baseTime = 15; // 15 minutes base preparation time
    const travelTime = (distance / 25) * 60; // Convert hours to minutes
    
    return Math.ceil(baseTime + travelTime);
  }

  // Check if location permissions are granted
  static async checkLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  // Request location permission
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const position = await this.getCurrentPosition();
      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }
}
