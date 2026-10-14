'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { catalog } from '@/app/data/products';
import { buildWhatsAppUrl } from '@/config/whatsapp';
import CollectionHeader from '@/app/collections/CollectionHeader';
import styles from './checkout.module.css';

interface ItemPreference {
  requestedSize: string;
  fitPreference: string;
  itemNotes: string;
}

const FIT_OPTIONS = [
  'Regular / Standard Fit',
  'Slim / Tailored Fit',
  'Relaxed / Oversized Fit',
  'Custom Fitted to Measurements',
];

export default function CheckoutPage() {
  const { items, totalQuantity, subtotal, isMounted, getProduct, revalidateCart, formattedSubtotals, formattedSubtotalString, isMixedCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionAlert, setSubmissionAlert] = useState<string | null>(null);

  const hasAnyDemo = items.some((item) => {
    const product = getProduct(item.productId) || catalog.find((p) => p.id === item.productId);
    return (product as any)?.isDemoPrice !== false;
  });

  // Form State - strictly in React state, NOT stored in localStorage per instructions
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    customNotes: '',
    consent: false,
  });

  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in');
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    shoulder: '',
    height: '',
    length: '',
  });

  // Bespoke preferences per cart item
  const [itemPreferences, setItemPreferences] = useState<Record<string, ItemPreference>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Initialize item preferences based on current cart contents
  useEffect(() => {
    setItemPreferences((prev) => {
      const next: Record<string, ItemPreference> = { ...prev };
      items.forEach((item) => {
        if (!next[item.id]) {
          const defaultNotes = item.customMeasurements
            ? `Bespoke measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`
            : '';
          next[item.id] = {
            requestedSize: item.size,
            fitPreference: item.customMeasurements ? 'Custom Fitted to Measurements' : 'Regular / Standard Fit',
            itemNotes: defaultNotes,
          };
        }
      });
      return next;
    });
  }, [items]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleItemPrefChange = (itemId: string, field: keyof ItemPreference, value: string) => {
    setItemPreferences((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
    const errorKey = `item_${itemId}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const handleMeasurementChange = (field: keyof typeof measurements, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const phoneTrimmed = formData.phone.trim();
    const phoneDigits = phoneTrimmed.replace(/[^0-9]/g, '');
    const phoneValidPattern = /^[+]?[\d\s\-().]{7,25}$/.test(phoneTrimmed);

    if (!phoneTrimmed) {
      newErrors.phone = 'Please enter your phone number with country code.';
    } else if (!phoneValidPattern || phoneDigits.length < 7) {
      newErrors.phone = 'Please enter a valid phone number (minimum 7 digits).';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Please enter your delivery street address.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Please enter your city.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Please enter your state or province.';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Please enter your postal / ZIP code.';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Please select or enter your country.';
    }

    // Validate size for each item
    items.forEach((item) => {
      const pref = itemPreferences[item.id];
      if (!pref || !pref.requestedSize.trim()) {
        newErrors[`item_${item.id}_requestedSize`] = 'Please specify a requested size.';
      }
    });

    if (!formData.consent) {
      newErrors.consent = 'You must acknowledge that details will be shared via WhatsApp.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateWhatsAppMessage = (): string => {
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━━';
    const lines: string[] = [];

    lines.push('*DOWNFALL — BESPOKE COLLECTION ENQUIRY*');
    lines.push(divider);
    lines.push('');

    lines.push('*CLIENT DETAILS*');
    lines.push(`• Name: ${formData.fullName.trim()}`);
    lines.push(`• Phone: ${formData.phone.trim()}`);
    lines.push(`• Email: ${formData.email.trim() ? formData.email.trim() : 'Not provided'}`);
    lines.push('');

    lines.push('*DELIVERY ADDRESS*');
    lines.push(`• Address: ${formData.address.trim()}`);
    lines.push(`• City: ${formData.city.trim()}`);
    lines.push(`• State: ${formData.state.trim()}`);
    lines.push(`• Postal Code: ${formData.postalCode.trim()}`);
    lines.push(`• Country: ${formData.country.trim()}`);
    lines.push('');

    lines.push(`*ORDER ITEMS (${totalQuantity} piece${totalQuantity === 1 ? '' : 's'})*`);
    items.forEach((item, index) => {
      const product = getProduct(item.productId) || catalog.find((p) => p.id === item.productId);
      const pref = itemPreferences[item.id] || {
        requestedSize: item.size,
        fitPreference: 'Regular / Standard Fit',
        itemNotes: '',
      };
      const productName = product ? product.name : item.productId;
      const isMTO = (product as any)?.fulfilment ? (product as any).fulfilment === 'made_to_order' : Boolean((product as any)?.isMadeToOrder);
      const isDemo = (product as any)?.isDemoPrice !== undefined ? Boolean((product as any).isDemoPrice) : true;
      const currency = (product as any)?.currency || 'USD';
      const formattedUnitPrice = currency === 'INR'
        ? `₹${product ? product.price.toLocaleString('en-IN') : '0'} INR`
        : `$${product ? product.price.toFixed(2) : '0.00'} USD`;
      const unitPrice = product ? `${formattedUnitPrice}${isDemo ? ' (Demo)' : ''}` : 'N/A';

      lines.push(`${index + 1}. *${productName}*`);
      lines.push(`   • Fulfilment: ${isMTO ? 'Made to Order (Bespoke)' : 'Stocked'}`);
      lines.push(`   • Colour: ${item.variantName}`);
      lines.push(`   • Requested Size: ${pref.requestedSize}`);
      lines.push(`   • Fit Preference: ${pref.fitPreference}`);
      if (item.customMeasurements) {
        lines.push(`   • Custom Measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`);
      }
      lines.push(`   • Quantity: ${item.quantity}`);
      lines.push(`   • Est. Unit Price: ${unitPrice}`);
      if (pref.itemNotes.trim()) {
        lines.push(`   • Item Notes: ${pref.itemNotes.trim()}`);
      }
      lines.push('');
    });

    const hasAnyDemo = items.some((item) => {
      const product = getProduct(item.productId) || catalog.find((p) => p.id === item.productId);
      return (product as any)?.isDemoPrice !== false;
    });
    lines.push(hasAnyDemo ? '*ESTIMATED TOTAL (DEMO PRICING)*' : '*ESTIMATED TOTAL*');
    if (isMixedCart) {
      formattedSubtotals.forEach((fs) => {
        lines.push(`• ${fs.currency} Subtotal: ${fs.formatted}`);
      });
      lines.push(`• Combined Order: ${formattedSubtotalString}`);
      lines.push('_Notice: Mixed currency bag. Garments are priced and invoiced in their respective catalog currencies._');
    } else {
      lines.push(formattedSubtotalString);
    }
    if (hasAnyDemo) {
      lines.push('_Notice: Demo estimate only. Final bespoke pricing, fabric choices, and delivery schedule will be confirmed directly with DOWNFALL._');
    } else {
      lines.push('_Notice: Confirmed catalog pricing. Final bespoke customisation, measurements, and delivery schedule will be confirmed directly with DOWNFALL._');
    }
    lines.push('');

    // Check if any measurements were provided
    const hasMeasurements = Object.values(measurements).some((val) => val.trim().length > 0);
    lines.push(`*MEASUREMENTS (Unit: ${measurementUnit.toUpperCase()})*`);
    if (hasMeasurements) {
      if (measurements.chest.trim()) lines.push(`• Chest / Bust: ${measurements.chest.trim()} ${measurementUnit}`);
      if (measurements.waist.trim()) lines.push(`• Waist: ${measurements.waist.trim()} ${measurementUnit}`);
      if (measurements.hips.trim()) lines.push(`• Hips: ${measurements.hips.trim()} ${measurementUnit}`);
      if (measurements.shoulder.trim()) lines.push(`• Shoulder Width: ${measurements.shoulder.trim()} ${measurementUnit}`);
      if (measurements.height.trim()) lines.push(`• Height: ${measurements.height.trim()} ${measurementUnit}`);
      if (measurements.length.trim()) lines.push(`• Garment Length / Inseam: ${measurements.length.trim()} ${measurementUnit}`);
    } else {
      lines.push('• Standard sizing requested (No bespoke measurements provided)');
    }
    lines.push('');

    lines.push('*CUSTOMISATION & SPECIAL REQUESTS*');
    lines.push(formData.customNotes.trim() ? formData.customNotes.trim() : 'None provided');
    lines.push('');
    lines.push(divider);
    lines.push('_Sent via DOWNFALL Bespoke Enquiry Form_');

    return lines.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setSubmissionAlert(null);

    if (!validate()) {
      // Find first error and scroll into view
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Pre-submission server-side enquiry validation & live catalog revalidation
    setIsSubmitting(true);
    try {
      const validateRes = await fetch('/api/enquiry/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!validateRes.ok) {
        const validateData = await validateRes.json();
        const reasons =
          validateData.rejectedItems?.map((r: any) => r.reason).join(' ') ||
          validateData.error ||
          'Unpublished products cannot be ordered.';
        await revalidateCart();
        setSubmissionAlert(`Enquiry validation failed: ${reasons}`);
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        const freshCatalog = data.products || [];

        // Check each cart item against fresh catalog
        let hasAvailabilityIssue = false;
        const issues: string[] = [];

        for (const item of items) {
          const product = freshCatalog.find((p: any) => p.id === item.productId);
          if (!product || product.status !== 'published') {
            hasAvailabilityIssue = true;
            issues.push(`"${product?.name || item.productId}" is no longer available in the active collection.`);
            continue;
          }

          const variant = product.variants.find((v: any) => v.name === item.variantName);
          if (!variant) {
            hasAvailabilityIssue = true;
            issues.push(`Colour "${item.variantName}" of "${product.name}" is no longer available.`);
            continue;
          }

          const sizeInfo = variant.sizes.find((s: any) => s.size === item.size);
          const isItemMTO = (product as any)?.fulfilment ? (product as any).fulfilment === 'made_to_order' : Boolean((product as any)?.isMadeToOrder);
          if (!sizeInfo || !sizeInfo.available) {
            hasAvailabilityIssue = true;
            issues.push(`Size "${item.size}" of "${product.name}" is no longer available.`);
            continue;
          }

          // Only stocked products enforce inventory count <= 0 checks
          if (!isItemMTO && sizeInfo.stock !== undefined && sizeInfo.stock <= 0) {
            hasAvailabilityIssue = true;
            issues.push(`Size "${item.size}" of "${product.name}" is out of stock.`);
            continue;
          }
        }

        if (hasAvailabilityIssue) {
          await revalidateCart();
          setSubmissionAlert(
            `Catalog update: ${issues.join(' ')} Your bag has been refreshed. Please review your order details before proceeding.`
          );
          setIsSubmitting(false);
          return;
        }

        // Revalidate cart context to update latest prices
        await revalidateCart();
      }
    } catch (err) {
      console.warn('Pre-submission catalog revalidation warning:', err);
    } finally {
      setIsSubmitting(false);
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = buildWhatsAppUrl(message);

    // Open WhatsApp in new tab/window while preserving cart contents without displaying confirmed order status
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isMounted) return null;

  return (
    <div className={styles.pageWrapper}>
      <CollectionHeader />

      <main className={styles.container}>
        <div className={styles.headerSection}>
          <Link href="/cart" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Bag
          </Link>
          <h1 className={styles.pageTitle}>Bespoke Collection Enquiry</h1>
          <p className={styles.pageSubtitle}>
            Our atelier coordinates orders directly with clients. Complete this bespoke enquiry to discuss sizing, custom tailoring, and delivery with DOWNFALL on WhatsApp.
          </p>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyCard}>
            <h2 className={styles.emptyTitle}>Your Bag Is Empty</h2>
            <p className={styles.emptyText}>
              A non-empty cart is required to submit a bespoke collection enquiry. Please select items from our collections before proceeding.
            </p>
            <Link href="/collections/all" className={styles.exploreButton}>
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className={styles.layoutGrid}>
            {/* Form Column */}
            <form onSubmit={handleSubmit} noValidate className={styles.formColumn}>
              {/* Customer Contact Details */}
              <section className={styles.formCard} aria-labelledby="client-details-heading">
                <div className={styles.cardHeader}>
                  <h2 id="client-details-heading" className={styles.sectionTitle}>1. Client Details</h2>
                  <p className={styles.sectionSubtitle}>Please enter your contact information for this order enquiry.</p>
                </div>

                <div className={styles.fieldGroup} data-field="fullName">
                  <label htmlFor="fullName" className={styles.label}>
                    Full Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  />
                  {errors.fullName && (
                    <span id="fullName-error" className={styles.errorMessage} role="alert">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div className={styles.gridTwoCol}>
                  <div className={styles.fieldGroup} data-field="phone">
                    <label htmlFor="phone" className={styles.label}>
                      Phone Number <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone && (
                      <span id="phone-error" className={styles.errorMessage} role="alert">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className={styles.fieldGroup} data-field="email">
                    <label htmlFor="email" className={styles.label}>
                      Email <span className={styles.optionalTag}>(Optional)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="e.g. priya@example.com"
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <span id="email-error" className={styles.errorMessage} role="alert">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Delivery Address */}
              <section className={styles.formCard} aria-labelledby="delivery-heading">
                <div className={styles.cardHeader}>
                  <h2 id="delivery-heading" className={styles.sectionTitle}>2. Delivery Destination</h2>
                  <p className={styles.sectionSubtitle}>Where should your bespoke order be delivered upon completion?</p>
                </div>

                <div className={styles.fieldGroup} data-field="address">
                  <label htmlFor="address" className={styles.label}>
                    Delivery Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="House / Flat / Street address"
                    className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? 'address-error' : undefined}
                  />
                  {errors.address && (
                    <span id="address-error" className={styles.errorMessage} role="alert">
                      {errors.address}
                    </span>
                  )}
                </div>

                <div className={styles.gridTwoCol}>
                  <div className={styles.fieldGroup} data-field="city">
                    <label htmlFor="city" className={styles.label}>
                      City <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="e.g. Mumbai"
                      className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                    />
                    {errors.city && (
                      <span id="city-error" className={styles.errorMessage} role="alert">
                        {errors.city}
                      </span>
                    )}
                  </div>

                  <div className={styles.fieldGroup} data-field="state">
                    <label htmlFor="state" className={styles.label}>
                      State / Province <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="state"
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className={`${styles.input} ${errors.state ? styles.inputError : ''}`}
                      aria-invalid={!!errors.state}
                      aria-describedby={errors.state ? 'state-error' : undefined}
                    />
                    {errors.state && (
                      <span id="state-error" className={styles.errorMessage} role="alert">
                        {errors.state}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.gridTwoCol}>
                  <div className={styles.fieldGroup} data-field="postalCode">
                    <label htmlFor="postalCode" className={styles.label}>
                      Postal / ZIP Code <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                      placeholder="e.g. 400001"
                      className={`${styles.input} ${errors.postalCode ? styles.inputError : ''}`}
                      aria-invalid={!!errors.postalCode}
                      aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
                    />
                    {errors.postalCode && (
                      <span id="postalCode-error" className={styles.errorMessage} role="alert">
                        {errors.postalCode}
                      </span>
                    )}
                  </div>

                  <div className={styles.fieldGroup} data-field="country">
                    <label htmlFor="country" className={styles.label}>
                      Country <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      placeholder="e.g. India"
                      className={`${styles.input} ${errors.country ? styles.inputError : ''}`}
                      aria-invalid={!!errors.country}
                      aria-describedby={errors.country ? 'country-error' : undefined}
                    />
                    {errors.country && (
                      <span id="country-error" className={styles.errorMessage} role="alert">
                        {errors.country}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Requested Size & Fit Preference per Cart Item */}
              <section className={styles.formCard} aria-labelledby="item-preferences-heading">
                <div className={styles.cardHeader}>
                  <h2 id="item-preferences-heading" className={styles.sectionTitle}>3. Requested Size & Fit Preferences</h2>
                  <p className={styles.sectionSubtitle}>
                    Specify your requested sizing and fit profile for each piece in your bag.
                  </p>
                </div>

                <div className={styles.itemPreferenceList}>
                  {items.map((item) => {
                    const product = getProduct(item.productId) || catalog.find((p) => p.id === item.productId);
                    const variant = product?.variants.find((v) => v.name === item.variantName);
                    const pref = itemPreferences[item.id] || {
                      requestedSize: item.size,
                      fitPreference: 'Regular / Standard Fit',
                      itemNotes: '',
                    };
                    const sizeErrorKey = `item_${item.id}_requestedSize`;

                    return (
                      <div key={item.id} className={styles.itemPreferenceCard}>
                        <div className={styles.itemPreferenceHeader}>
                          {variant && (
                            <div className={styles.itemThumbWrapper}>
                              <Image
                                src={variant.image}
                                alt={product?.name || 'Product'}
                                fill
                                sizes="56px"
                                className={styles.itemThumb}
                              />
                            </div>
                          )}
                          <div className={styles.itemHeaderDetails}>
                            <h3 className={styles.itemHeaderName}>{product?.name || item.productId}</h3>
                            <p className={styles.itemHeaderMeta}>
                              Colour: {item.variantName} &nbsp;|&nbsp; Base Size: {item.size} &nbsp;|&nbsp; Qty: {item.quantity}
                            </p>
                            {item.customMeasurements && (
                              <p style={{ fontSize: '12px', color: '#8b5e34', margin: '4px 0 0 0', fontWeight: 700 }}>
                                Bespoke Measurements: Waist {item.customMeasurements.waist} {item.customMeasurements.unit}, Garment Outseam {item.customMeasurements.outseam} {item.customMeasurements.unit}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className={styles.itemPrefFields}>
                          <div className={styles.fieldGroup} data-field={sizeErrorKey}>
                            <label htmlFor={`size-${item.id}`} className={styles.label}>
                              Requested Size <span aria-hidden="true">*</span>
                            </label>
                            <input
                              id={`size-${item.id}`}
                              type="text"
                              required
                              value={pref.requestedSize}
                              onChange={(e) => handleItemPrefChange(item.id, 'requestedSize', e.target.value)}
                              placeholder={`e.g. ${item.size} or custom`}
                              className={`${styles.input} ${errors[sizeErrorKey] ? styles.inputError : ''}`}
                              aria-invalid={!!errors[sizeErrorKey]}
                              aria-describedby={errors[sizeErrorKey] ? `error-${item.id}-size` : undefined}
                            />
                            {errors[sizeErrorKey] && (
                              <span id={`error-${item.id}-size`} className={styles.errorMessage} role="alert">
                                {errors[sizeErrorKey]}
                              </span>
                            )}
                          </div>

                          <div className={styles.fieldGroup}>
                            <label htmlFor={`fit-${item.id}`} className={styles.label}>
                              Fit Preference
                            </label>
                            <select
                              id={`fit-${item.id}`}
                              value={pref.fitPreference}
                              onChange={(e) => handleItemPrefChange(item.id, 'fitPreference', e.target.value)}
                              className={styles.select}
                            >
                              {FIT_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor={`notes-${item.id}`} className={styles.label}>
                            Item Adjustments <span className={styles.optionalTag}>(Optional)</span>
                          </label>
                          <input
                            id={`notes-${item.id}`}
                            type="text"
                            value={pref.itemNotes}
                            onChange={(e) => handleItemPrefChange(item.id, 'itemNotes', e.target.value)}
                            placeholder="e.g. +1 inch sleeve length, relaxed waist..."
                            className={styles.input}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bespoke Measurements (Optional) */}
              <section className={styles.formCard} aria-labelledby="measurements-heading">
                <div className={styles.cardHeader}>
                  <h2 id="measurements-heading" className={styles.sectionTitle}>4. Bespoke Measurements</h2>
                  <p className={styles.sectionSubtitle}>
                    Optional — Provide your measurements for tailored fitting. Sizing can also be finalized directly in your WhatsApp conversation.
                  </p>
                </div>

                <div className={styles.unitToggleWrapper}>
                  <span className={styles.unitToggleLabel}>Measurement Unit:</span>
                  <div className={styles.unitBtnGroup} role="group" aria-label="Measurement units">
                    <button
                      type="button"
                      onClick={() => setMeasurementUnit('in')}
                      className={`${styles.unitBtn} ${measurementUnit === 'in' ? styles.unitBtnActive : ''}`}
                      aria-pressed={measurementUnit === 'in'}
                    >
                      Inches (in)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeasurementUnit('cm')}
                      className={`${styles.unitBtn} ${measurementUnit === 'cm' ? styles.unitBtnActive : ''}`}
                      aria-pressed={measurementUnit === 'cm'}
                    >
                      Centimetres (cm)
                    </button>
                  </div>
                </div>

                <div className={styles.gridThreeCol}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-chest" className={styles.label}>
                      Chest / Bust ({measurementUnit})
                    </label>
                    <input
                      id="meas-chest"
                      type="text"
                      value={measurements.chest}
                      onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                      placeholder={measurementUnit === 'in' ? 'e.g. 40 in' : 'e.g. 102 cm'}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-waist" className={styles.label}>
                      Waist ({measurementUnit})
                    </label>
                    <input
                      id="meas-waist"
                      type="text"
                      value={measurements.waist}
                      onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                      placeholder={measurementUnit === 'in' ? 'e.g. 34 in' : 'e.g. 86 cm'}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-hips" className={styles.label}>
                      Hips ({measurementUnit})
                    </label>
                    <input
                      id="meas-hips"
                      type="text"
                      value={measurements.hips}
                      onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                      placeholder={measurementUnit === 'in' ? 'e.g. 42 in' : 'e.g. 107 cm'}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.gridThreeCol}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-shoulder" className={styles.label}>
                      Shoulder ({measurementUnit})
                    </label>
                    <input
                      id="meas-shoulder"
                      type="text"
                      value={measurements.shoulder}
                      onChange={(e) => handleMeasurementChange('shoulder', e.target.value)}
                      placeholder={measurementUnit === 'in' ? 'e.g. 18 in' : 'e.g. 46 cm'}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-height" className={styles.label}>
                      Height ({measurementUnit})
                    </label>
                    <input
                      id="meas-height"
                      type="text"
                      value={measurements.height}
                      onChange={(e) => handleMeasurementChange('height', e.target.value)}
                      placeholder={measurementUnit === 'in' ? "e.g. 5'11\" or 71 in" : 'e.g. 180 cm'}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="meas-length" className={styles.label}>
                      Length / Inseam ({measurementUnit})
                    </label>
                    <input
                      id="meas-length"
                      type="text"
                      value={measurements.length}
                      onChange={(e) => handleMeasurementChange('length', e.target.value)}
                      placeholder={measurementUnit === 'in' ? 'e.g. 32 in' : 'e.g. 81 cm'}
                      className={styles.input}
                    />
                  </div>
                </div>
              </section>

              {/* Customisation Requests or Notes */}
              <section className={styles.formCard} aria-labelledby="custom-notes-heading">
                <div className={styles.cardHeader}>
                  <h2 id="custom-notes-heading" className={styles.sectionTitle}>5. Customisation & Special Notes</h2>
                  <p className={styles.sectionSubtitle}>
                    Optional — Add any details regarding alterations, fabrics, timeline requirements, or bespoke requests.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="customNotes" className={styles.label}>
                    Additional Notes <span className={styles.optionalTag}>(Optional)</span>
                  </label>
                  <textarea
                    id="customNotes"
                    value={formData.customNotes}
                    onChange={(e) => handleFieldChange('customNotes', e.target.value)}
                    placeholder="Provide any custom instructions, styling requests, event deadlines, or embroidery preferences..."
                    className={styles.textarea}
                  />
                </div>
              </section>

              {/* Required Consent & Acknowledgement */}
              <section className={styles.consentCard} data-field="consent">
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    required
                    checked={formData.consent}
                    onChange={(e) => handleFieldChange('consent', e.target.checked)}
                    className={styles.checkboxInput}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'consent-error' : undefined}
                  />
                  <span className={styles.checkboxText}>
                    I acknowledge that my entered order details, contact information, delivery destination, and bespoke preferences will be shared directly with DOWNFALL through WhatsApp.
                  </span>
                </label>
                {errors.consent && (
                  <span id="consent-error" className={styles.errorMessage} role="alert">
                    {errors.consent}
                  </span>
                )}
              </section>

              {/* Submit Area */}
              <section className={styles.submitSection}>
                {submissionAlert && (
                  <div className={styles.submissionAlertBox} role="alert">
                    <span>⚠</span> {submissionAlert}
                  </div>
                )}

                <div className={styles.submitActionRow}>
                  <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    {isSubmitting ? 'Revalidating Availability...' : 'Send Enquiry on WhatsApp'}
                  </button>
                  <p className={styles.submitExplanation}>
                    WhatsApp will open with your enquiry. Tap Send to submit it.
                  </p>
                </div>

                <p className={styles.privacyNotice}>
                  Customer addresses and body measurements are not stored in browser storage. Payment collection is not processed here; all order details and commercial terms are reviewed with DOWNFALL directly.
                </p>
              </section>
            </form>

            {/* Sticky Order Summary Column */}
            <aside className={styles.summarySticky} aria-labelledby="summary-heading">
              <h2 id="summary-heading" className={styles.summaryTitle}>Order Summary</h2>
              <p className={styles.summarySubtitle}>
                {totalQuantity} item{totalQuantity === 1 ? '' : 's'} selected for bespoke enquiry
              </p>

              <div className={styles.itemsScrollList}>
                {items.map((item) => {
                  const product = getProduct(item.productId) || catalog.find((p) => p.id === item.productId);
                  const variant = product?.variants.find((v) => v.name === item.variantName);
                  const pref = itemPreferences[item.id];
                  const isDemo = (product as any)?.isDemoPrice !== undefined ? Boolean((product as any).isDemoPrice) : true;
                  const itemCurrency = (product as any)?.currency || 'USD';
                  const itemTotal = (product?.price || 0) * item.quantity;
                  const itemTotalFormatted = itemCurrency === 'INR'
                    ? `₹${itemTotal.toLocaleString('en-IN')} INR`
                    : `$${itemTotal.toFixed(2)} USD`;

                  return (
                    <div key={item.id} className={styles.summaryItem}>
                      {variant && (
                        <div className={styles.summaryItemImage}>
                          <Image
                            src={variant.image}
                            alt={product?.name || 'Garment'}
                            fill
                            sizes="64px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div className={styles.summaryItemDetails}>
                        <h3 className={styles.summaryItemName}>{product?.name || item.productId}</h3>
                        <p className={styles.summaryItemMeta}>
                          Colour: {item.variantName} &nbsp;|&nbsp; Size: {pref?.requestedSize || item.size}
                        </p>
                        {item.customMeasurements && (
                          <p className={styles.summaryItemMeta} style={{ color: '#8b5e34' }}>
                            Waist: {item.customMeasurements.waist} {item.customMeasurements.unit} | Outseam: {item.customMeasurements.outseam} {item.customMeasurements.unit}
                          </p>
                        )}
                        <p className={styles.summaryItemMeta}>
                          Quantity: {item.quantity}
                        </p>
                        <p className={styles.summaryItemPrice}>
                          {itemTotalFormatted}
                          {isDemo && <span className={styles.demoTag}> (Demo)</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.summaryTotals}>
                {isMixedCart ? (
                  <>
                    <p style={{ fontSize: '12px', color: '#8b5e34', margin: '0 0 10px 0', fontWeight: 700 }}>
                      Mixed Currency Order: Items are invoiced in their respective catalog currencies.
                    </p>
                    {formattedSubtotals.map((fs) => (
                      <div key={fs.currency} className={styles.summaryRow}>
                        <span>Subtotal ({fs.currency})</span>
                        <span>{fs.formatted}</span>
                      </div>
                    ))}
                    <div className={styles.summaryRow}>
                      <span>Delivery Consultation</span>
                      <span>Coordinated via WhatsApp</span>
                    </div>
                    <div className={styles.summaryRowTotal}>
                      <span>Estimated Total</span>
                      <span style={{ fontSize: '13px', textAlign: 'right' }}>{formattedSubtotalString}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span>{formattedSubtotalString}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Delivery Consultation</span>
                      <span>Coordinated via WhatsApp</span>
                    </div>
                    <div className={styles.summaryRowTotal}>
                      <span>Estimated Total</span>
                      <span>{formattedSubtotalString}</span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.demoDisclaimer}>
                <p className={styles.demoDisclaimerHeading}>{hasAnyDemo ? 'Demo Price Label' : 'Order Information'}</p>
                <p>
                  {hasAnyDemo
                    ? 'Prices shown are for reference and demo purposes. This enquiry is not a paid or confirmed order. Our team will verify fabric selections, measurements, and production details before confirming your order.'
                    : 'This enquiry is not a paid or finalized checkout. Our team will verify custom measurements, tailoring specifications, and delivery schedule before confirming your order.'}
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
