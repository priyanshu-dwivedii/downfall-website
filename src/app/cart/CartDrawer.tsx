'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { catalog } from '../data/products';
import QuantityInput from './QuantityInput';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, subtotal, isMounted, getProduct } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const triggerRef = useRef<HTMLElement | null>(null);

  // Close on Escape and handle focus
  useEffect(() => {
    if (isCartOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      if (drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCartOpen) return;
      if (e.key === 'Escape') {
        closeCart();
        return;
      }
      
      // Focus trapping
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Dimmed Backdrop */}
      <div 
        className={`${styles.backdrop} ${isCartOpen ? styles.open : ''}`} 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className={`${styles.drawer} ${isCartOpen ? styles.open : ''}`} 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Your cart is empty</p>
            <button 
              className={styles.continueBtn}
              onClick={() => {
                closeCart();
                router.push('/collections/all');
              }}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className={styles.populatedState}>
            <div className={styles.itemsList}>
              {items.map((item) => {
                const product = getProduct(item.productId) || catalog.find(p => p.id === item.productId);
                if (!product) return null;
                const variant = product.variants.find(v => v.name === item.variantName);
                if (!variant) return null;

                const isDemo = (product as any).isDemoPrice !== undefined ? Boolean((product as any).isDemoPrice) : true;

                return (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      <Image 
                        src={variant.image} 
                        alt={product.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemName}>{product.name}</h3>
                        <p className={styles.itemPrice}>${product.price.toFixed(2)} USD {isDemo && <span className={styles.demoNote}>(Demo)</span>}</p>
                      </div>
                      <p className={styles.itemVariant}>{item.variantName} / {item.size}</p>
                      
                      <div className={styles.itemActions}>
                        <div className={styles.quantityControl}>
                          <button 
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <QuantityInput 
                            initialQuantity={item.quantity} 
                            onUpdate={(val) => updateQuantity(item.id, val)} 
                            className={styles.qtyValue} 
                            ariaLabel={`Quantity for ${product.name}`} 
                          />
                          <button 
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span className={styles.subtotalLabel}>Subtotal</span>
                <span className={styles.subtotalValue}>${subtotal.toFixed(2)} USD</span>
              </div>
              <p className={styles.shippingNotice}>Bespoke collection enquiry via WhatsApp.</p>
              <button 
                className={styles.checkoutBtn} 
                onClick={() => {
                  closeCart();
                  router.push('/checkout');
                }}
              >
                PROCEED TO ORDER
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
