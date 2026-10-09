'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { catalog } from '@/app/data/products';

export interface CartItem {
  id: string;      
  productId: string;
  variantName: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: { productId: string; variantName: string; size: string; quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  totalQuantity: number;
  subtotal: number;
  isMounted: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('downfall_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Verify with catalog to ensure variants/products still exist
          const validItems = parsed.filter(item => {
            const product = catalog.find(p => p.id === item.productId);
            if (!product) return false;
            const variant = product.variants.find(v => v.name === item.variantName);
            if (!variant) return false;
            const sizeInfo = variant.sizes.find(s => s.size === item.size);
            if (!sizeInfo || !sizeInfo.available) return false; 
            return true;
          });
          setItems(validItems);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart', e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('downfall_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: { productId: string; variantName: string; size: string; quantity?: number }) => {
    const qtyToAdd = newItem.quantity && newItem.quantity > 0 ? newItem.quantity : 1;
    setItems(prev => {
      const existingItem = prev.find(
        i => i.productId === newItem.productId && 
             i.variantName === newItem.variantName && 
             i.size === newItem.size
      );
      if (existingItem) {
        return prev.map(i => 
          i.id === existingItem.id 
            ? { ...i, quantity: Math.min(10, i.quantity + qtyToAdd) }
            : i
        );
      }
      return [...prev, { 
        id: `${newItem.productId}_${newItem.variantName}_${newItem.size}`, 
        productId: newItem.productId,
        variantName: newItem.variantName,
        size: newItem.size,
        quantity: Math.min(10, qtyToAdd) 
      }];
    });
    openCart(); // Automatically open cart when adding
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return removeFromCart(id);
    const clampedQty = Math.min(10, newQuantity);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: clampedQty } : i));
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
    const product = catalog.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, totalQuantity, subtotal, isMounted, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
