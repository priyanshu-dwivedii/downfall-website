import Image from 'next/image';
import styles from './shop.module.css';
import CollectionCard, { Collection } from '../CollectionCard';

export default function Shop() {
  const collections: Collection[] = [
    {
      title: 'BASICS',
      label: 'DAILY',
      image: '/shop_basics.jpg',
      href: '/collections/basics',
      alt: 'Clean daily wear basics'
    },
    {
      title: 'FORMAL',
      label: 'WEAR',
      image: '/shop_formal.jpg',
      href: '/collections/formal',
      alt: 'Tailored formal suit jacket'
    },
    {
      title: 'LUXURY',
      label: 'REFINED',
      image: '/shop_luxury.jpg',
      href: '/collections/luxury',
      alt: 'Elegant luxury silk garment'
    }
  ];

  return (
    <main className={styles.shopPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>DOWNFALL COLLECTIONS</h1>
        </div>
        
        <div className={styles.collectionsGrid}>
          {collections.map(col => (
            <CollectionCard key={col.title} collection={col} />
          ))}
        </div>
      </div>
    </main>
  );
}
