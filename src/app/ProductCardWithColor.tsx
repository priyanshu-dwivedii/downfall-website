'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ProductCardWithColor.module.css';

export interface ColorVariant {
  name: string;
  image: string;
  hex: string;
}

export interface ProductWithColors {
  id: string;
  name: string;
  variants: ColorVariant[];
  price: number;
  currency: string;
}

interface Props {
  product: ProductWithColors;
}

export default function ProductCardWithColor({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  return (
    <div className={styles.productCard}>
      <div className={styles.imageWrapper}>
        <Image 
          src={selectedVariant.image} 
          alt={`${product.name} in ${selectedVariant.name}`} 
          fill 
          sizes="(max-width: 768px) 50vw, 25vw"
          className={styles.productImage} 
        />
      </div>
      
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productPrice}>
          {product.currency} {product.price.toFixed(2)} <span className={styles.demoNote}>(Demo)</span>
        </p>
        
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
                onClick={() => setSelectedVariant(variant)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
