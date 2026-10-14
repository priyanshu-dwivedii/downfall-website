export type ProductCategory = 'basics' | 'formal' | 'luxury' | 'bottomwear';
export type ProductStatus = 'published' | 'draft' | 'archived';
export type ProductFulfilment = 'stocked' | 'made_to_order';

export interface ProductSizeOption {
  size: string;
  available: boolean;
  stock?: number;
}

export interface ProductVariant {
  name: string;
  hex: string;
  image: string;
  sizes: ProductSizeOption[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: ProductCategory;
  status: ProductStatus;
  isDemoPrice: boolean;
  fulfilment?: ProductFulfilment;
  isMadeToOrder?: boolean;
  images?: string[];
  variants: ProductVariant[];
  measurements?: string[];
  productionTime?: string;
  careInstructions?: string;
  referenceNote?: string;
  imageCorrectionRequired?: boolean;
  imageCorrectionNote?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Validates whether a product meets all commercial requirements to be published.
 * Incomplete drafts are allowed to be saved, but publication is blocked until
 * photos, size choices, required measurements, production times, and care instructions are complete.
 * Products with images flagged for correction cannot be published until corrected photos are provided.
 */
export function validateProductPublishability(p: Partial<Product>): { canPublish: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  if (!p.name || !p.name.trim()) missingFields.push('Product name');
  if (p.price === undefined || isNaN(Number(p.price)) || Number(p.price) <= 0) missingFields.push('Valid price (> 0)');
  if (!p.category || !['basics', 'formal', 'luxury', 'bottomwear'].includes(p.category)) missingFields.push('Valid category (basics, formal, luxury, or bottomwear)');
  if (!p.description || !p.description.trim()) missingFields.push('Product description');

  if (p.imageCorrectionRequired) {
    missingFields.push('Corrected product photography (current gallery images flagged for correction: black drawstring ends mismatch confirmed grey drawstring)');
  }

  const hasPhotos = Array.isArray(p.images) && p.images.length > 0 && p.images.some((img) => img && img.trim().length > 0);
  if (!hasPhotos) missingFields.push('Product photography / imagery');

  const isMTO = p.fulfilment ? p.fulfilment === 'made_to_order' : Boolean(p.isMadeToOrder);

  if (isMTO) {
    const hasVariantsWithSizes = Array.isArray(p.variants) && p.variants.length > 0 && p.variants.some((v) => Array.isArray(v.sizes) && v.sizes.length > 0);
    const hasMeasurements = Array.isArray(p.measurements) && p.measurements.length > 0;
    if (!hasVariantsWithSizes && !hasMeasurements) {
      missingFields.push('Size choices or customisation/measurement options');
    }
    // Production lead time and care instructions have been deferred by the client (optional for publication)
  } else {
    if (!p.variants || !Array.isArray(p.variants) || p.variants.length === 0) {
      missingFields.push('Colour variants');
    } else {
      const hasSizes = p.variants.some((v) => Array.isArray(v.sizes) && v.sizes.length > 0);
      if (!hasSizes) missingFields.push('Size options & availability');
    }
  }

  return {
    canPublish: missingFields.length === 0,
    missingFields,
  };
}
