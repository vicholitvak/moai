'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AppSettingsService, AppSettings } from '@/lib/firebase/dataService';

export interface CartItem {
  id: string;
  dishId: string;
  name: string;
  price: number;
  image: string;
  cookerName: string;
  cookerId: string;
  cookerAvatar: string;
  quantity: number;
  prepTime: string;
  category: string;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addToCart: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getDeliveryFee: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  totalAmount: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartSubtotal: () => 0,
  getDeliveryFee: () => 0,
  getServiceFee: () => 0,
  getTotal: () => 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Load app settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AppSettingsService.getSettings();
        setAppSettings(settings);
      } catch (error) {
        console.error('Error loading app settings:', error);
        // Use default settings if Firebase is not accessible
        setAppSettings({
          id: 'main',
          deliveryFee: {
            baseRate: 0,
            freeDeliveryThreshold: 25000,
            isEnabled: false
          },
          serviceFee: {
            percentage: 0.12,
            isEnabled: true
          },
          updatedAt: new Date() as any,
          updatedBy: 'system'
        });
      }
    };
    loadSettings();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.uid}`);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }
    }
  }, [user]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_${user.uid}`, JSON.stringify(items));
    }
  }, [items, user]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      setItems([]);
    }
  }, [user]);

  const addToCart = (newItem: Omit<CartItem, 'id' | 'totalPrice'>) => {
    setItems(prev => {
      // Check if item already exists in cart
      const existingItemIndex = prev.findIndex(item => item.dishId === newItem.dishId);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
          totalPrice: (updatedItems[existingItemIndex].quantity + newItem.quantity) * updatedItems[existingItemIndex].price
        };
        return updatedItems;
      } else {
        // Add new item to cart
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.dishId}_${Date.now()}`,
          totalPrice: newItem.price * newItem.quantity
        };
        return [...prev, cartItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: item.price * quantity }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    if (user) {
      localStorage.removeItem(`cart_${user.uid}`);
    }
  };

  const getCartSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getDeliveryFee = () => {
    if (!appSettings || !appSettings.deliveryFee.isEnabled) {
      return 0;
    }
    
    const subtotal = getCartSubtotal();
    const { baseRate, freeDeliveryThreshold } = appSettings.deliveryFee;
    
    return subtotal >= freeDeliveryThreshold ? 0 : baseRate;
  };

  const getServiceFee = () => {
    if (!appSettings || !appSettings.serviceFee.isEnabled) {
      return 0;
    }
    
    return getCartSubtotal() * appSettings.serviceFee.percentage;
  };

  const getTotal = () => {
    return getCartSubtotal() + getDeliveryFee() + getServiceFee();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = getTotal();

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      totalAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartSubtotal,
      getDeliveryFee,
      getServiceFee,
      getTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};