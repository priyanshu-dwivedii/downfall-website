import Link from 'next/link';
import styles from './page.module.css';

export default function ShopButton() {
  return (
    <div className={styles.ctaWrapper}>
      <a href="#collections" className={styles.ctaButton}>
        Shop the Collection
      </a>
    </div>
  );
}
