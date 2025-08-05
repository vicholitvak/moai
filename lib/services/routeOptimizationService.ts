'use client';

import { Order } from '@/lib/firebase/dataService';

export interface RoutePoint {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  orderId: string;
  customerName: string;
  estimatedDeliveryTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
  orderValue: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number; // km
  totalTime: number; // minutes
  estimatedFuelCost: number;
  efficiency: number; // 0-100 score
}

export interface RouteOptimizationOptions {
  prioritizeHighValue: boolean;
  considerTraffic: boolean;
  maxDeliveryTime: number; // minutes
  fuelEfficiency: number; // km per liter
  fuelPrice: number; // price per liter
}

class RouteOptimizationService {
  private static readonly DEFAULT_OPTIONS: RouteOptimizationOptions = {
    prioritizeHighValue: true,
    considerTraffic: true,
    maxDeliveryTime: 120, // 2 hours
    fuelEfficiency: 12,
    fuelPrice: 1200 // CLP per liter
  };

  // Convert address to coordinates using geocoding
  private static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // In production, you would use Google Maps Geocoding API
      // For now, we'll simulate coordinates based on address hash
      const hash = this.hashAddress(address);
      const lat = -33.4489 + (hash % 100) * 0.001; // Santiago base coordinates
      const lng = -70.6693 + (hash % 100) * 0.001;
      
