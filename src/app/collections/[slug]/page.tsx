import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../collection.module.css';
import ProductCardWithColor, { ProductWithColors } from '@/app/ProductCardWithColor';

const collectionData: Record<string, { title: string; products: ProductWithColors[] }> = {
  basics: {
    title: 'BASICS — DAILY',
    products: [
      {
        id: 'c1',
        name: 'CLASSIC TEE',
        price: 35.00,
        currency: 'USD',
        variants: [
          { name: 'Black', hex: '#111111', image: '/tee_black.jpg' },
          { name: 'White', hex: '#FFFFFF', image: '/tee_white.jpg' },
          { name: 'Dark Red', hex: '#6b1c23', image: '/tee_red.jpg' }
        ]
      }
    ]
  },
  formal: {
    title: 'FORMAL — WEAR',
    products: [
      {
        id: 'f1',
        name: 'TAILORED BLAZER',
        price: 245.00,
        currency: 'USD',
        variants: [
          { name: 'Black', hex: '#111111', image: '/blazer_black.jpg' },
          { name: 'Navy', hex: '#1C2841', image: '/blazer_navy.jpg' }
        ]
      }
    ]
  },
  luxury: {
    title: 'LUXURY — REFINED',
    products: [
      {
        id: 'x1',
        name: 'SILK EVENING DRESS',
        price: 850.00,
        currency: 'USD',
        variants: [
          { name: 'Ivory', hex: '#F5F5F0', image: '/shop_luxury.jpg' }
        ]
      }
    ]
  }
};

export default async function CollectionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const collection = collectionData[params.slug];
  
  if (!collection) {
    return notFound();
  }

  return (
    <main className={styles.collectionPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/shop" className={styles.backLink}>← BACK TO COLLECTIONS</Link>
          <h1 className={styles.heading}>{collection.title}</h1>
        </div>
        
        <div className={styles.grid}>
          {collection.products.map(product => (
            <ProductCardWithColor key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
