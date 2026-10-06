import Image from 'next/image';
import Link from 'next/link';
import styles from './CollectionCard.module.css';

export interface Collection {
  title: string;
  label: string;
  image: string;
  href: string;
  alt: string;
}

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={collection.href} className={styles.collectionCard}>
      <Image 
        src={collection.image} 
        alt={collection.alt} 
        fill 
        className={styles.cardImage} 
        sizes="(max-width: 1023px) 100vw, 33vw"
      />
      <div className={styles.overlay}>
        <div className={styles.topText}>
          <h2 className={styles.cardHeading}>{collection.title}</h2>
          <span className={styles.cardLabel}>{collection.label}</span>
        </div>
        <span className={styles.exploreBtn}>EXPLORE NOW</span>
      </div>
    </Link>
  );
}
