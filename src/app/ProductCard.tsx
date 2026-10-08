import Image from 'next/image';
import Link from 'next/link';
import styles from './ProductCard.module.css';

export interface Product {
  id: string;
  slug: string;
  name: string;
  image: string;
  altText: string;
  price: number;
  currency: string;
  available: boolean;
}

interface Props {
  product: Product;
  routeExists?: boolean;
}

export default function ProductCard({ product, routeExists = false }: Props) {
  const content = (
    <>
      <div className={styles.imageWrapper}>
        <Image 
          src={product.image} 
          alt={product.altText} 
          fill 
          sizes="(max-width: 768px) 50vw, 25vw"
          className={styles.productImage} 
        />
        {!product.available && <span className={styles.outOfStock}>OUT OF STOCK</span>}
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productPrice}>
          {product.currency} {product.price.toFixed(2)} <span className={styles.demoNote}>(Demo)</span>
        </p>
      </div>
    </>
  );

  if (routeExists) {
    return (
      <Link href={`/products/${product.slug}`} className={styles.productCard}>
        {content}
      </Link>
    );
  }

  return (
    <div className={styles.productCard}>
      {content}
    </div>
  );
}