      return { lat, lng };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // Simple hash function for address simulation
  private static hashAddress(address: string): number {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Calculate distance between two points using Haversine formula
  private static calculateDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Optimize route using nearest neighbor with priority adjustments
  private static optimizeRouteOrder(
    points: RoutePoint[], 
    startLat: number, 
    startLng: number,
    options: RouteOptimizationOptions
  ): RoutePoint[] {
    if (points.length <= 1) return points;

    const optimized: RoutePoint[] = [];
    const remaining = [...points];
    let currentLat = startLat;
    let currentLng = startLng;

    // Sort by priority and value if enabled
    if (options.prioritizeHighValue) {
      remaining.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityScore = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityScore !== 0) return priorityScore;
        return b.orderValue - a.orderValue;
      });
    }

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Find nearest point considering priority
      remaining.forEach((point, index) => {
        if (!point.lat || !point.lng) return;
        
        const distance = this.calculateDistance(
          currentLat, currentLng, 
          point.lat, point.lng
        );

        // Apply priority multiplier to distance (lower is better for high priority)
        const priorityMultiplier = { high: 0.7, medium: 1.0, low: 1.3 };
        const adjustedDistance = distance * priorityMultiplier[point.priority];

        if (adjustedDistance < nearestDistance) {
          nearestDistance = adjustedDistance;
          nearestIndex = index;
        }
      });

      const nearestPoint = remaining[nearestIndex];
      optimized.push(nearestPoint);
      remaining.splice(nearestIndex, 1);
      
      if (nearestPoint.lat && nearestPoint.lng) {
        currentLat = nearestPoint.lat;
        currentLng = nearestPoint.lng;
      }
    }

    return optimized;
  }

  // Convert orders to route points
  static async convertOrdersToRoutePoints(orders: Order[]): Promise<RoutePoint[]> {
    const points: RoutePoint[] = [];

    for (const order of orders) {
      const coordinates = await this.geocodeAddress(order.deliveryInfo.address);
      
      const priority = this.calculateOrderPriority(order);
      
      points.push({
        id: `order-${order.id}`,
        address: order.deliveryInfo.address,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        orderId: order.id,
        customerName: order.customerName,
        estimatedDeliveryTime: this.estimateDeliveryTime(order),
        priority,
        orderValue: order.total
      });
    }

    return points;
  }

  // Calculate order priority based on various factors
  private static calculateOrderPriority(order: Order): 'high' | 'medium' | 'low' {
    const orderAge = Date.now() - order.createdAt.toDate().getTime();
    const ageInMinutes = orderAge / (1000 * 60);
    
    // High priority: expensive orders or orders waiting > 45 minutes
    if (order.total > 25000 || ageInMinutes > 45) {
      return 'high';
    }
    
    // Medium priority: moderate value or orders waiting > 20 minutes
    if (order.total > 15000 || ageInMinutes > 20) {
      return 'medium';
    }
    
    return 'low';
  }

  // Estimate delivery time for an order
  private static estimateDeliveryTime(order: Order): number {
    // Base time + prep time + delivery complexity
    const baseTime = 15; // minutes
    const dishCount = order.dishes.reduce((sum, dish) => sum + dish.quantity, 0);
    const complexityTime = dishCount * 2;
    
    return baseTime + complexityTime;
  }

  // Main route optimization function
  static async optimizeRoute(
    orders: Order[],
    driverLocation: { lat: number; lng: number },
    options: Partial<RouteOptimizationOptions> = {}
  ): Promise<OptimizedRoute> {
    const fullOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Convert orders to route points
    const points = await this.convertOrdersToRoutePoints(orders);
    
    // Optimize the route
    const optimizedPoints = this.optimizeRouteOrder(
      points, 
      driverLocation.lat, 
      driverLocation.lng,
      fullOptions
    );

    // Calculate route metrics
    const { totalDistance, totalTime } = this.calculateRouteMetrics(
      optimizedPoints, 
      driverLocation
    );

    const estimatedFuelCost = (totalDistance / fullOptions.fuelEfficiency) * fullOptions.fuelPrice;
    const efficiency = this.calculateRouteEfficiency(optimizedPoints, totalDistance, totalTime);

    return {
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: Math.round(totalTime),
      estimatedFuelCost: Math.round(estimatedFuelCost),
      efficiency: Math.round(efficiency)
    };
  }

  // Calculate total distance and time for route
  private static calculateRouteMetrics(
    points: RoutePoint[],
    startLocation: { lat: number; lng: number }
  ): { totalDistance: number; totalTime: number } {
    if (points.length === 0) return { totalDistance: 0, totalTime: 0 };

    let totalDistance = 0;
    let totalTime = 0;
    let currentLat = startLocation.lat;
    let currentLng = startLocation.lng;

    for (const point of points) {
      if (point.lat && point.lng) {
        const distance = this.calculateDistance(currentLat, currentLng, point.lat, point.lng);
        totalDistance += distance;
        
        // Estimate travel time (assuming 30 km/h average in city)
        const travelTime = (distance / 30) * 60; // minutes
        totalTime += travelTime + point.estimatedDeliveryTime;
        
        currentLat = point.lat;
        currentLng = point.lng;
      }
    }

    return { totalDistance, totalTime };
  }

  // Calculate route efficiency score
  private static calculateRouteEfficiency(
    points: RoutePoint[],
    totalDistance: number,
    totalTime: number
  ): number {
    if (points.length === 0) return 100;

    // Efficiency based on distance per delivery and high-priority orders first
    const avgDistancePerDelivery = totalDistance / points.length;
    const highPriorityFirst = points.findIndex(p => p.priority === 'high') / points.length;
    
    let score = 100;
    
    // Penalize long distances per delivery
    if (avgDistancePerDelivery > 5) score -= 20;
    else if (avgDistancePerDelivery > 3) score -= 10;
    
    // Penalize if high priority orders are not early in route
    if (highPriorityFirst > 0.3) score -= 15;
    
    // Penalize very long total routes
    if (totalTime > 120) score -= 25;
    else if (totalTime > 90) score -= 15;
    
    return Math.max(0, score);
  }

  // Generate Google Maps URL for navigation
  static generateNavigationUrl(points: RoutePoint[], includeWaypoints: boolean = true): string {
    if (points.length === 0) return '';
    
    const origin = 'current+location';
    const destination = encodeURIComponent(points[points.length - 1].address);
    
    let url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    if (includeWaypoints && points.length > 2) {
      const waypoints = points.slice(0, -1)
        .map(point => encodeURIComponent(point.address))
        .join('/');
      url = `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`;
    }
    
    return url;
  }

  // Get estimated arrival times for each delivery
  static getEstimatedArrivalTimes(optimizedRoute: OptimizedRoute): Map<string, Date> {
    const arrivalTimes = new Map<string, Date>();
    const now = new Date();
    let cumulativeTime = 0;

    for (const point of optimizedRoute.points) {
      cumulativeTime += 15; // Travel time between points (estimated)
      const arrivalTime = new Date(now.getTime() + cumulativeTime * 60000);
      arrivalTimes.set(point.orderId, arrivalTime);
      cumulativeTime += point.estimatedDeliveryTime;
    }

    return arrivalTimes;
  }
}

export default RouteOptimizationService;