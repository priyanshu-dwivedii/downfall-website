'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ProductCardWithColor.module.css';
import { Product } from '@/app/data/products';

interface Props {
  product: Product;
}

import Link from 'next/link';

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

export default function ProductCardWithColor({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  // Determine Out of Stock
  const allSizesUnavailable = product.variants.every(v => v.sizes.every(s => !s.available));
  const isOutOfStock = allSizesUnavailable;
  
  // Determine Bestseller
  const isBestseller = product.id.startsWith('p');
  
  // Category heuristic based on id or description
  let category = (product as any).category ? (product as any).category.toUpperCase() : 'DOWNFALL APPAREL';
  if (!(product as any).category) {
    if (product.id.startsWith('c')) category = 'BASICS';
    if (product.id.startsWith('f')) category = 'FORMAL';
    if (product.id.startsWith('x')) category = 'LUXURY';
  }

  const isDemo = (product as any).isDemoPrice !== undefined ? Boolean((product as any).isDemoPrice) : true;
  const productUrl = `/products/${product.slug}?color=${encodeURIComponent(selectedVariant.name)}`;
  const panelBg = PRODUCT_PANEL_BACKGROUNDS[product.id] || PRODUCT_PANEL_BACKGROUNDS[product.slug] || '#f5f5f5';

  return (
    <div className={styles.productCard}>
      <Link href={productUrl} className={styles.imageWrapper} style={{ backgroundColor: panelBg }}>
        <Image 
          src={selectedVariant.image} 
          alt={`${product.name} in ${selectedVariant.name}`} 
          fill 
          sizes="(max-width: 768px) 100vw, 33vw"
          className={styles.productImage} 
        />
        {isOutOfStock && <span className={styles.badgeOut}>OUT OF STOCK</span>}
        {!isOutOfStock && isBestseller && <span className={styles.badgeBest}>BESTSELLER</span>}
      </Link>
      
      <div className={styles.productInfo}>
        <div className={styles.titleRow}>
          <div>
            <Link href={productUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 className={styles.productName}>{product.name}</h3>
            </Link>
            <p className={styles.productCategory}>{category}</p>
          </div>
          <p className={styles.productPrice}>
            {product.currency === 'INR'
              ? `₹${product.price.toLocaleString('en-IN')}`
              : `$${product.price.toFixed(2)} USD`
            }{' '}
            {isDemo && <span className={styles.demoNote}>(Demo)</span>}
          </p>
        </div>
        
        <div className={styles.colorSelection}>
          <span className={styles.selectedColorName}>{selectedVariant.name}</span>
          <div className={styles.swatchContainer}>
            {product.variants.map(variant => (
              <button
                key={variant.name}
                type="button"
                className={`${styles.swatch} ${variant.name === selectedVariant.name ? styles.selected : ''}`}
                style={{ backgroundColor: variant.hex }}
                aria-label={`Select ${variant.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariant(variant);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
