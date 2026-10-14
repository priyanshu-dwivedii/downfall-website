import styles from './bestsellers.module.css';
import ProductCard from './ProductCard';
import ScrollAnimatedHeading from './ScrollAnimatedHeading';
import { getCatalog } from '@/lib/catalog';

export default async function Bestsellers() {
  const published = await getCatalog(false);
  
  // Pick standout published products (priority to flagship bottomwear)
  const preferredIds = [
    'draft_cocoa_skater_denim',
    'draft_indigo_drape_jeans',
    'draft_beige_wide_leg_joggers',
    'draft_white_pinstripe_flared_pants',
  ];

  let selected = preferredIds
    .map((id) => published.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // If fewer than 4 matched preferred IDs, supplement with remaining published items
  if (selected.length < 4) {
    const selectedIds = new Set(selected.map((p) => p.id));
    for (const p of published) {
      if (!selectedIds.has(p.id)) {
        selected.push(p);
        if (selected.length === 4) break;
      }
    }
  }

  const standoutProducts = selected.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.variants[0]?.image || p.images?.[0] || '/garment_1.jpg',
    altText: p.name,
    price: p.price,
    currency: p.currency,
    isDemoPrice: p.isDemoPrice,
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
