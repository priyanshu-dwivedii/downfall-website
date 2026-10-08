'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroNav.module.css';

export default function HeroNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    if (isOpen && menuRef.current) {
      const closeBtn = menuRef.current.querySelector('button');
      if (closeBtn) closeBtn.focus();
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <nav className={styles.navContainer} aria-label="Main Navigation">
      {/* Menu Toggle */}
      <button 
        className={styles.menuToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <div className={styles.hamburgerIcon}>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </div>
        <span className={styles.menuLabel}>MENU</span>
      </button>

      {/* Cart Toggle */}
      <button 
        className={styles.cartToggle}
        aria-disabled="true"
        aria-label="Cart is currently disabled"
      >
        <div className={styles.cartIcon}>
          <svg width="18" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 5V3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3V5M2 5H14L14.75 16.5C14.8 16.7 14.6 17 14.3 17H1.7C1.4 17 1.2 16.7 1.25 16.5L2 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className={styles.menuLabel}>CART</span>
      </button>

      {/* Menu Panel */}
      {isOpen && (
        <ul className={styles.menuPanel} ref={menuRef}>
          <li className={styles.menuHeader}>
            <button 
              className={styles.closeButton} 
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
          </li>
          <li><Link href="#home" className={styles.navLink} onClick={() => setIsOpen(false)}>HOME</Link></li>
          <li><Link href="#bestsellers" className={styles.navLink} onClick={() => setIsOpen(false)}>BESTSELLERS</Link></li>
          <li><Link href="#collections" className={styles.navLink} onClick={() => setIsOpen(false)}>COLLECTIONS</Link></li>
          <li><Link href="#brand-story" className={styles.navLink} onClick={() => setIsOpen(false)}>THE STORY</Link></li>
        </ul>
      )}
    </nav>
  );
}
