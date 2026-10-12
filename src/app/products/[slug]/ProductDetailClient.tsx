'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant, catalog } from '@/app/data/products';
import ProductCardWithColor from '@/app/ProductCardWithColor';
import { useCart } from '@/app/context/CartContext';
import { useMenu } from '@/app/context/MenuContext';
import styles from './ProductDetail.module.css';

interface Props {
  product: Product;
  initialColor?: string;
  relatedProducts?: Product[];
}

export default function ProductDetailClient({ product, initialColor, relatedProducts: propRelated }: Props) {
  const { items, addToCart, totalQuantity, isMounted, openCart } = useCart();
  const { isMenuOpen, openMenu, closeMenu } = useMenu();

  const startingVariant = 
    product.variants.find(v => v.name.toLowerCase() === initialColor?.toLowerCase()) 
    || product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(startingVariant);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('1');
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [sizeError, setSizeError] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Variant & size stock calculations
  const allSizesUnavailable = selectedVariant.sizes.every(s => !s.available);
  const selectedSizeInfo = selectedVariant.sizes.find(s => s.size === selectedSize);
  const isSelectedSizeAvailable = selectedSize ? Boolean(selectedSizeInfo?.available) : true;

  const matchingCartItem = selectedSize
    ? items.find(
        i => i.productId === product.id && 
             i.variantName === selectedVariant.name && 
             i.size === selectedSize
      )
    : undefined;
  const inCartQty = matchingCartItem ? matchingCartItem.quantity : 0;
  const MAX_ITEM_STOCK = 10;
  const availableStock = allSizesUnavailable || (selectedSize && !isSelectedSizeAvailable)
    ? 0
    : Math.max(0, MAX_ITEM_STOCK - inCartQty);

  useEffect(() => {
    if (selectedSize) {
      const sizeInfo = selectedVariant.sizes.find(s => s.size === selectedSize);
      if (!sizeInfo || !sizeInfo.available) {
        setSelectedSize('');
      }
    }
  }, [selectedVariant, selectedSize]);

  const focusedQuantityRef = useRef<number>(1);
  const isEscapingRef = useRef<boolean>(false);

  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock);
      setInputValue(availableStock.toString());
      focusedQuantityRef.current = availableStock;
    } else if (availableStock === 0 && quantity !== 1) {
      setQuantity(1);
      setInputValue('1');
      focusedQuantityRef.current = 1;
    }
  }, [availableStock, quantity]);

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedSize(''); // Require valid size selection for new variant
    setQuantity(1);      // Reset quantity
    setInputValue('1');
    focusedQuantityRef.current = 1;
    setSizeError(false);
    setAddedSuccess(false);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const next = quantity - 1;
      setQuantity(next);
      setInputValue(next.toString());
      focusedQuantityRef.current = next;
    }
  };

  const handleIncrement = () => {
    if (availableStock > 0 && quantity < availableStock) {
      const next = quantity + 1;
      setQuantity(next);
      setInputValue(next.toString());
      focusedQuantityRef.current = next;
    }
  };

  const commitInput = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1) {
      setInputValue(quantity.toString());
    } else if (availableStock > 0 && parsed > availableStock) {
      setQuantity(availableStock);
      setInputValue(availableStock.toString());
      focusedQuantityRef.current = availableStock;
    } else if (availableStock === 0) {
      setQuantity(1);
      setInputValue('1');
      focusedQuantityRef.current = 1;
    } else {
      setQuantity(parsed);
      setInputValue(parsed.toString());
      focusedQuantityRef.current = parsed;
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isEscapingRef.current = false;
    focusedQuantityRef.current = quantity;
    e.target.select();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (isEscapingRef.current) {
      isEscapingRef.current = false;
      return;
    }
    commitInput(inputValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput(inputValue);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isEscapingRef.current = true;
      const restored = focusedQuantityRef.current;
      setInputValue(restored.toString());
      setQuantity(restored);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    if (availableStock <= 0) {
      return;
    }

    const parsedInput = parseInt(inputValue, 10);
    let effectiveQty = quantity;
    if (!isNaN(parsedInput) && parsedInput >= 1) {
      effectiveQty = Math.min(parsedInput, availableStock);
    }
    const qtyToAdd = Math.min(effectiveQty, availableStock);
    if (qtyToAdd <= 0) return;

    addToCart({
      productId: product.id,
      variantName: selectedVariant.name,
      size: selectedSize,
      quantity: qtyToAdd
    });

    setQuantity(1);
    setInputValue('1');
    focusedQuantityRef.current = 1;

    setAddedSuccess(true);
    setSizeError(false);
  };

  let stockMessage: string | null = null;
  if (allSizesUnavailable) {
    stockMessage = 'Out of stock';
  } else if (selectedSize && !isSelectedSizeAvailable) {
    stockMessage = 'Selected size is out of stock';
  } else if (selectedSize && inCartQty >= MAX_ITEM_STOCK) {
    stockMessage = `Max stock reached (${MAX_ITEM_STOCK} in cart)`;
  }

  // Find related products (exclude current)
  const relatedProducts = propRelated || catalog.filter(p => p.id !== product.id).slice(0, 4);

  let categoryName = (product as any).category ? (product as any).category.toUpperCase() : 'MENSWEAR';
  if (!(product as any).category) {
    if (product.id.startsWith('c')) categoryName = 'BASICS';
    if (product.id.startsWith('f')) categoryName = 'FORMAL';
    if (product.id.startsWith('x')) categoryName = 'LUXURY';
  }

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => prev === id ? null : id);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Minimal Header */}
      <header className={styles.minimalHeader}>
        {/* Menu Toggle Pill */}
        <button 
          className={styles.menuToggle}
          onClick={isMenuOpen ? closeMenu : openMenu}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <div className={styles.hamburgerIcon}>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </div>
          <span className={styles.menuLabel}>MENU</span>
        </button>

        {/* Centered Logo */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}><Image src="/downfall-black-red-transparent.png" alt="DOWNFALL" width={110} height={60} style={{ objectFit: 'contain' }} /></Link>
        </div>

        {/* Cart Toggle Pill */}
        <button onClick={openCart} className={styles.cartToggle} aria-label={`View Cart, ${totalQuantity} items`}>
          <div className={styles.cartIcon}>
            <svg width="18" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5V3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3V5M2 5H14L14.75 16.5C14.8 16.7 14.6 17 14.3 17H1.7C1.4 17 1.2 16.7 1.25 16.5L2 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isMounted && totalQuantity > 0 && (
              <span className={styles.cartBadge}>{totalQuantity}</span>
            )}
          </div>
          <span className={styles.menuLabel}>CART</span>
        </button>
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
              {product.currency} {product.price.toFixed(2)} <span className={styles.demoNote}>(Demo)</span>
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
                    onClick={() => handleVariantChange(variant)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.selectionGroup}>
              <div className={styles.sizeHeader}>
                <h2 className={styles.selectionLabel}>SELECT SIZE</h2>
                {sizeError && <span className={styles.errorText}>Please select a size first</span>}
              </div>
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
                      onClick={() => {
                        setSelectedSize(sizeObj.size);
                        setSizeError(false);
                        setAddedSuccess(false);
                      }}
                    >
                      {sizeObj.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className={styles.selectionGroup}>
              <label htmlFor="quantity-input" className={styles.selectionLabel}>
                QUANTITY
              </label>
              <div className={styles.quantityRow}>
                <div className={styles.quantityControl}>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || availableStock <= 0}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="quantity-input"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    max={availableStock > 0 ? availableStock : 1}
                    value={inputValue}
                    onFocus={handleInputFocus}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    disabled={availableStock <= 0}
                    className={styles.quantityInput}
                    aria-label="Product quantity"
                  />
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={handleIncrement}
                    disabled={quantity >= availableStock || availableStock <= 0}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {stockMessage && (
                  <span className={styles.stockNotice}>{stockMessage}</span>
                )}
              </div>
            </div>

            {/* Purchase Buttons */}
            <div className={styles.purchaseActions}>
              <div className={styles.purchaseButtonsRow}>
                <button 
                  type="button"
                  className={styles.addToCartButton} 
                  onClick={handleAddToCart}
                  disabled={allSizesUnavailable || (selectedSize ? !isSelectedSizeAvailable || availableStock <= 0 : false)}
                >
                  {allSizesUnavailable || (selectedSize && !isSelectedSizeAvailable)
                    ? 'OUT OF STOCK'
                    : selectedSize && availableStock <= 0
                    ? 'MAX IN CART'
                    : 'ADD TO CART'}
                </button>

                <div className={styles.buyNowWrapper}>
                  <button
                    type="button"
                    className={styles.buyNowButton}
                    disabled
                    aria-disabled="true"
                    title="Checkout is not available yet"
                  >
                    BUY IT NOW
                  </button>
                  <span className={styles.checkoutNotice}>Checkout is not available yet</span>
                </div>
              </div>
            </div>

            {addedSuccess && (
              <div className={styles.successMessage} role="status">
                Added {quantity} {quantity === 1 ? 'item' : 'items'} to your bag. <button onClick={openCart} className={styles.viewBagLink}>View Bag</button>
              </div>
            )}

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
