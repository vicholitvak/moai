import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './client';

// Types for our data structures
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  cookerId: string;
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  prepTime: string;
  isAvailable: boolean;
  ingredients: string[];
  allergens: string[];
  nutritionInfo: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Cook {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  coverImage: string;
  bio: string;
  story: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp: Timestamp;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      fullAddress: string;
    };
    isActive: boolean;
    lastUpdated: Timestamp;
  };
  deliveryRadius: number;
  rating: number;
  reviewCount: number;
  totalOrders: number;
  yearsExperience: number;
  joinedDate: string;
  specialties: string[];
  certifications: string[];
  languages: string[];
  cookingStyle: string;
  favoriteIngredients: string[];
  achievements: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  settings: {
    autoAcceptOrders: boolean;
    maxOrdersPerDay: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
    currency: string;
    timezone: string;
    language: string;
    lastLocationUpdate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  cookerId: string;
  driverId?: string;
  dishes: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: number;
    prepTime?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryInfo: {
    address: string;
    phone: string;
    instructions?: string;
  };
  deliveryCode: string;
  isDelivered: boolean;
  orderTime?: Timestamp;
  estimatedDeliveryTime?: Timestamp;
  actualDeliveryTime?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Driver {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  phone: string;
  vehicleType: 'bike' | 'motorcycle' | 'car';
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  };
  currentLocation?: {
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp: Timestamp;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      fullAddress: string;
    };
    isActive: boolean;
    lastUpdated: Timestamp;
    heading?: number;
    speed?: number;
  };
  isOnline: boolean;
  isAvailable: boolean;
  currentOrderId?: string;
  rating: number;
  reviewCount: number;
  totalDeliveries: number;
  completionRate: number;
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  lastLocationUpdate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  cookerId: string;
  dishId?: string;
  dishName?: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Timestamp;
}

// Dishes Service
export class DishesService {
  private static collection = 'dishes';

  static async getAllDishes(): Promise<Dish[]> {
    try {
      // Try with orderBy first (requires index)
      const querySnapshot = await getDocs(
        query(collection(db, this.collection), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));
    } catch (error) {
      console.error('Error fetching dishes with orderBy, trying fallback:', error);
      // Fallback: fetch all dishes without orderBy and sort client-side
      return this.getAllDishesFallback();
    }
  }

  // Fallback method for dishes created before indexes
  static async getAllDishesFallback(): Promise<Dish[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collection));
      const dishes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));
      
      // Sort client-side by createdAt descending
      return dishes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching dishes (fallback):', error);
      return [];
    }
  }

  static async getDishesByCategory(category: string): Promise<Dish[]> {
    try {
      // Try with composite index first
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('category', '==', category),
          where('isAvailable', '==', true),
          orderBy('rating', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));
    } catch (error) {
      console.error('Error fetching dishes by category with index, trying fallback:', error);
      // Fallback: fetch all dishes and filter client-side
      return this.getDishesByCategoryFallback(category);
    }
  }

  // Fallback method for category filtering
  static async getDishesByCategoryFallback(category: string): Promise<Dish[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collection));
      const dishes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));
      
      // Filter and sort client-side
      return dishes
        .filter(dish => dish.category === category && dish.isAvailable)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error fetching dishes by category (fallback):', error);
      return [];
    }
  }

  static async getDishesByCook(cookerId: string): Promise<Dish[]> {
    try {
      // Try with composite index first (cookerId + createdAt)
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('cookerId', '==', cookerId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));
    } catch (error) {
      console.warn('Database index is building, using temporary fallback method...');
      // Fallback: fetch all dishes and filter client-side while index builds
      return this.getDishesByCookFallback(cookerId);
    }
  }

  // Fallback method for cook dishes filtering (used while index is building)
  static async getDishesByCookFallback(cookerId: string): Promise<Dish[]> {
    try {
      // Try simple where query first (no orderBy to avoid index requirement)
      try {
        const simpleQuerySnapshot = await getDocs(
          query(
            collection(db, this.collection),
            where('cookerId', '==', cookerId)
          )
        );
        const dishes = simpleQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Dish));
        
        // Sort client-side
        return dishes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
      } catch (simpleError) {
        // If simple where query fails, fall back to full collection scan
        console.warn('Simple query failed, using full collection scan...');
        const querySnapshot = await getDocs(collection(db, this.collection));
        const dishes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Dish));
        
        // Filter and sort client-side
        return dishes
          .filter(dish => dish.cookerId === cookerId)
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
          });
      }
    } catch (error) {
      console.error('Error fetching dishes by cook (fallback):', error);
      return [];
    }
  }

  static async getDishById(dishId: string): Promise<Dish | null> {
    try {
      const docRef = doc(db, this.collection, dishId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Dish;
      }
      return null;
    } catch (error) {
      console.error('Error fetching dish:', error);
      return null;
    }
  }

  static async createDish(dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.collection), {
        ...dishData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating dish:', error);
      return null;
    }
  }

  static async updateDish(dishId: string, updates: Partial<Dish>): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, dishId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating dish:', error);
      return false;
    }
  }

  static async deleteDish(dishId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.collection, dishId));
      return true;
    } catch (error) {
      console.error('Error deleting dish:', error);
      return false;
    }
  }

  static async searchDishes(searchTerm: string): Promise<Dish[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // For production, consider using Algolia or similar service
      const querySnapshot = await getDocs(collection(db, this.collection));
      const dishes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dish));

      // Client-side filtering for now
      return dishes.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dish.cookerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching dishes:', error);
      return [];
    }
  }
}

