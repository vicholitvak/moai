import { Timestamp } from "firebase/firestore";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  cookerId: string;
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  prepTime: string;
  preparationTime: number;
  servingSize: number;
  status: string;
  ingredients: string[];
  allergens: string[];
  deliveryMode: 'cook' | 'external';
  deliveryFee: number;
  dietaryRestrictions: string[];
  nutrition: Record<string, number | string>;
  availability: boolean;
  // Location-based fields
  cityId?: string;
  cityName?: string;
  region?: string;
  cookDistance?: number;
  estimatedDeliveryTime?: number;
  cookLocation?: {
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
  localSpecialties?: string[];
  popularDishes?: string[];
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
    notes?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  paymentMethod: 'card' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cash_pending';
  paymentId?: string;
  status: 'pending_approval' | 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'en_viaje' | 'delivered' | 'cancelled' | 'rejected';
  deliveryInfo: {
    address: string;
    phone: string;
    instructions?: string;
  };
  deliveryCode: string;
  isDelivered: boolean;
  isSelfDelivery?: boolean;
  driverLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  reviewed?: boolean;
  cancelledAt?: Timestamp;
  assignedAt?: Timestamp;
  deliveredAt?: Timestamp;
  cookerApproval?: {
    approved: boolean;
    approvedAt?: Timestamp;
    rejectedAt?: Timestamp;
    rejectionReason?: string;
  };
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
  orderId?: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Timestamp;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  query: string;
}