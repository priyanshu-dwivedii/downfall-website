'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useMenu } from '@/app/context/MenuContext';
import styles from './CollectionHeader.module.css';

export default function CollectionHeader() {
  const { totalQuantity, isMounted, openCart } = useCart();
  const { isMenuOpen, openMenu, closeMenu } = useMenu();

  return (
    <header className={styles.minimalHeader}>
      {/* Menu Toggle Pill */}
      <button 
        className={styles.menuToggle}
        onClick={isMenuOpen ? closeMenu : openMenu}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <div className={styles.hamburgerIcon}>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </div>
        <span className={styles.menuLabel}>MENU</span>
      </button>

      {/* Centered Logo */}
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoLink}>
          <Image src="/downfall-black-red-transparent.png" alt="DOWNFALL" width={110} height={60} style={{ objectFit: 'contain' }} />
        </Link>
      </div>

      {/* Cart Toggle Pill */}
      <button onClick={openCart} className={styles.cartToggle} aria-label={`View Cart, ${totalQuantity} items`}>
        <div className={styles.cartIcon}>
          <svg width="18" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 5V3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3V5M2 5H14L14.75 16.5C14.8 16.7 14.6 17 14.3 17H1.7C1.4 17 1.2 16.7 1.25 16.5L2 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {isMounted && totalQuantity > 0 && (
            <span className={styles.cartBadge}>{totalQuantity}</span>
          )}
        </div>
        <span className={styles.menuLabel}>CART</span>
      </button>


    </header>
  );
}