// Cooks Service
export class CooksService {
  private static collection = 'cooks';

  static async getAllCooks(): Promise<Cook[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.collection), orderBy('rating', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Cook));
    } catch (error) {
      console.error('Error fetching cooks:', error);
      return [];
    }
  }

  static async getCookById(cookId: string): Promise<Cook | null> {
    try {
      const docRef = doc(db, this.collection, cookId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Cook;
      }
      return null;
    } catch (error) {
      console.error('Error fetching cook:', error);
      return null;
    }
  }

  static async updateCookProfile(cookId: string, updates: Partial<Cook>): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, cookId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating cook profile:', error);
      return false;
    }
  }

  static async createCookProfile(cookData: Omit<Cook, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.collection), {
        ...cookData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating cook profile:', error);
      return null;
    }
  }
}

// Orders Service
export class OrdersService {
  private static collection = 'orders';

  static async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('customerId', '==', customerId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  }

  static async getOrdersByCook(cookerId: string): Promise<Order[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('cookerId', '==', cookerId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching cook orders:', error);
      return [];
    }
  }

  static async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.collection), {
        ...orderData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
        ...(status === 'delivered' && { actualDeliveryTime: Timestamp.now() })
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  static async verifyDeliveryCode(orderId: string, enteredCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const docRef = doc(db, this.collection, orderId);
      const orderDoc = await getDoc(docRef);
      
      if (!orderDoc.exists()) {
        return { success: false, message: 'Pedido no encontrado' };
      }
      
      const order = orderDoc.data() as Order;
      
      if (order.isDelivered) {
        return { success: false, message: 'Este pedido ya fue entregado' };
      }
      
      if (order.status !== 'delivering') {
        return { success: false, message: 'Este pedido no está en estado de entrega' };
      }
      
      if (order.deliveryCode !== enteredCode) {
        return { success: false, message: 'Código de entrega incorrecto' };
      }
      
      // Code is correct - mark as delivered
      await updateDoc(docRef, {
        status: 'delivered',
        isDelivered: true,
        actualDeliveryTime: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return { success: true, message: 'Pedido entregado exitosamente' };
      
    } catch (error) {
      console.error('Error verifying delivery code:', error);
      return { success: false, message: 'Error al verificar el código' };
    }
  }

  static async getOrderByDeliveryCode(deliveryCode: string): Promise<Order | null> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('deliveryCode', '==', deliveryCode),
          where('status', '==', 'delivering'),
          where('isDelivered', '==', false)
        )
      );
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const orderDoc = querySnapshot.docs[0];
      return {
        id: orderDoc.id,
        ...orderDoc.data()
      } as Order;
      
    } catch (error) {
      console.error('Error finding order by delivery code:', error);
      return null;
    }
  }

  static async getAvailableOrdersForDelivery(): Promise<Order[]> {
    try {
      // Get orders that are ready for delivery (accepted, preparing, or ready status)
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('status', 'in', ['accepted', 'preparing', 'ready']),
          orderBy('createdAt', 'asc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      
    } catch (error) {
      console.error('Error fetching available orders:', error);
      return [];
    }
  }

  static async assignOrderToDriver(orderId: string, driverId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collection, orderId);
      await updateDoc(docRef, {
        driverId: driverId,
        status: 'delivering',
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error assigning order to driver:', error);
      return false;
    }
  }

  static subscribeToAvailableOrders(callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, this.collection),
      where('status', 'in', ['accepted', 'preparing', 'ready']),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      callback(orders);
    });
  }

  static subscribeToOrderUpdates(cookerId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, this.collection),
      where('cookerId', '==', cookerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      callback(orders);
    });
  }

  static subscribeToDriverAvailableOrders(callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, this.collection),
      where('status', 'in', ['pending', 'accepted', 'preparing', 'ready']),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      callback(orders);
    });
  }
}

