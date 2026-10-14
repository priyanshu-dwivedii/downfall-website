'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { catalog as staticCatalog, Product } from '@/app/data/products';

export interface CustomMeasurements {
  waist?: string;
  outseam?: string;
  unit: 'in' | 'cm';
}

export interface CartItem {
  id: string;      
  productId: string;
  variantName: string;
  size: string;
  quantity: number;
  customMeasurements?: CustomMeasurements;
}

export interface FormattedCurrencySubtotal {
  currency: string;
  symbol: string;
  amount: number;
  formatted: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: {
    productId: string;
    variantName: string;
    size: string;
    quantity?: number;
    customMeasurements?: CustomMeasurements;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  totalQuantity: number;
  subtotal: number;
  currencySubtotals: Record<string, number>;
  formattedSubtotals: FormattedCurrencySubtotal[];
  formattedSubtotalString: string;
  isMixedCart: boolean;
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

        // Fulfilment is authoritative; prevents isMadeToOrder from contradicting it
        const isMadeToOrder = (product as any)?.fulfilment
          ? (product as any).fulfilment === 'made_to_order'
          : Boolean((product as any)?.isMadeToOrder);

        if (isMadeToOrder) {
          // Made to order garments do not have an invented stock or quantity cap; preserve valid quantity >= 1
          return {
            ...item,
            quantity: Math.max(1, item.quantity),
          };
        }

        // Stocked product check
        const maxStock = (sizeInfo as any).stock !== undefined ? (sizeInfo as any).stock : undefined;
        if (maxStock !== undefined && maxStock <= 0) return null;

        const clampedQuantity = maxStock !== undefined ? Math.min(item.quantity, maxStock) : item.quantity;
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

  const areMeasurementsEqual = (m1?: CustomMeasurements, m2?: CustomMeasurements) => {
    if (!m1 && !m2) return true;
    if (!m1 || !m2) return false;
    return (
      (m1.waist?.trim() || '') === (m2.waist?.trim() || '') &&
      (m1.outseam?.trim() || '') === (m2.outseam?.trim() || '') &&
      m1.unit === m2.unit
    );
  };

  const buildItemId = (item: {
    productId: string;
    variantName: string;
    size: string;
    customMeasurements?: CustomMeasurements;
  }) => {
    let id = `${item.productId}_${item.variantName}_${item.size}`;
    if (item.customMeasurements) {
      const w = (item.customMeasurements.waist || '').trim();
      const o = (item.customMeasurements.outseam || '').trim();
      const u = item.customMeasurements.unit || 'in';
      id += `_w${w}_o${o}_${u}`;
    }
    return id;
  };

  const addToCart = (newItem: {
    productId: string;
    variantName: string;
    size: string;
    quantity?: number;
    customMeasurements?: CustomMeasurements;
  }) => {
    const qtyToAdd = newItem.quantity && newItem.quantity > 0 ? newItem.quantity : 1;
    const product = getProduct(newItem.productId);
    const isMTO = product?.fulfilment
      ? product.fulfilment === 'made_to_order'
      : Boolean((product as any)?.isMadeToOrder);

    setItems((prev) => {
      const existingItem = prev.find(
        (i) =>
          i.productId === newItem.productId &&
          i.variantName === newItem.variantName &&
          i.size === newItem.size &&
          areMeasurementsEqual(i.customMeasurements, newItem.customMeasurements)
      );
      if (existingItem) {
        const nextQty = existingItem.quantity + qtyToAdd;
        const variant = product?.variants.find((v) => v.name === newItem.variantName);
        const sizeInfo = variant?.sizes.find((s) => s.size === newItem.size);
        const maxStock = (sizeInfo as any)?.stock;
        const clampedQty = isMTO
          ? nextQty
          : maxStock !== undefined
          ? Math.min(nextQty, maxStock)
          : nextQty;

        return prev.map((i) =>
          i.id === existingItem.id ? { ...i, quantity: clampedQty } : i
        );
      }

      const variant = product?.variants.find((v) => v.name === newItem.variantName);
      const sizeInfo = variant?.sizes.find((s) => s.size === newItem.size);
      const maxStock = (sizeInfo as any)?.stock;
      const initialQty = isMTO
        ? qtyToAdd
        : maxStock !== undefined
        ? Math.min(qtyToAdd, maxStock)
        : qtyToAdd;

      return [
        ...prev,
        {
          id: buildItemId(newItem),
          productId: newItem.productId,
          variantName: newItem.variantName,
          size: newItem.size,
          quantity: initialQty,
          customMeasurements: newItem.customMeasurements,
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
    const item = items.find((i) => i.id === id);
    const product = item ? getProduct(item.productId) : undefined;
    const isMTO = product?.fulfilment
      ? product.fulfilment === 'made_to_order'
      : Boolean((product as any)?.isMadeToOrder);

    if (isMTO) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)));
      return;
    }

    const variant = product?.variants.find((v) => v.name === item?.variantName);
    const sizeInfo = variant?.sizes.find((s) => s.size === item?.size);
    const maxStock = (sizeInfo as any)?.stock;
    const clampedQty = maxStock !== undefined ? Math.min(newQuantity, maxStock) : newQuantity;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: clampedQty } : i)));
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Currency-aware subtotal computation: NEVER mix different currencies into a single numeric sum
  const currencySubtotals = items.reduce<Record<string, number>>((acc, item) => {
    const product = getProduct(item.productId);
    const curr = product?.currency || 'USD';
    const price = product ? product.price : 0;
    acc[curr] = (acc[curr] || 0) + price * item.quantity;
    return acc;
  }, {});

  const currenciesInCart = Object.keys(currencySubtotals);
  const isMixedCart = currenciesInCart.length > 1;

  const formattedSubtotals: FormattedCurrencySubtotal[] = currenciesInCart.map((curr) => {
    const amount = currencySubtotals[curr];
    const formatted = curr === 'INR'
      ? `₹${amount.toLocaleString('en-IN')} INR`
      : `$${amount.toFixed(2)} USD`;
    return {
      currency: curr,
      symbol: curr === 'INR' ? '₹' : '$',
      amount,
      formatted,
    };
  });

  const formattedSubtotalString = formattedSubtotals.length > 0
    ? formattedSubtotals.map((f) => f.formatted).join(' + ')
    : '$0.00 USD';

  // For backward compatibility: if single currency return that amount; if mixed, return 0 to prevent accidental addition
  const subtotal = currenciesInCart.length === 1 ? currencySubtotals[currenciesInCart[0]] : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalQuantity,
        subtotal,
        currencySubtotals,
        formattedSubtotals,
        formattedSubtotalString,
        isMixedCart,
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
