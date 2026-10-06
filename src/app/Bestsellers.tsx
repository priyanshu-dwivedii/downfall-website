import styles from './bestsellers.module.css';
import ProductCard, { Product } from './ProductCard';

const mockProducts: Product[] = [
  {
    id: 'p1',
    slug: 'minimalist-black-tee',
    name: 'MINIMALIST BLACK TEE',
    image: '/garment_1.jpg',
    altText: 'Black t-shirt on dark grey background',
    price: 45.00,
    currency: 'USD',
    available: true
  },
  {
    id: 'p2',
    slug: 'premium-grey-hoodie',
    name: 'PREMIUM GREY HOODIE',
    image: '/garment_2.jpg',
    altText: 'Grey hoodie on dark background',
    price: 85.00,
    currency: 'USD',
    available: true
  },
  {
    id: 'p3',
    slug: 'sleek-leather-jacket',
    name: 'SLEEK LEATHER JACKET',
    image: '/garment_3.jpg',
    altText: 'Black leather jacket on dark background',
    price: 320.00,
    currency: 'USD',
    available: false
  },
  {
    id: 'p4',
    slug: 'white-minimalist-sneakers',
    name: 'MINIMALIST SNEAKERS',
    image: '/garment_4.jpg',
    altText: 'White sneakers on dark stone',
    price: 120.00,
    currency: 'USD',
    available: true
  }
];

export default function Bestsellers() {
  return (
    <section className={styles.bestsellersSection} aria-labelledby="bestsellers-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 id="bestsellers-heading" className={styles.heading}>BESTSELLERS</h2>
          <p className={styles.demoDisclaimer}>* Editorial selections for demonstration purposes only.</p>
        </div>
        
        <div className={styles.grid}>
          {mockProducts.map(product => (
            <ProductCard key={product.id} product={product} routeExists={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
