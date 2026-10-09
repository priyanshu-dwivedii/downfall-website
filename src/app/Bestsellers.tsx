import styles from './bestsellers.module.css';
import ProductCard from './ProductCard';
import ScrollAnimatedHeading from './ScrollAnimatedHeading';
import { catalog } from '@/app/data/products';

const bestsellersIds = ['p1', 'p2', 'p3', 'p4'];
const mockProducts = bestsellersIds.map(id => catalog.find(p => p.id === id)!).map(p => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  image: p.variants[0].image,
  altText: p.name,
  price: p.price,
  currency: p.currency,
  available: p.variants.some(v => v.sizes.some(s => s.available))
}));

export default function Bestsellers() {
  return (
    <section id="bestsellers" className={styles.bestsellersSection} aria-labelledby="bestsellers-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <ScrollAnimatedHeading text="The Standout Edit" as="h2" id="bestsellers-heading" className={styles.heading} />
        </div>
        
        <div className={styles.grid}>
          {mockProducts.map(product => (
            <ProductCard key={product.id} product={product} routeExists={true} />
          ))}
        </div>
      </div>
    </section>
  );
}
