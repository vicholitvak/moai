import { db } from '@/lib/firebase/client';
import { doc, setDoc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';

export interface DeliveryTracking {
  orderId: string;
  driverId: string;
  driverName: string;
  currentLocation: {
    lat: number;
    lng: number;
    timestamp: Timestamp;
  };
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  totalEstimatedTime: string;
  currentStep: 'heading_to_pickup' | 'at_pickup' | 'heading_to_delivery' | 'delivered';
  lastUpdated: Timestamp;
}

export class DeliveryTrackingService {
  private static collection = 'deliveryTracking';

  // Update driver location and ETA
  static async updateDeliveryTracking(data: Omit<DeliveryTracking, 'lastUpdated'>): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, data.orderId);
      await setDoc(docRef, {
        ...data,
        lastUpdated: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating delivery tracking:', error);
      return false;
    }
  }

  // Subscribe to delivery tracking updates
  static subscribeToDeliveryTracking(orderId: string, callback: (tracking: DeliveryTracking | null) => void) {
    const docRef = doc(db, this.collection, orderId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          orderId: doc.id,
          ...doc.data()
        } as DeliveryTracking);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to delivery tracking:', error);
      callback(null);
    });
  }

  // Update only location
  static async updateDriverLocation(orderId: string, location: { lat: number; lng: number }): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      await updateDoc(docRef, {
        currentLocation: {
          ...location,
          timestamp: Timestamp.now()
        },
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    }
  }

  // Update ETA only
  static async updateETA(
    orderId: string, 
    eta: { 
      pickup?: string; 
      delivery?: string; 
      total?: string; 
    }
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      const updates: any = {
        lastUpdated: Timestamp.now()
      };

      if (eta.pickup) updates.estimatedPickupTime = eta.pickup;
      if (eta.delivery) updates.estimatedDeliveryTime = eta.delivery;
      if (eta.total) updates.totalEstimatedTime = eta.total;

      await updateDoc(docRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating ETA:', error);
      return false;
    }
  }

  // Update delivery step
  static async updateDeliveryStep(
    orderId: string, 
    step: DeliveryTracking['currentStep']
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      await updateDoc(docRef, {
        currentStep: step,
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating delivery step:', error);
      return false;
    }
  }

  // Clean up tracking data after delivery is completed
  static async completeDelivery(orderId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      await updateDoc(docRef, {
        currentStep: 'delivered',
        lastUpdated: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error completing delivery:', error);
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
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 30000 // Cache for 30 seconds
        }
      );
    });
  }

  // Calculate distance between two points (in km)
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Start location tracking for active delivery
  static startLocationTracking(
    orderId: string,
    driverId: string,
    driverName: string,
    onLocationUpdate?: (location: { lat: number; lng: number }) => void
  ): { stop: () => void } {
    let watchId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 10000; // Update every 10 seconds

    const updateLocation = async () => {
      try {
        const location = await this.getCurrentLocation();
        const currentTime = Date.now();

        // Throttle updates to avoid excessive Firebase writes
        if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
          await this.updateDriverLocation(orderId, location);
          lastUpdateTime = currentTime;
        }

        onLocationUpdate?.(location);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    // Start watching position
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        () => updateLocation(),
        (error) => console.error('Geolocation error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    }

    // Initial location update
    updateLocation();

    // Return stop function
    return {
      stop: () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      }
    };
  }
}