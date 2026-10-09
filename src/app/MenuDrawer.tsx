'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMenu } from './context/MenuContext';
import { useCart } from './context/CartContext';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import styles from './MenuDrawer.module.css';

export default function MenuDrawer() {
  const { isMenuOpen, closeMenu } = useMenu();
  const { isCartOpen } = useCart();
  const shouldReduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCartOpen && isMenuOpen) {
      closeMenu();
    }
  }, [isCartOpen, isMenuOpen, closeMenu]);

  useEffect(() => {
    if (isMenuOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return;
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }
      if (e.key === 'Tab' && overlayRef.current) {
        const focusableElements = overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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
  }, [isMenuOpen, closeMenu]);

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'PRODUCTS', href: '/collections/all' },
    { label: 'ABOUT US', href: '/#brand-story' },
  ];

  const variants: Variants = shouldReduceMotion 
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut', staggerChildren: 0.1 } },
      };

  const itemVariants: Variants = shouldReduceMotion 
    ? {
        hidden: { opacity: 0, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div 
          className={styles.overlay}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          role="dialog"
          aria-modal="true"
          aria-label="Main Navigation Menu"
          ref={overlayRef}
        >
          <div className={styles.header}>
            <button 
              ref={closeBtnRef}
              className={styles.closeBtn} 
              onClick={closeMenu}
              aria-label="Close menu"
            >
              &times; CLOSE
            </button>
          </div>
          
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {navLinks.map((link) => (
                <motion.li key={link.href} variants={itemVariants}>
                  <Link href={link.href} className={styles.navLink} onClick={closeMenu}>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
