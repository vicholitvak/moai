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

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: Coordinates[];
  center: Coordinates;
  radius: number; // in meters
  deliveryFee: number;
  isActive: boolean;
  maxDeliveryTime: number; // in minutes
  priority: number; // for overlapping zones
  description?: string;
  operatingHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface DeliveryFeeCalculation {
  baseFee: number;
  distanceFee: number;
  zoneFee: number;
  totalFee: number;
  distance: number;
  estimatedTime: number;
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
  static async getAddressFromCoordinates(lat: number, lng: number): Promise<Address & { coordinates: { latitude: number; longitude: number; accuracy?: number; source: 'geocoded'; placeId?: string; formattedAddress?: string } }> {
    // Check if OpenCage API key is available
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENCAGE_API_KEY') {
      // Try to match with Chilean cities first
      const { ChileanCitiesService } = await import('./chileanCitiesService');
      const nearbyCities = ChileanCitiesService.getNearbyCities(lat, lng, 10);

      if (nearbyCities.length > 0) {
        const closestCity = nearbyCities[0];
        return {
          street: 'Dirección no disponible',
          city: closestCity.name,
          state: closestCity.region,
          zipCode: '',
          country: 'Chile',
          fullAddress: `${closestCity.name}, ${closestCity.region}, Chile`,
          coordinates: {
            latitude: lat,
            longitude: lng,
            source: 'geocoded'
          }
        };
      }

      // Fallback address for Santiago, Chile
      return {
        street: 'Dirección no disponible',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '',
        country: 'Chile',
        fullAddress: 'Santiago, Región Metropolitana, Chile',
        coordinates: {
          latitude: lat,
          longitude: lng,
          source: 'geocoded'
        }
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
          fullAddress: result.formatted,
          coordinates: {
            latitude: lat,
            longitude: lng,
            accuracy: components.confidence || undefined,
            placeId: result.place_id,
            formattedAddress: result.formatted,
            source: 'geocoded'
          }
        };
      } else {
        // Try Chilean cities fallback
        const { ChileanCitiesService } = await import('./chileanCitiesService');
        const nearbyCities = ChileanCitiesService.getNearbyCities(lat, lng, 10);

        if (nearbyCities.length > 0) {
          const closestCity = nearbyCities[0];
        return {
            street: 'Dirección no disponible',
            city: closestCity.name,
            state: closestCity.region,
            zipCode: '',
            country: 'Chile',
          fullAddress: `${closestCity.name}, ${closestCity.region}, Chile`,
          coordinates: {
            latitude: lat,
            longitude: lng,
            source: 'geocoded'
          }
          };
        }

        // Final fallback
        return {
          street: 'Dirección no disponible',
          city: 'Santiago',
          state: 'Región Metropolitana',
          zipCode: '',
          country: 'Chile',
        fullAddress: 'Santiago, Región Metropolitana, Chile',
        coordinates: {
          latitude: lat,
          longitude: lng,
          source: 'geocoded'
        }
        };
      }
    } catch (error) {
      // Try Chilean cities fallback
      const { ChileanCitiesService } = await import('./chileanCitiesService');
      const nearbyCities = ChileanCitiesService.getNearbyCities(lat, lng, 10);

      if (nearbyCities.length > 0) {
        const closestCity = nearbyCities[0];
        return {
          street: 'Dirección no disponible',
          city: closestCity.name,
          state: closestCity.region,
          zipCode: '',
          country: 'Chile',
          fullAddress: `${closestCity.name}, ${closestCity.region}, Chile`,
          coordinates: {
            latitude: lat,
            longitude: lng,
            source: 'geocoded'
          }
        };
      }

      // Only log unexpected errors, not expected fallback scenarios
      if (error instanceof Error && !error.message.includes('Geocoding service unavailable')) {
        console.error('Unexpected error getting address:', error);
      }
      // Return fallback Santiago address
      return {
        street: 'Dirección no disponible',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '',
        country: 'Chile',
        fullAddress: 'Santiago, Región Metropolitana, Chile'
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

  // ==================== NEW: DELIVERY ZONE MANAGEMENT ====================

  // Get default delivery zones for Santiago
  static getDefaultDeliveryZones(): DeliveryZone[] {
    return [
      {
        id: 'zone-centro',
        name: 'Centro de Santiago',
        coordinates: [],
        center: { latitude: -33.4489, longitude: -70.6693, timestamp: Timestamp.now() },
        radius: 5000,
        deliveryFee: 2000,
        isActive: true,
        maxDeliveryTime: 45,
        priority: 1,
        description: 'Centro histórico y comercial de Santiago',
        operatingHours: { start: '08:00', end: '22:00' }
      },
      {
        id: 'zone-providencia',
        name: 'Providencia',
        coordinates: [],
        center: { latitude: -33.4242, longitude: -70.6118, timestamp: Timestamp.now() },
        radius: 3000,
        deliveryFee: 2500,
        isActive: true,
        maxDeliveryTime: 35,
        priority: 2,
        description: 'Zona residencial y comercial',
        operatingHours: { start: '09:00', end: '23:00' }
      },
      {
        id: 'zone-las-condes',
        name: 'Las Condes',
        coordinates: [],
        center: { latitude: -33.4172, longitude: -70.5476, timestamp: Timestamp.now() },
        radius: 4000,
        deliveryFee: 3000,
        isActive: true,
        maxDeliveryTime: 50,
        priority: 3,
        description: 'Distrito financiero y residencial',
        operatingHours: { start: '10:00', end: '22:00' }
      },
      {
        id: 'zone-nunoa',
        name: 'Ñuñoa',
        coordinates: [],
        center: { latitude: -33.4569, longitude: -70.5956, timestamp: Timestamp.now() },
        radius: 3500,
        deliveryFee: 2300,
        isActive: true,
        maxDeliveryTime: 40,
        priority: 4,
        description: 'Comuna universitaria y residencial',
        operatingHours: { start: '08:30', end: '22:30' }
      }
    ];
  }

  // Check if coordinates are within a delivery zone
  static isWithinDeliveryZone(coordinates: Coordinates, zone: DeliveryZone): boolean {
    const distance = this.calculateDistance(
      coordinates.latitude,
      coordinates.longitude,
      zone.center.latitude,
      zone.center.longitude
    ) * 1000; // Convert km to meters

    return distance <= zone.radius;
  }

  // Find the best delivery zone for given coordinates
  static findDeliveryZone(coordinates: Coordinates, zones: DeliveryZone[]): DeliveryZone | null {
    const validZones = zones
      .filter(zone => zone.isActive && this.isWithinDeliveryZone(coordinates, zone))
      .sort((a, b) => a.priority - b.priority);

    return validZones.length > 0 ? validZones[0] : null;
  }

  // Check if point is inside polygon (for complex delivery zones)
  static isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].latitude > point.latitude) !== (polygon[j].latitude > point.latitude)) &&
          (point.longitude < (polygon[j].longitude - polygon[i].longitude) *
           (point.latitude - polygon[i].latitude) / (polygon[j].latitude - polygon[i].latitude) + polygon[i].longitude)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // ==================== NEW: DISTANCE-BASED FEE CALCULATION ====================

  // Calculate estimated delivery time based on distance
  static calculateDeliveryTime(distance: number): number {
    // Base time: 15 minutes preparation + 5 minutes per km
    const prepTime = 15;
    const travelTime = Math.ceil(distance * 5);
    return prepTime + travelTime;
  }

  // Calculate comprehensive delivery fee
  static calculateDeliveryFee(
    customerCoords: Coordinates,
    cookCoords: Coordinates,
    zones: DeliveryZone[] = this.getDefaultDeliveryZones()
  ): DeliveryFeeCalculation {
    const distance = this.calculateDistance(
      customerCoords.latitude,
      customerCoords.longitude,
      cookCoords.latitude,
      cookCoords.longitude
    );

    // Find applicable delivery zone
    const zone = this.findDeliveryZone(customerCoords, zones);

    // Base fee configuration
    const baseFee = 1500; // CLP
    const freeDeliveryThreshold = 3; // km

    // Calculate distance-based fee
    let distanceFee = 0;
    if (distance > freeDeliveryThreshold) {
      const extraKm = distance - freeDeliveryThreshold;
      distanceFee = Math.ceil(extraKm) * 800; // 800 CLP per extra km
    }

    // Zone-specific fee
    const zoneFee = zone ? zone.deliveryFee : 2500; // Default zone fee

    // Calculate total
    const totalFee = baseFee + distanceFee + zoneFee;

    // Estimate delivery time
    const estimatedTime = this.estimateAdvancedDeliveryTime(distance, zone);

    return {
      baseFee,
      distanceFee,
      zoneFee,
      totalFee,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      estimatedTime
    };
  }

  // Advanced delivery time estimation
  static estimateAdvancedDeliveryTime(distance: number, zone?: DeliveryZone | null): number {
    // Base preparation time
    let baseTime = 20; // minutes

    // Zone-specific adjustments
    if (zone) {
      baseTime = Math.min(baseTime, zone.maxDeliveryTime - 15);
    }

    // Travel time calculation (considering Santiago traffic)
    const avgSpeed = 22; // km/h average in Santiago
    const travelTime = (distance / avgSpeed) * 60; // Convert to minutes

    // Traffic multiplier based on time of day
    const now = new Date();
    const hour = now.getHours();
    let trafficMultiplier = 1.0;

    if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20)) {
      trafficMultiplier = 1.5; // Rush hour
    } else if (hour >= 12 && hour <= 14) {
      trafficMultiplier = 1.2; // Lunch time
    }

    const adjustedTravelTime = travelTime * trafficMultiplier;
    const totalTime = baseTime + adjustedTravelTime;

    return Math.max(15, Math.ceil(totalTime)); // Minimum 15 minutes
  }

  // ==================== NEW: GEOFENCING FOR DELIVERY AREAS ====================

  // Check if delivery is allowed to specific coordinates
  static isDeliveryAllowed(coordinates: Coordinates, zones: DeliveryZone[] = this.getDefaultDeliveryZones()): boolean {
    return zones.some(zone => zone.isActive && this.isWithinDeliveryZone(coordinates, zone));
  }

  // Get delivery restrictions for coordinates
  static getDeliveryRestrictions(coordinates: Coordinates, zones: DeliveryZone[] = this.getDefaultDeliveryZones()): {
    allowed: boolean;
    zone?: DeliveryZone;
    reason?: string;
    nearestZone?: { zone: DeliveryZone; distance: number };
  } {
    const applicableZone = this.findDeliveryZone(coordinates, zones);

    if (applicableZone) {
      return {
        allowed: true,
        zone: applicableZone
      };
    }

    // Find nearest zone
    const nearestZone = zones
      .filter(zone => zone.isActive)
      .map(zone => ({
        zone,
        distance: this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          zone.center.latitude,
          zone.center.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    return {
      allowed: false,
      reason: 'Esta dirección está fuera de nuestras zonas de entrega',
      nearestZone
    };
  }

  // ==================== NEW: ENHANCED LOCATION-BASED DISCOVERY ====================

  // Get dishes available for delivery to specific coordinates
  static async getDishesForLocation(coordinates: Coordinates, maxDistance: number = 10): Promise<any[]> {
    try {
      // Check if delivery is allowed
      const restrictions = this.getDeliveryRestrictions(coordinates);
      if (!restrictions.allowed) {
        return [];
      }

      // Get nearby cooks
      const nearbyCooks = await this.getNearbyCooks(
        coordinates.latitude,
        coordinates.longitude,
        maxDistance
      );

      // Get dishes from nearby cooks
      const { DishesService } = await import('@/lib/firebase/dataService');
      const allDishes = await DishesService.getAllDishes();

      const availableDishes = allDishes
        .filter(dish => {
          // Filter by cook proximity
          const cook = nearbyCooks.find(c => c.id === dish.cookerId);
          return cook && dish.isAvailable;
        })
        .map(dish => {
          const cook = nearbyCooks.find(c => c.id === dish.cookerId);
          const deliveryFee = this.calculateDeliveryFee(
            coordinates,
            cook.location.coordinates
          );

          return {
            ...dish,
            cookDistance: cook.distance,
            deliveryFee: deliveryFee.totalFee,
            estimatedDeliveryTime: deliveryFee.estimatedTime,
            cookLocation: cook.location
          };
        })
        .sort((a, b) => a.cookDistance - b.cookDistance);

      return availableDishes;
    } catch (error) {
      console.error('Error getting dishes for location:', error);
      return [];
    }
  }

  // Get dishes for a specific Chilean city
  static async getDishesForChileanCity(cityId: string): Promise<any[]> {
    try {
      const { ChileanCitiesService } = await import('./chileanCitiesService');
      const city = ChileanCitiesService.getCityById(cityId);

      if (!city) {
        console.warn(`City ${cityId} not found`);
        return [];
      }

      // Check if city is operating
      if (!ChileanCitiesService.isCityOperating(cityId)) {
        return [];
      }

      // Get nearby cooks within the city's delivery radius
      const nearbyCooks = await this.getNearbyCooks(
        city.coordinates.latitude,
        city.coordinates.longitude,
        city.maxDeliveryRadius
      );

      // Get dishes from nearby cooks
      const { DishesService } = await import('@/lib/firebase/dataService');
      const allDishes = await DishesService.getAllDishes();

      const availableDishes = allDishes
        .filter(dish => {
          // Filter by cook proximity and availability
          const cook = nearbyCooks.find(c => c.id === dish.cookerId);
          return cook && dish.isAvailable;
        })
        .map(dish => {
          const cook = nearbyCooks.find(c => c.id === dish.cookerId);
          const deliveryFee = ChileanCitiesService.getDeliveryFeeForCity(cityId);

          return {
            ...dish,
            cityId,
            cityName: city.name,
            region: city.region,
            cookDistance: cook.distance,
            deliveryFee,
            estimatedDeliveryTime: this.calculateDeliveryTime(cook.distance),
            cookLocation: cook.location,
            localSpecialties: ChileanCitiesService.getLocalSpecialtiesForCity(cityId),
            popularDishes: ChileanCitiesService.getPopularDishesForCity(cityId)
          };
        })
        .sort((a, b) => a.cookDistance - b.cookDistance);

      return availableDishes;
    } catch (error) {
      console.error('Error getting dishes for Chilean city:', error);
      return [];
    }
  }

  // Get dishes for user's current location with Chilean city detection
  static async getDishesForCurrentLocation(): Promise<any[]> {
    try {
      const coordinates = await this.getCurrentPosition();
      const address = await this.getAddressFromCoordinates(
        coordinates.latitude,
        coordinates.longitude
      );

      // Try to match with Chilean cities
      const { ChileanCitiesService } = await import('./chileanCitiesService');
      const nearbyCities = ChileanCitiesService.getNearbyCities(
        coordinates.latitude,
        coordinates.longitude,
        50 // 50km radius
      );

      if (nearbyCities.length > 0) {
        // Use the closest city
        const closestCity = nearbyCities[0];
        return await this.getDishesForChileanCity(closestCity.id);
      } else {
        // Fallback to coordinate-based search
        return await this.getDishesForLocation(coordinates, 15);
      }
    } catch (error) {
      console.error('Error getting dishes for current location:', error);
      return [];
    }
  }

  // Get available Chilean cities for user selection
  static async getAvailableChileanCities(): Promise<any[]> {
    try {
      const { ChileanCitiesService } = await import('./chileanCitiesService');

      return ChileanCitiesService.getActiveCities().map(city => ({
        id: city.id,
        name: city.name,
        region: city.region,
        coordinates: city.coordinates,
        deliveryFee: city.deliveryFee,
        isOperating: ChileanCitiesService.isCityOperating(city.id),
        operatingHours: ChileanCitiesService.getOperatingHoursForCity(city.id),
        popularDishes: city.popularDishes,
        localSpecialties: city.localSpecialties
      }));
    } catch (error) {
      console.error('Error getting available Chilean cities:', error);
      return [];
    }
  }

  // ==================== NEW: UTILITY METHODS ====================

  // Format delivery fee for display
  static formatDeliveryFee(fee: number): string {
    return `$${fee.toLocaleString('es-CL')} CLP`;
  }

  // Format distance for display
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  }

  // Get delivery zone by ID
  static getDeliveryZoneById(zoneId: string, zones: DeliveryZone[] = this.getDefaultDeliveryZones()): DeliveryZone | null {
    return zones.find(zone => zone.id === zoneId) || null;
  }

  // Check if zone is currently operating
  static isZoneOperating(zone: DeliveryZone): boolean {
    if (!zone.operatingHours) return true;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= zone.operatingHours.start && currentTime <= zone.operatingHours.end;
  }

  // Get all active zones for current time
  static getActiveZones(zones: DeliveryZone[] = this.getDefaultDeliveryZones()): DeliveryZone[] {
    return zones.filter(zone => zone.isActive && this.isZoneOperating(zone));
  }
}
