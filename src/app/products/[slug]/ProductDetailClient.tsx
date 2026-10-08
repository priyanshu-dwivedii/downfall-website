'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant, catalog } from '@/app/data/products';
import ProductCardWithColor from '@/app/ProductCardWithColor';
import styles from './ProductDetail.module.css';

interface Props {
  product: Product;
  initialColor?: string;
}

export default function ProductDetailClient({ product, initialColor }: Props) {
  const startingVariant = 
    product.variants.find(v => v.name.toLowerCase() === initialColor?.toLowerCase()) 
    || product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(startingVariant);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');

  useEffect(() => {
    if (selectedSize) {
      const sizeInfo = selectedVariant.sizes.find(s => s.size === selectedSize);
      if (!sizeInfo || !sizeInfo.available) {
        setSelectedSize('');
      }
    }
  }, [selectedVariant, selectedSize]);

  // Find related products (exclude current)
  const relatedProducts = catalog.filter(p => p.id !== product.id).slice(0, 4);

  let categoryName = 'MENSWEAR';
  if (product.id.startsWith('c')) categoryName = 'BASICS';
  if (product.id.startsWith('f')) categoryName = 'FORMAL';
  if (product.id.startsWith('x')) categoryName = 'LUXURY';

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => prev === id ? null : id);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Minimal Header */}
      <header className={styles.minimalHeader}>
        <Link href="/" className={styles.logoLink}>DOWNFALL</Link>
        <div className={styles.headerRight}>
          <Link href="/collections/all" className={styles.headerLink}>COLLECTION</Link>
          <button className={styles.bagButton} disabled aria-disabled="true">BAG (0)</button>
        </div>
      </header>

      <main className={styles.productMain}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">HOME</Link>
          <span>/</span>
          <Link href={`/collections/${categoryName.toLowerCase()}`}>{categoryName}</Link>
          <span>/</span>
          <span className={styles.currentCrumb}>{product.name}</span>
        </nav>

        <div className={styles.container}>
          {/* Gallery Left */}
          <div className={styles.galleryContainer}>
            <div className={styles.thumbnailList} role="tablist" aria-label="Product image gallery">
              <button 
                className={`${styles.thumbnailButton} ${styles.activeThumbnail}`}
                role="tab"
                aria-selected="true"
                aria-label={`View image 1 of ${product.name}`}
              >
                <Image 
                  src={selectedVariant.image} 
                  alt={`Thumbnail 1 of ${product.name} in ${selectedVariant.name}`} 
                  fill 
                  sizes="80px"
                  className={styles.thumbnailImage} 
                />
              </button>
            </div>
            
            <div className={styles.mainImagePanel}>
              <div className={styles.imageWrapper}>
                <Image 
                  src={selectedVariant.image} 
                  alt={`${product.name} in ${selectedVariant.name}`} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className={styles.productImage} 
                  priority
                />
              </div>
            </div>
          </div>

          {/* Details Right */}
          <div className={styles.details}>
            <p className={styles.categoryLabel}>{categoryName}</p>
            <h1 className={styles.productName}>{product.name}</h1>
            <p className={styles.productPrice}>
              ₹{(product.price * 83).toLocaleString('en-IN')}
            </p>
            
            <p className={styles.productDescription}>{product.description}</p>

            <div className={styles.selectionGroup}>
              <h2 className={styles.selectionLabel}>
                COLOR: <span className={styles.selectedValue}>{selectedVariant.name}</span>
              </h2>
              <div className={styles.swatchContainer}>
                {product.variants.map(variant => (
                  <button
                    key={variant.name}
                    type="button"
                    className={`${styles.swatch} ${variant.name === selectedVariant.name ? styles.selectedSwatch : ''}`}
                    style={{ backgroundColor: variant.hex }}
                    aria-label={`Select color ${variant.name}`}
                    aria-pressed={variant.name === selectedVariant.name}
                    onClick={() => setSelectedVariant(variant)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.selectionGroup}>
              <h2 className={styles.selectionLabel}>SELECT SIZE</h2>
              <div className={styles.sizeContainer}>
                {selectedVariant.sizes.map(sizeObj => {
                  const isSelected = selectedSize === sizeObj.size;
                  return (
                    <button
                      key={sizeObj.size}
                      type="button"
                      disabled={!sizeObj.available}
                      className={`
                        ${styles.sizeButton} 
                        ${isSelected ? styles.selectedSize : ''} 
                        ${!sizeObj.available ? styles.disabledSize : ''}
                      `}
                      aria-label={`Select size ${sizeObj.size}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSize(sizeObj.size)}
                    >
                      {sizeObj.size}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className={styles.addToBagButton} disabled aria-disabled="true">
              ADD TO BAG
            </button>

            {/* Accordions */}
            <div className={styles.accordionContainer}>
              <div className={styles.accordionItem}>
                <button 
                  className={styles.accordionHeader} 
                  onClick={() => toggleAccordion('description')}
                  aria-expanded={openAccordion === 'description'}
                >
                  DESCRIPTION & DETAILS
                  <span className={styles.accordionIcon}>{openAccordion === 'description' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'description' && (
                  <div className={styles.accordionContent}>
                    <p>{product.description}</p>
                  </div>
                )}
              </div>
              
              <div className={styles.accordionItem}>
                <button 
                  className={styles.accordionHeader} 
                  onClick={() => toggleAccordion('material')}
                  aria-expanded={openAccordion === 'material'}
                >
                  MATERIAL & CARE
                  <span className={styles.accordionIcon}>{openAccordion === 'material' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'material' && (
                  <div className={styles.accordionContent}>
                    <p>Refer to garment label for specific material and care instructions.</p>
                  </div>
                )}
              </div>

              <div className={styles.accordionItem}>
                <button 
                  className={styles.accordionHeader} 
                  onClick={() => toggleAccordion('shipping')}
                  aria-expanded={openAccordion === 'shipping'}
                >
                  SHIPPING & RETURNS
                  <span className={styles.accordionIcon}>{openAccordion === 'shipping' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className={styles.accordionContent}>
                    <p>Standard shipping terms apply. Returns accepted within 14 days of delivery for unworn items with original tags attached.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <p className={styles.relatedSub}>CURATED SELECTION</p>
            <h2 className={styles.relatedTitle}>YOU MAY ALSO LIKE</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map(related => (
                <ProductCardWithColor key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
