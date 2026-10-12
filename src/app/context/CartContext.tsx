'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { catalog as staticCatalog, Product } from '@/app/data/products';

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
  catalog: Product[];
  getProduct: (id: string) => Product | undefined;
  revalidateCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(staticCatalog);
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const getProduct = useCallback((id: string): Product | undefined => {
    return catalog.find((p) => p.id === id) || staticCatalog.find((p) => p.id === id);
  }, [catalog]);

  // Revalidate cart items against a given catalog
  const validateItemsAgainstCatalog = useCallback((cartItems: CartItem[], activeCatalog: Product[]): CartItem[] => {
    return cartItems
      .map((item) => {
        const product = activeCatalog.find((p) => p.id === item.productId);
        if (!product) return null;

        const variant = product.variants.find((v) => v.name === item.variantName);
        if (!variant) return null;

        const sizeInfo = variant.sizes.find((s) => s.size === item.size);
        if (!sizeInfo || !sizeInfo.available) return null;

        // Stock check
        const maxStock = (sizeInfo as any).stock !== undefined ? (sizeInfo as any).stock : 10;
        if (maxStock <= 0) return null;

        const clampedQuantity = Math.min(item.quantity, maxStock, 10);
        return {
          ...item,
          quantity: Math.max(1, clampedQuantity),
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, []);

  // Fetch live catalog and revalidate
  const revalidateCart = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setCatalog(data.products);
          setItems((prevItems) => validateItemsAgainstCatalog(prevItems, data.products));
        }
      }
    } catch (err) {
      console.warn('Live catalog revalidation error, falling back to cached catalog:', err);
    }
  }, [validateItemsAgainstCatalog]);

  // On mount: load stored cart and trigger revalidation
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('downfall_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const valid = validateItemsAgainstCatalog(parsed, staticCatalog);
          setItems(valid);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart', e);
    }

    // Always fetch live catalog from server to revalidate prices & availability
    revalidateCart();
  }, [revalidateCart, validateItemsAgainstCatalog]);

  // Sync back to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('downfall_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: { productId: string; variantName: string; size: string; quantity?: number }) => {
    const qtyToAdd = newItem.quantity && newItem.quantity > 0 ? newItem.quantity : 1;
    setItems((prev) => {
      const existingItem = prev.find(
        (i) =>
          i.productId === newItem.productId &&
          i.variantName === newItem.variantName &&
          i.size === newItem.size
      );
      if (existingItem) {
        return prev.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: Math.min(10, i.quantity + qtyToAdd) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `${newItem.productId}_${newItem.variantName}_${newItem.size}`,
          productId: newItem.productId,
          variantName: newItem.variantName,
          size: newItem.size,
          quantity: Math.min(10, qtyToAdd),
        },
      ];
    });
    openCart(); // Automatically open cart when adding
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return removeFromCart(id);
    const clampedQty = Math.min(10, newQuantity);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: clampedQty } : i)));
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal calculated with current revalidated catalog prices
  const subtotal = items.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalQuantity,
        subtotal,
        isMounted,
        isCartOpen,
        openCart,
        closeCart,
        catalog,
        getProduct,
        revalidateCart,
      }}
    >
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