// Reviews Service
export class ReviewsService {
  private static collection = 'reviews';

  static async getReviewsByCook(cookerId: string): Promise<Review[]> {
    try {
      // Try with composite index first
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('cookerId', '==', cookerId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
    } catch (error) {
      console.error('Error fetching reviews with index, trying fallback:', error);
      // Fallback: fetch all reviews and filter client-side
      return this.getReviewsByCookFallback(cookerId);
    }
  }

  // Fallback method for reviews filtering
  static async getReviewsByCookFallback(cookerId: string): Promise<Review[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collection));
      const reviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      
      // Filter and sort client-side
      return reviews
        .filter(review => review.cookerId === cookerId)
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
    } catch (error) {
      console.error('Error fetching reviews (fallback):', error);
      return [];
    }
  }

  static async createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...reviewData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating review:', error);
      return null;
    }
  }
}

// Drivers Service
export class DriversService {
  private static collection = 'drivers';

  static async getAllDrivers(): Promise<Driver[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.collection), orderBy('rating', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Driver));
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return [];
    }
  }

  static async getDriverById(driverId: string): Promise<Driver | null> {
    try {
      const docRef = doc(db, this.collection, driverId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Driver;
      }
      return null;
    } catch (error) {
      console.error('Error fetching driver:', error);
      return null;
    }
  }

  static async updateDriverProfile(driverId: string, updates: Partial<Driver>): Promise<boolean> {
    try {
      console.log('Attempting to update driver profile:', driverId, updates);
      const docRef = doc(db, this.collection, driverId);
      
      // First check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error('Driver document does not exist:', driverId);
        return false;
      }
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('Driver profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      console.error('Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        driverId,
        updates
      });
      return false;
    }
  }

  static async createDriverProfile(driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>, driverId?: string): Promise<string | null> {
    try {
      console.log('Creating driver profile:', driverId, driverData);
      const now = Timestamp.now();
      
      if (driverId) {
        // Use setDoc with the provided driverId (usually the user's UID)
        const docRef = doc(db, this.collection, driverId);
        await setDoc(docRef, {
          ...driverData,
          createdAt: now,
          updatedAt: now
        });
        console.log('Driver profile created successfully with ID:', driverId);
        return driverId;
      } else {
        // Use addDoc to generate a random ID
        const docRef = await addDoc(collection(db, this.collection), {
          ...driverData,
          createdAt: now,
          updatedAt: now
        });
        console.log('Driver profile created successfully with ID:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating driver profile:', error);
      console.error('Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        driverId,
        dataKeys: Object.keys(driverData)
      });
      return null;
    }
  }

  static async deleteDriver(driverId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.collection, driverId));
      return true;
    } catch (error) {
      console.error('Error deleting driver:', error);
      return false;
    }
  }

  static async getOrdersByDriver(driverId: string): Promise<Order[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching driver orders:', error);
      return [];
    }
  }

  static async getActiveOrdersByDriver(driverId: string): Promise<Order[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.collection),
          where('driverId', '==', driverId),
          where('status', 'in', ['delivering', 'picked_up']),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching active driver orders:', error);
      return [];
    }
  }

  static async getDriverStats(driverId: string): Promise<{
    todayEarnings: number;
    todayDeliveries: number;
    totalDeliveries: number;
    completionRate: number;
  }> {
    try {
      // Get all orders for this driver
      const allOrders = await this.getOrdersByDriver(driverId);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      // Filter today's orders
      const todayOrders = allOrders.filter(order => {
        const orderDate = order.createdAt?.toDate() || new Date(0);
        return orderDate >= today;
      });
      
      // Calculate stats
      const todayDelivered = todayOrders.filter(order => order.status === 'delivered');
      const todayEarnings = todayDelivered.reduce((sum, order) => {
        return sum + (order.deliveryFee || 0);
      }, 0);
      
      const totalDelivered = allOrders.filter(order => order.status === 'delivered');
      const totalAssigned = allOrders.length;
      const completionRate = totalAssigned > 0 ? (totalDelivered.length / totalAssigned) * 100 : 0;
      
      return {
        todayEarnings,
        todayDeliveries: todayDelivered.length,
        totalDeliveries: totalDelivered.length,
        completionRate
      };
    } catch (error) {
      console.error('Error calculating driver stats:', error);
      return {
        todayEarnings: 0,
        todayDeliveries: 0,
        totalDeliveries: 0,
        completionRate: 0
      };
    }
  }

  static subscribeToDriverOrders(driverId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, this.collection),
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      callback(orders);
    });
  }
}

