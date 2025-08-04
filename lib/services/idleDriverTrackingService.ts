import { db } from '@/lib/firebase/client';
import { doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { DriversService } from '@/lib/firebase/dataService';

export interface IdleDriverLocation {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  };
  isOnline: boolean;
  isAvailable: boolean;
  speed?: number;
  heading?: number;
  lastUpdated: Timestamp;
}

export class IdleDriverTrackingService {
  private static activeTracking = new Map<string, { watchId: number; stop: () => void }>();
  private static UPDATE_INTERVAL = 30000; // Update every 30 seconds for idle drivers
  private static lastUpdateTimes = new Map<string, number>();

  // Start tracking idle driver when they go online
  static startIdleTracking(driverId: string, driverName: string): { stop: () => void } {
    // Stop any existing tracking for this driver
    this.stopIdleTracking(driverId);

    let watchId: number | null = null;
    let isTracking = true;

    const updateIdleLocation = async () => {
      if (!isTracking) return;

      try {
        const location = await this.getCurrentLocation();
        const currentTime = Date.now();
        const lastUpdate = this.lastUpdateTimes.get(driverId) || 0;

        // Throttle updates for idle drivers (less frequent than active deliveries)
        if (currentTime - lastUpdate > this.UPDATE_INTERVAL) {
          await this.updateDriverIdleLocation(driverId, location);
          this.lastUpdateTimes.set(driverId, currentTime);
        }
      } catch (error) {
        console.error('Error updating idle driver location:', error);
      }
    };

    // Start watching position for idle driver
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        () => updateIdleLocation(),
        (error) => console.error('Idle geolocation error:', error),
        {
          enableHighAccuracy: false, // Less accuracy for idle to save battery
          timeout: 15000,
          maximumAge: 60000 // Cache for 1 minute for idle drivers
        }
      );
    }

    // Initial location update
    updateIdleLocation();

    const stopFunction = () => {
      isTracking = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      this.activeTracking.delete(driverId);
      this.lastUpdateTimes.delete(driverId);
    };

    this.activeTracking.set(driverId, { watchId: watchId || 0, stop: stopFunction });

    return { stop: stopFunction };
  }

  // Stop idle tracking for a driver
  static stopIdleTracking(driverId: string): void {
    const tracking = this.activeTracking.get(driverId);
    if (tracking) {
      tracking.stop();
    }
  }

  // Update driver's idle/available location in their driver profile
  static async updateDriverIdleLocation(
    driverId: string, 
    location: { lat: number; lng: number },
    additionalData?: { speed?: number; heading?: number }
  ): Promise<boolean> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      
      await updateDoc(driverRef, {
        'currentLocation.coordinates': {
          latitude: location.lat,
          longitude: location.lng,
          timestamp: Timestamp.now()
        },
        'currentLocation.lastUpdated': Timestamp.now(),
        lastLocationUpdate: Timestamp.now(),
        ...(additionalData?.speed && { 'currentLocation.speed': additionalData.speed }),
        ...(additionalData?.heading && { 'currentLocation.heading': additionalData.heading })
      });

      return true;
    } catch (error) {
      console.error('Error updating idle driver location:', error);
      return false;
    }
  }

  // Get current location using browser geolocation
  static getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { 
          enableHighAccuracy: false, // Less accuracy for idle tracking
          timeout: 15000, 
          maximumAge: 60000 // Cache for 1 minute
        }
      );
    });
  }

  // Subscribe to driver status changes to start/stop tracking
  static subscribeToDriverStatus(
    driverId: string,
    onStatusChange: (isOnline: boolean, isAvailable: boolean) => void
  ) {
    const driverRef = doc(db, 'drivers', driverId);
    
    return onSnapshot(driverRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const isOnline = data.isOnline || false;
        const isAvailable = data.isAvailable || false;
        
        onStatusChange(isOnline, isAvailable);
        
        // Auto-start/stop idle tracking based on status
        if (isOnline && isAvailable) {
          // Driver is online and available, start idle tracking
          this.startIdleTracking(driverId, data.displayName || 'Driver');
        } else {
          // Driver is offline or busy, stop idle tracking
          this.stopIdleTracking(driverId);
        }
      }
    }, (error) => {
      console.error('Error subscribing to driver status:', error);
    });
  }

  // Get all active idle trackings (for debugging)
  static getActiveTrackings(): string[] {
    return Array.from(this.activeTracking.keys());
  }

  // Stop all idle trackings (cleanup function)
  static stopAllIdleTracking(): void {
    this.activeTracking.forEach((tracking) => {
      tracking.stop();
    });
    this.activeTracking.clear();
    this.lastUpdateTimes.clear();
  }
}