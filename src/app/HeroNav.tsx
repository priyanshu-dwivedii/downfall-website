'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { useMenu } from '@/app/context/MenuContext';
import styles from './HeroNav.module.css';

export default function HeroNav() {
  const { totalQuantity, isMounted, openCart } = useCart();
  const { isMenuOpen, openMenu, closeMenu } = useMenu();


  return (
    <nav className={styles.navContainer} aria-label="Main Navigation">
      {/* Menu Toggle */}
      <button 
        className={styles.menuToggle}
        onClick={isMenuOpen ? closeMenu : openMenu}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      >
        <div className={styles.hamburgerIcon}>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </div>
        <span className={styles.menuLabel}>MENU</span>
      </button>

      {/* Cart Toggle */}
      <button onClick={openCart} className={styles.cartToggle} aria-label="Open cart">
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


    </nav>
  );
}
