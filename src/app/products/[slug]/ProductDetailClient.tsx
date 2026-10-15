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
  const [selectedSize, setSelectedSize] = useState<string>(
    startingVariant?.sizes?.length === 1 ? startingVariant.sizes[0].size : ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('1');
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [sizeError, setSizeError] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Multi-image gallery with original aspect ratio preservation
  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : [selectedVariant.image];
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Custom measurements state
  const isCustomMeasurementsProduct = Boolean(
    selectedSize === 'Custom measurements' ||
    (product as any).measurements?.length > 0 ||
    (selectedVariant?.sizes?.length === 1 && selectedVariant.sizes[0].size === 'Custom measurements')
  );
  const [customUnit, setCustomUnit] = useState<'in' | 'cm'>('in');
  const [waistMeasurement, setWaistMeasurement] = useState<string>(''); // Kept blank initially
  const [outseamMeasurement, setOutseamMeasurement] = useState<string>(''); // Kept blank; customer values remain blank by default
  const [measurementError, setMeasurementError] = useState<string | null>(null);

  const isMadeToOrder = product.fulfilment ? product.fulfilment === 'made_to_order' : Boolean(product.isMadeToOrder);

  // Variant & size stock calculations
  const allSizesUnavailable = !isMadeToOrder && Boolean(selectedVariant?.sizes?.length) && selectedVariant.sizes.every(s => !s.available);
  const selectedSizeInfo = selectedVariant?.sizes?.find(s => s.size === selectedSize);
  const isSelectedSizeAvailable = selectedSize ? (isMadeToOrder ? true : Boolean(selectedSizeInfo?.available)) : true;

  const matchingCartItem = selectedSize
    ? items.find(
        i => i.productId === product.id && 
             i.variantName === selectedVariant?.name && 
             i.size === selectedSize
      )
    : undefined;
  const inCartQty = matchingCartItem ? matchingCartItem.quantity : 0;
  const MAX_ITEM_STOCK = 10;
  const availableStock = allSizesUnavailable || (selectedSize && !isSelectedSizeAvailable)
    ? 0
    : isMadeToOrder
      ? Infinity
      : Math.max(0, (selectedSizeInfo?.stock ?? MAX_ITEM_STOCK) - inCartQty);

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
    const defaultSize = variant.sizes.length === 1 ? variant.sizes[0].size : '';
    setSelectedSize(defaultSize);
    setQuantity(1);      // Reset quantity
    setInputValue('1');
    focusedQuantityRef.current = 1;
    setSizeError(false);
    setMeasurementError(null);
    setAddedSuccess(false);

    if (product.images && product.images.length > 0) {
      const imgIdx = product.images.indexOf(variant.image);
      if (imgIdx >= 0) {
        setActiveImageIndex(imgIdx);
      }
    }
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
    if (availableStock === Infinity || (availableStock > 0 && quantity < availableStock)) {
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
    } else if (availableStock !== Infinity && availableStock > 0 && parsed > availableStock) {
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
    if (selectedVariant.sizes && selectedVariant.sizes.length === 0) {
      return;
    }

    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    if (availableStock <= 0) {
      return;
    }

    if (isCustomMeasurementsProduct) {
      if (!waistMeasurement.trim() || !outseamMeasurement.trim()) {
        setMeasurementError('Please enter both waist circumference and requested garment outseam before adding to bag.');
        return;
      }
      const numWaist = parseFloat(waistMeasurement.trim());
      const numOutseam = parseFloat(outseamMeasurement.trim());
      if (isNaN(numWaist) || numWaist <= 0 || isNaN(numOutseam) || numOutseam <= 0) {
        setMeasurementError('Please enter valid positive numbers for both waist circumference and requested garment outseam.');
        return;
      }
    }

    const parsedInput = parseInt(inputValue, 10);
    let effectiveQty = quantity;
    if (!isNaN(parsedInput) && parsedInput >= 1) {
      effectiveQty = availableStock !== Infinity ? Math.min(parsedInput, availableStock) : parsedInput;
    }
    const qtyToAdd = availableStock !== Infinity ? Math.min(effectiveQty, availableStock) : effectiveQty;
    if (qtyToAdd <= 0) return;

    addToCart({
      productId: product.id,
      variantName: selectedVariant.name,
      size: selectedSize,
      quantity: qtyToAdd,
      customMeasurements: isCustomMeasurementsProduct
        ? {
            waist: waistMeasurement.trim(),
            outseam: outseamMeasurement.trim(),
            unit: customUnit,
          }
        : undefined,
    });

    setQuantity(1);
    setInputValue('1');
    focusedQuantityRef.current = 1;

    setAddedSuccess(true);
    setSizeError(false);
    setMeasurementError(null);
  };

  let stockMessage: string | null = null;
  if (isMadeToOrder) {
    stockMessage = null;
  } else if (allSizesUnavailable) {
    stockMessage = 'Out of stock';
  } else if (selectedSize && !isSelectedSizeAvailable) {
    stockMessage = 'Selected size is out of stock';
  } else if (selectedSize && availableStock !== Infinity && inCartQty >= (selectedSizeInfo?.stock ?? MAX_ITEM_STOCK)) {
    stockMessage = `Max stock reached (${inCartQty} in cart)`;
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
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
        <button onClick={openCart} className={styles.cartToggle} aria-label="Open cart">
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
              {galleryImages.map((imgSrc, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button 
                    key={idx}
                    type="button"
                    className={`${styles.thumbnailButton} ${isActive ? styles.activeThumbnail : ''}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`View image ${idx + 1} of ${product.name}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <Image 
                      src={imgSrc} 
                      alt={`Thumbnail ${idx + 1} of ${product.name}`} 
                      fill 
                      sizes="80px"
                      className={styles.thumbnailImage} 
                    />
                  </button>
                );
              })}
            </div>
            
            <div className={styles.mainImagePanel}>
              <div className={styles.imageWrapper}>
                <Image 
                  src={galleryImages[activeImageIndex] || selectedVariant.image} 
                  alt={`${product.name} - View ${activeImageIndex + 1}`} 
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
            {(product as any).imageCorrectionRequired && (
              <div 
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #d48806',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#ad6800',
                  lineHeight: 1.5,
                  fontWeight: 400,
                }}
                role="alert"
                aria-label="Image correction flag"
              >
                ⚠️ IMAGES FLAGGED FOR CORRECTION: Supplied gallery photos show black drawstring ends. The client confirms the garment features an elastic waistband with a grey drawstring with no black tips or sections. Original images are kept intact and must not be published.
              </div>
            )}
            <p className={styles.categoryLabel}>{categoryName}</p>
            <h1 className={styles.productName}>{product.name}</h1>
            <p className={styles.productPrice}>
              {product.currency === 'INR'
                ? `₹${product.price.toLocaleString('en-IN')}`
                : `$${product.price.toFixed(2)} USD`
              }{' '}
              {(product as any).isDemoPrice !== false && <span className={styles.demoNote}>(Demo)</span>}
              {isMadeToOrder && (
                <span className={styles.demoNote} style={{ marginLeft: '6px', color: '#8b5e34', borderColor: '#8b5e34' }}>
                  Made to Order
                </span>
              )}
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
                {selectedVariant.sizes && selectedVariant.sizes.length > 0 ? (
                  selectedVariant.sizes.map(sizeObj => {
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
                  })
                ) : (
                  <p style={{ fontSize: '13px', color: '#666666', margin: 0, fontStyle: 'italic', fontWeight: 400 }}>
                    Commercial sizing options and specifications pending confirmation.
                  </p>
                )}
              </div>
            </div>

            {/* Custom Measurements Fields */}
            {isCustomMeasurementsProduct && (
              <div className={styles.selectionGroup}>
                <div style={{
                  border: '1px solid #111111',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      CUSTOM MEASUREMENTS
                    </span>
                    <div style={{ display: 'inline-flex', border: '1px solid #111111' }}>
                      <button
                        type="button"
                        onClick={() => setCustomUnit('in')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 400,
                          backgroundColor: customUnit === 'in' ? '#111111' : '#ffffff',
                          color: customUnit === 'in' ? '#ffffff' : '#111111',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        aria-pressed={customUnit === 'in'}
                      >
                        IN (Inches)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomUnit('cm')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 400,
                          backgroundColor: customUnit === 'cm' ? '#111111' : '#ffffff',
                          color: customUnit === 'cm' ? '#ffffff' : '#111111',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        aria-pressed={customUnit === 'cm'}
                      >
                        CM (Centimetres)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label htmlFor="waist-circ-input" style={{ display: 'block', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Waist circumference ({customUnit}) *
                      </label>
                      <input
                        id="waist-circ-input"
                        type="text"
                        value={waistMeasurement}
                        onChange={(e) => {
                          setWaistMeasurement(e.target.value);
                          setMeasurementError(null);
                        }}
                        placeholder={customUnit === 'in' ? 'e.g. 32' : 'e.g. 81'}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '13px',
                          fontWeight: 400,
                          border: measurementError && !waistMeasurement.trim() ? '1px solid #c00' : '1px solid #111111',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box',
                        }}
                        aria-label={`Waist circumference in ${customUnit}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="outseam-input" style={{ display: 'block', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Requested garment outseam ({customUnit}) *
                      </label>
                      <input
                        id="outseam-input"
                        type="text"
                        value={outseamMeasurement}
                        onChange={(e) => {
                          setOutseamMeasurement(e.target.value);
                          setMeasurementError(null);
                        }}
                        placeholder={customUnit === 'in' ? 'e.g. 42' : 'e.g. 106'}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '13px',
                          fontWeight: 400,
                          border: measurementError && !outseamMeasurement.trim() ? '1px solid #c00' : '1px solid #111111',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box',
                        }}
                        aria-label={`Requested garment outseam in ${customUnit}`}
                      />
                    </div>
                  </div>

                  {((product as any).referenceNote || (
                    product.description && (product.description.includes('47 inches') || product.description.includes("6'4\""))
                      ? "47 inches outseam is a reference garment specification modeled at 6'4\", not a default. Please specify your desired garment outseam. Customer values remain blank by default."
                      : "Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."
                  )) && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#555555', lineHeight: 1.4 }}>
                      <strong>Reference Note:</strong> {(product as any).referenceNote || (
                        product.description && (product.description.includes('47 inches') || product.description.includes("6'4\""))
                          ? "47 inches outseam is a reference garment specification modeled at 6'4\", not a default. Please specify your desired garment outseam. Customer values remain blank by default."
                          : "Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."
                      )}
                    </p>
                  )}

                  {measurementError && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#c00000', fontWeight: 400 }} role="alert">
                      {measurementError}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                    max={availableStock !== Infinity && availableStock > 0 ? availableStock : undefined}
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
                    disabled={availableStock !== Infinity && (quantity >= availableStock || availableStock <= 0)}
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
                  disabled={
                    Boolean(selectedVariant.sizes && selectedVariant.sizes.length === 0) ||
                    allSizesUnavailable ||
                    (selectedSize ? !isSelectedSizeAvailable || availableStock <= 0 : false)
                  }
                >
                  {selectedVariant.sizes && selectedVariant.sizes.length === 0
                    ? 'SIZING PENDING'
                    : allSizesUnavailable || (selectedSize && !isSelectedSizeAvailable)
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
              
              {Boolean(product.careInstructions && product.careInstructions.trim()) && (
                <div className={styles.accordionItem}>
                  <button 
                    className={styles.accordionHeader} 
                    onClick={() => toggleAccordion('care')}
                    aria-expanded={openAccordion === 'care'}
                  >
                    CARE INSTRUCTIONS
                    <span className={styles.accordionIcon}>{openAccordion === 'care' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'care' && (
                    <div className={styles.accordionContent}>
                      <p>{product.careInstructions}</p>
                    </div>
                  )}
                </div>
              )}

              {Boolean(product.productionTime && product.productionTime.trim()) && (
                <div className={styles.accordionItem}>
                  <button 
                    className={styles.accordionHeader} 
                    onClick={() => toggleAccordion('production')}
                    aria-expanded={openAccordion === 'production'}
                  >
                    PRODUCTION & FULFILMENT
                    <span className={styles.accordionIcon}>{openAccordion === 'production' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'production' && (
                    <div className={styles.accordionContent}>
                      <p>{product.productionTime}</p>
                    </div>
                  )}
                </div>
              )}

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
