'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/app/data/products';
import ProductCardWithColor from '@/app/ProductCardWithColor';
import CollectionHeader from './CollectionHeader';
import styles from './collectionClient.module.css';

interface CollectionClientProps {
  slug: string;
  title: string;
  description: string;
  products: Product[];
}

export default function CollectionClient({ slug, title, description, products }: CollectionClientProps) {
  const [sortParam, setSortParam] = useState('featured');
  
  const sortedProducts = [...products].sort((a, b) => {
    if (sortParam === 'price-asc') return a.price - b.price;
    if (sortParam === 'price-desc') return b.price - a.price;
    return 0;
  });
  
  return (
    <div className={styles.pageWrapper}>
      <CollectionHeader />
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSticky}>
              <h1 className={styles.collectionTitle}>{title}</h1>
              <p className={styles.collectionDesc}>{description}</p>
              
              <div className={styles.controls}>
                <div className={styles.categoryPills}>
                  <Link href="/collections/all" className={`${styles.pill} ${slug === 'all' ? styles.active : ''}`}>All</Link>
                  <Link href="/collections/basics" className={`${styles.pill} ${slug === 'basics' ? styles.active : ''}`}>Basics</Link>
                  <Link href="/collections/formal" className={`${styles.pill} ${slug === 'formal' ? styles.active : ''}`}>Formal</Link>
                  <Link href="/collections/luxury" className={`${styles.pill} ${slug === 'luxury' ? styles.active : ''}`}>Luxury</Link>
                </div>
                
                <div className={styles.sortWrapper}>
                  <label htmlFor="sort" className={styles.sortLabel}>Sort By</label>
                  <div className={styles.selectWrapper}>
                    <select 
                      id="sort" 
                      className={styles.sortSelect}
                      value={sortParam}
                      onChange={(e) => setSortParam(e.target.value)}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          
          <main className={styles.mainContent}>
            <div className={styles.grid}>
              {sortedProducts.map(product => (
                <ProductCardWithColor key={product.id} product={product} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
