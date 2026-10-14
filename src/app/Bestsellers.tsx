import styles from './bestsellers.module.css';
import ProductCard from './ProductCard';
import ScrollAnimatedHeading from './ScrollAnimatedHeading';
import { getCatalog } from '@/lib/catalog';

export default async function Bestsellers() {
  const published = await getCatalog(false);
  const bestsellersIds = ['p1', 'p2', 'p3', 'p4'];
  const standoutProducts = bestsellersIds
    .map((id) => published.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.variants[0]?.image || p.images?.[0] || '/garment_1.jpg',
      altText: p.name,
      price: p.price,
      currency: p.currency,
      available: p.variants.some((v: any) => v.sizes?.some((s: any) => s.available)),
    }));

  return (
    <section id="bestsellers" className={styles.bestsellersSection} aria-labelledby="bestsellers-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <ScrollAnimatedHeading text="The Standout Edit" as="h2" id="bestsellers-heading" className={styles.heading} />
        </div>
        
        <div className={styles.grid}>
          {standoutProducts.map((product) => (
            <ProductCard key={product.id} product={product} routeExists={true} />
          ))}
        </div>
      </div>
    </section>
  );
}
