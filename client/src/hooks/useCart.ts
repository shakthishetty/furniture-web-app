import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  configurationId?: string;
  customConfiguration?: Record<string, any>;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, configurationId?: string) => void;
  updateQuantity: (productId: string, configurationId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string, configurationId?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('teak-theory-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('teak-theory-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        cartItem => 
          cartItem.productId === item.productId && 
          cartItem.configurationId === item.configurationId
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...currentItems, { ...item, quantity }];
      }
    });
  };

  const removeItem = (productId: string, configurationId?: string) => {
    setItems(currentItems =>
      currentItems.filter(
        item => 
          !(item.productId === productId && item.configurationId === configurationId)
      )
    );
  };

  const updateQuantity = (productId: string, configurationId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, configurationId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId && item.configurationId === configurationId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (productId: string, configurationId?: string) => {
    return items.some(
      item => 
        item.productId === productId && 
        item.configurationId === configurationId
    );
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
  };

  return React.createElement(
    CartContext.Provider,
    { value },
    children
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}