'use client';
import { useState } from 'react';
import styles from './page.module.css';

export default function ShopButton() {
  const [msg, setMsg] = useState('');
  return (
    <div className={styles.ctaWrapper}>
      <button 
        type="button" 
        className={styles.ctaButton} 
        onClick={() => setMsg('Collection preview coming soon.')}
        aria-controls="shop-msg"
      >
        Shop the Collection
      </button>
      <div aria-live="polite" id="shop-msg" className={styles.shopMessage}>
        {msg}
      </div>
    </div>
  );
}
