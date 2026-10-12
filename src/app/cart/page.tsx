'use client';

import { useCart } from '@/app/context/CartContext';
import { catalog } from '@/app/data/products';
import Image from 'next/image';
import Link from 'next/link';
import QuantityInput from './QuantityInput';
import styles from './cart.module.css';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalQuantity, subtotal, isMounted, getProduct } = useCart();

  if (!isMounted) {
    return null; // Avoid hydration errors
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h1 className={styles.title}>YOUR BAG</h1>
        <p className={styles.emptyText}>Your bag is currently empty.</p>
        <Link href="/collections/all" className={styles.continueButton}>
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>YOUR BAG ({totalQuantity})</h1>
        
        <div className={styles.cartContent}>
          <div className={styles.itemsList}>
            {items.map(item => {
              const product = getProduct(item.productId) || catalog.find(p => p.id === item.productId);
              if (!product) return null;
              const variant = product.variants.find(v => v.name === item.variantName);
              if (!variant) return null;

              const isDemo = (product as any).isDemoPrice !== undefined ? Boolean((product as any).isDemoPrice) : true;

              return (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.imageWrapper}>
                    <Link href={`/products/${product.slug}?color=${encodeURIComponent(variant.name)}`}>
                      <Image
                        src={variant.image}
                        alt={`${product.name} in ${variant.name}`}
                        fill
                        className={styles.itemImage}
                      />
                    </Link>
                  </div>
                  
                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeader}>
                      <Link href={`/products/${product.slug}?color=${encodeURIComponent(variant.name)}`} className={styles.itemName}>
                        {product.name}
                      </Link>
                      <p className={styles.itemPrice}>
                        {product.currency} {product.price.toFixed(2)} {isDemo && <span className={styles.demoNote}>(Demo)</span>}
                      </p>
                    </div>
                    
                    <p className={styles.itemMeta}>Color: {variant.name}</p>
                    <p className={styles.itemMeta}>Size: {item.size}</p>
                    
                    <div className={styles.itemControls}>
                      <div className={styles.quantityControl}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className={styles.qtyBtn}
                        >
                          −
                        </button>
                        <QuantityInput 
                          initialQuantity={item.quantity} 
                          onUpdate={(val) => updateQuantity(item.id, val)} 
                          className={styles.qtyValue} 
                          ariaLabel={`Quantity for ${product.name}`} 
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className={styles.qtyBtn}
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className={styles.removeBtn}
                        aria-label={`Remove ${product.name} from bag`}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className={styles.summarySection}>
            <h2 className={styles.summaryTitle}>ORDER SUMMARY</h2>
            
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>USD {subtotal.toFixed(2)}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>USD {subtotal.toFixed(2)}</span>
            </div>
            
            <div className={styles.checkoutWrapper}>
              <Link 
                href="/checkout"
                className={styles.checkoutBtn} 
              >
                PROCEED TO ORDER
              </Link>
              <p className={styles.bespokeNotice}>Bespoke collection enquiry via WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
