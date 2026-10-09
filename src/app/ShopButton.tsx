'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './ShopButton.module.css';

interface ShopButtonProps {
  text?: string;
  href?: string;
}

export default function ShopButton({ text = "SHOP THE COLLECTION", href = "/collections/all" }: ShopButtonProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(0);

  useEffect(() => {
    if (pillRef.current) {
      setPillWidth(pillRef.current.offsetWidth);
    }
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setPillWidth((entry.target as HTMLElement).offsetWidth);
      }
    });
    if (pillRef.current) resizeObserver.observe(pillRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={styles.ctaWrapper}>
      <Link 
        href={href} 
        className={styles.ctaGroup}
        style={{ '--pill-width': `${pillWidth}px` } as React.CSSProperties}
      >
        <div className={styles.textPill} ref={pillRef}>
          {text}
        </div>
        <div className={styles.iconCircle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>
    </div>
  );
}
