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
  isDemoPrice?: boolean;
  available: boolean;
}

interface Props {
  product: Product;
  routeExists?: boolean;
}

const PRODUCT_PANEL_BACKGROUNDS: Record<string, string> = {
  'draft_beige_wide_leg_joggers': '#adacb3',
  'beige-wide-leg-joggers': '#adacb3',
  'draft_indigo_drape_jeans': '#c2bebc',
  'classic-indigo-drape-jeans': '#c2bebc',
  'draft_cocoa_skater_denim': '#bdb5b1',
  '90s-retro-cocoa-skater-denim': '#bdb5b1',
  'draft_brown_pinstripe_flared_pants': '#aeafb2',
  'brown-pinstripe-flared-pants': '#aeafb2',
  'draft_grey_pinstripe_flared_pants': '#c6c5c5',
  'grey-pinstripe-flared-pants': '#c6c5c5',
  'draft_grey_wide_leg_joggers': '#a7a7ad',
  'grey-wide-leg-joggers': '#a7a7ad',
  'draft_white_pinstripe_flared_pants': '#cfcac5',
  'white-pinstripe-flared-pants': '#cfcac5',
};

export default function ProductCard({ product, routeExists = false }: Props) {
  const panelBg = PRODUCT_PANEL_BACKGROUNDS[product.id] || PRODUCT_PANEL_BACKGROUNDS[product.slug] || '#111';
  const content = (
    <>
      <div className={styles.imageWrapper} style={{ backgroundColor: panelBg }}>
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
          {product.currency === 'INR'
            ? `₹${product.price.toLocaleString('en-IN')}`
            : `$${product.price.toFixed(2)} USD`
          }{' '}
          {(product as any).isDemoPrice !== false && <span className={styles.demoNote}>(Demo)</span>}
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
