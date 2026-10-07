'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './HeroNav.module.css';

export default function HeroNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={styles.navContainer} aria-label="Main Navigation">
      {/* Desktop Menu Left */}
      <ul className={`${styles.desktopMenu} ${styles.menuLeft}`}>
        <li><Link href="#home" className={styles.navLink}>HOME</Link></li>
        <li><Link href="#bestsellers" className={styles.navLink}>BESTSELLERS</Link></li>
      </ul>

      {/* Desktop Menu Right */}
      <ul className={`${styles.desktopMenu} ${styles.menuRight}`}>
        <li><Link href="#collections" className={styles.navLink}>COLLECTIONS</Link></li>
        <li><Link href="#brand-story" className={styles.navLink}>THE STORY</Link></li>
      </ul>

      {/* Mobile Hamburger Toggle */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <ul className={styles.mobileMenu}>
          <li><Link href="#home" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>HOME</Link></li>
          <li><Link href="#bestsellers" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>BESTSELLERS</Link></li>
          <li><Link href="#collections" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>COLLECTIONS</Link></li>
          <li><Link href="#brand-story" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>THE STORY</Link></li>
        </ul>
      )}
    </nav>
  );
}
