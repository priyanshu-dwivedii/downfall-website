import styles from './productListing.module.css';
import CollectionCard, { Collection } from './CollectionCard';

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

export default function ProductListing() {
  return (
    <section id="collections" className={styles.listingSection} aria-labelledby="listing-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="listing-heading" className={styles.heading}>SHOP THE COLLECTION</h2>
        </div>
        
        <div className={styles.grid}>
          {collections.map(col => (
            <CollectionCard key={col.title} collection={col} />
          ))}
        </div>
      </div>
    </section>
  );
}