// Admin Service
export class AdminService {
  // Admin-specific delete methods with additional checks
  static async deleteCook(cookId: string, adminId: string): Promise<boolean> {
    try {
      // First, delete all dishes by this cook
      const dishes = await DishesService.getDishesByCook(cookId);
      const dishDeletePromises = dishes.map(dish => DishesService.deleteDish(dish.id));
      await Promise.all(dishDeletePromises);

      // Then delete the cook profile
      await deleteDoc(doc(db, 'cooks', cookId));
      
      console.log(`Admin ${adminId} deleted cook ${cookId} and ${dishes.length} associated dishes`);
      return true;
    } catch (error) {
      console.error('Error deleting cook (admin):', error);
      return false;
    }
  }

  static async deleteDish(dishId: string, adminId: string): Promise<boolean> {
    try {
      await DishesService.deleteDish(dishId);
      console.log(`Admin ${adminId} deleted dish ${dishId}`);
      return true;
    } catch (error) {
      console.error('Error deleting dish (admin):', error);
      return false;
    }
  }

  static async deleteDriver(driverId: string, adminId: string): Promise<boolean> {
    try {
      await DriversService.deleteDriver(driverId);
      console.log(`Admin ${adminId} deleted driver ${driverId}`);
      return true;
    } catch (error) {
      console.error('Error deleting driver (admin):', error);
      return false;
    }
  }

  static async getAllUsers(): Promise<{cooks: Cook[], drivers: Driver[], dishes: Dish[]}> {
    try {
      const [cooks, drivers, dishes] = await Promise.all([
        CooksService.getAllCooks(),
        DriversService.getAllDrivers(),
        DishesService.getAllDishes()
      ]);
      
      return { cooks, drivers, dishes };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { cooks: [], drivers: [], dishes: [] };
    }
  }
}

// Analytics Service
export class AnalyticsService {
  static async getCookStats(cookerId: string) {
    try {
      // Get orders for earnings calculation
      const orders = await OrdersService.getOrdersByCook(cookerId);
      const totalEarnings = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.total, 0);

      // Get dishes count
      const dishes = await DishesService.getDishesByCook(cookerId);
      const activeDishes = dishes.filter(dish => dish.isAvailable).length;

      // Get pending orders
      const pendingOrders = orders.filter(order => 
        ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(order.status)
      ).length;

      // Calculate average rating
      const reviews = await ReviewsService.getReviewsByCook(cookerId);
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      return {
        totalEarnings,
        activeDishes,
        pendingOrders,
        averageRating: Number(averageRating.toFixed(1)),
        totalOrders: orders.length,
        reviewCount: reviews.length
      };
    } catch (error) {
      console.error('Error calculating cook stats:', error);
      return {
        totalEarnings: 0,
        activeDishes: 0,
        pendingOrders: 0,
        averageRating: 0,
        totalOrders: 0,
        reviewCount: 0
      };
    }
  }
}
