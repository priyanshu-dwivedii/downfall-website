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

const CATEGORIES = [
  { id: 'all', label: 'ALL', href: '/collections/all' },
  { id: 'basics', label: 'BASICS', href: '/collections/basics' },
  { id: 'formal', label: 'FORMAL', href: '/collections/formal' },
  { id: 'luxury', label: 'LUXURY', href: '/collections/luxury' },
  { id: 'bottomwear', label: 'BOTTOMWEAR', href: '/collections/bottomwear' },
];

export default function CollectionClient({ slug, title, description, products }: CollectionClientProps) {
  const [sortParam, setSortParam] = useState('featured');
  
  const sortedProducts = [...products].sort((a, b) => {
    if (sortParam === 'price-asc') return a.price - b.price;
    if (sortParam === 'price-desc') return b.price - a.price;
    return 0;
  });

  const currentSlug = slug.toLowerCase();
  
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
            <nav className={styles.categoryPills} aria-label="Collection categories">
              {CATEGORIES.map(cat => {
                const isSelected = currentSlug === cat.id;
                return (
                  <Link 
                    key={cat.id} 
                    href={cat.href} 
                    className={`${styles.pill} ${isSelected ? styles.active : ''}`}
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </nav>

            {sortedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', color: '#666' }}>
                <p style={{ fontSize: '18px', marginBottom: '16px', color: '#111' }}>
                  No garments currently available in this edit.
                </p>
                <Link href="/collections/bottomwear" style={{ textDecoration: 'underline', color: '#111' }}>
                  Explore the Bottomwear Atelier &rarr;
                </Link>
              </div>
            ) : (
              <div className={styles.grid}>
                {sortedProducts.map((product) => (
                  <ProductCardWithColor key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
