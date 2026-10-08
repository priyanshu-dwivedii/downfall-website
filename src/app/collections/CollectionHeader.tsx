import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionHeader.module.css';

export default function CollectionHeader() {
  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} aria-label="Menu">
        <span className={styles.menuIcon}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </span>
        <span className={styles.menuText}>MENU</span>
      </button>
      
      <Link href="/" className={styles.logoLink}>
        <Image src="/Downfall%20logo.png" alt="DOWNFALL" width={28} height={28} className={styles.logoImage} />
        <span className={styles.brandName}>DOWNFALL</span>
      </Link>
      
      <div className={styles.spacer}></div>
    </header>
  );
}
