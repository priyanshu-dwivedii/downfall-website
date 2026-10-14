import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import {
  Product,
  ProductVariant,
  ProductCategory,
  ProductStatus,
  ProductFulfilment,
  validateProductPublishability,
} from './catalog-types';

export * from './catalog-types';

export class ConcurrencyConflictError extends Error {
  constructor(message = 'Conflict: This garment has been modified by another concurrent session. Please refresh to load the latest changes.') {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

const CATALOG_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'catalog.json');
const LOCK_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'catalog.json.lock');

/**
 * File lock with timeout and stale lock recovery for local fallback persistence.
 */
function acquireFileLock(maxWaitMs = 5000): number {
  const startTime = Date.now();
  const dir = path.dirname(LOCK_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const fd = fs.openSync(LOCK_FILE_PATH, 'wx');
      fs.writeSync(fd, `${process.pid}\n${Date.now()}`);
      return fd;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        try {
          const stats = fs.statSync(LOCK_FILE_PATH);
          if (Date.now() - stats.mtimeMs > 10000) {
            fs.unlinkSync(LOCK_FILE_PATH);
            continue;
          }
        } catch {
          continue;
        }
        const sleepMs = 25 + Math.floor(Math.random() * 50);
        const endSleep = Date.now() + sleepMs;
        while (Date.now() < endSleep) {}
      } else {
        throw err;
      }
    }
  }
  throw new Error('Catalog lock timeout: Another concurrent update is currently in progress.');
}

function releaseFileLock(fd: number) {
  try {
    fs.closeSync(fd);
  } catch {}
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
    }
  } catch {}
}

export function withCatalogLock<T>(action: () => T): T {
  const fd = acquireFileLock();
  try {
    return action();
  } finally {
    releaseFileLock(fd);
  }
}

export function mapDbRowToProduct(row: any): Product {
  const fulfilment: ProductFulfilment = (row.fulfilment as ProductFulfilment) || (row.is_made_to_order ? 'made_to_order' : 'stocked');
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    currency: row.currency || 'USD',
    category: row.category as ProductCategory,
    status: row.status as ProductStatus,
    isDemoPrice: row.is_demo_price !== undefined ? Boolean(row.is_demo_price) : true,
    fulfilment,
    isMadeToOrder: fulfilment === 'made_to_order',
    images: Array.isArray(row.images) ? row.images : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    measurements: Array.isArray(row.measurements) ? row.measurements : [],
    productionTime: row.production_time || '',
    careInstructions: row.care_instructions || '',
    referenceNote: row.reference_note || undefined,
    imageCorrectionRequired: row.image_correction_required !== undefined ? Boolean(row.image_correction_required) : undefined,
    imageCorrectionNote: row.image_correction_note || undefined,
    version: row.version || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductToDbRow(p: Partial<Product>): any {
  const row: any = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.slug !== undefined) row.slug = p.slug;
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.price !== undefined) row.price = Number(p.price);
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.category !== undefined) row.category = p.category;
  if (p.status !== undefined) row.status = p.status;
  if (p.isDemoPrice !== undefined) row.is_demo_price = Boolean(p.isDemoPrice);
  if (p.fulfilment !== undefined) {
    row.fulfilment = p.fulfilment;
    row.is_made_to_order = p.fulfilment === 'made_to_order';
  } else if (p.isMadeToOrder !== undefined) {
    row.fulfilment = p.isMadeToOrder ? 'made_to_order' : 'stocked';
    row.is_made_to_order = Boolean(p.isMadeToOrder);
  }
  if (p.images !== undefined) row.images = p.images;
  if (p.variants !== undefined) row.variants = p.variants;
  if (p.measurements !== undefined) row.measurements = p.measurements;
  if (p.productionTime !== undefined) row.production_time = p.productionTime;
  if (p.careInstructions !== undefined) row.care_instructions = p.careInstructions;
  if (p.referenceNote !== undefined) row.reference_note = p.referenceNote;
  if (p.imageCorrectionRequired !== undefined) row.image_correction_required = Boolean(p.imageCorrectionRequired);
  if (p.imageCorrectionNote !== undefined) row.image_correction_note = p.imageCorrectionNote;
  if (p.version !== undefined) row.version = p.version;
  if (p.createdAt !== undefined) row.created_at = p.createdAt;
  if (p.updatedAt !== undefined) row.updated_at = p.updatedAt;
  return row;
}

/**
 * Reads local fallback catalog file.
 */
export function readLocalCatalog(): Product[] {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const data = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({
          ...p,
          version: p.version ?? 1,
        }));
      }
    }
  } catch (error) {
    console.error('Error reading local catalog file:', error);
  }
  return [];
}

/**
 * Writes local fallback catalog file.
 */
export function writeLocalCatalog(products: Product[]): boolean {
  try {
    const dir = path.dirname(CATALOG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing local catalog file:', error);
    return false;
  }
}

/**
 * Gets all products.
 * Queries Supabase PostgreSQL if configured; otherwise falls back to local disk.
 */
export async function getCatalog(includeAll = false): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!includeAll) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map(mapDbRowToProduct);
      }
      console.warn('Supabase query error, falling back to local catalog:', error?.message);
    }
  }

  // Fallback to local catalog
  const all = readLocalCatalog();
  if (includeAll) {
    return all;
  }
  return all.filter((p) => p.status === 'published');
}

/**
 * Gets a product by ID.
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        return mapDbRowToProduct(data);
      }
    }
  }

  const all = readLocalCatalog();
  return all.find((p) => p.id === id);
}

/**
 * Gets a product by slug.
 */
export async function getProductBySlug(slug: string, includeAll = false): Promise<Product | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('products').select('*').eq('slug', slug);
      if (!includeAll) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query.single();
      if (!error && data) {
        return mapDbRowToProduct(data);
      }
    }
  }

  const all = readLocalCatalog();
  const product = all.find((p) => p.slug === slug);
  if (!product) return undefined;
  if (!includeAll && product.status !== 'published') return undefined;
  return product;
}

/**
 * Saves a product (create or update) with optimistic concurrency protection.
 */
export async function saveProduct(
  input: Partial<Product> & {
    name: string;
    price: number;
    expectedVersion?: number;
    expectedUpdatedAt?: string;
  }
): Promise<{ product: Product; isNew: boolean }> {
  const now = new Date().toISOString();
  const baseSlug = (input.slug || input.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Publication gate: block publishing incomplete products while allowing drafts
  if (input.status === 'published') {
    const publishCheck = validateProductPublishability(input);
    if (!publishCheck.canPublish) {
      throw new Error(
        `Cannot publish product: missing required selling information (${publishCheck.missingFields.join(', ')}). Incomplete garments can only be saved as drafts.`
      );
    }
  }

  const authoritativeFulfilment: ProductFulfilment = input.fulfilment
    ? input.fulfilment
    : input.isMadeToOrder
    ? 'made_to_order'
    : 'stocked';
  const isMTO = authoritativeFulfilment === 'made_to_order';

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const isExisting = Boolean(input.id);

      if (isExisting && input.id) {
        let expectedVer = input.expectedVersion;
        let existingName = input.name;

        // If expectedVersion is omitted, fetch current version to prevent passing null
        if (expectedVer === undefined) {
          const { data: existing, error: getErr } = await supabase
            .from('products')
            .select('version, name')
            .eq('id', input.id)
            .single();

          if (getErr || !existing) {
            throw new Error('Product not found for update.');
          }
          expectedVer = existing.version ?? 1;
          existingName = existing.name || input.name;
        }

        const dbPayload = mapProductToDbRow({
          ...input,
          fulfilment: authoritativeFulfilment,
          isMadeToOrder: isMTO,
          slug: baseSlug,
          updatedAt: now,
        });

        // 1. Atomic PostgreSQL function with row-level locking (FOR UPDATE) and strict non-null version check
        try {
          const { data: atomicUpdated, error: atomicErr } = await supabase.rpc('update_product_atomic', {
            p_id: input.id,
            p_expected_version: expectedVer,
            p_payload: dbPayload,
          });

          if (!atomicErr && atomicUpdated) {
            return { product: mapDbRowToProduct(atomicUpdated), isNew: false };
          }

          if (atomicErr) {
            if (atomicErr.message?.includes('CONCURRENCY_CONFLICT') || atomicErr.message?.includes('INVALID_VERSION')) {
              throw new ConcurrencyConflictError(
                `Conflict: Simultaneous edit detected for garment "${existingName || input.id}". ${atomicErr.message}`
              );
            }
          }
        } catch (rpcError: any) {
          if (rpcError instanceof ConcurrencyConflictError) throw rpcError;
          // Fall through to atomic conditional update if RPC is not present
        }

        // 2. Atomic SQL conditional update fallback
        const { data: existing, error: getErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', input.id)
          .single();

        if (getErr || !existing) {
          throw new Error('Product not found for update.');
        }

        const currentVer = existing.version ?? 1;
        if (input.expectedVersion !== undefined && input.expectedVersion !== currentVer) {
          throw new ConcurrencyConflictError(
            `Conflict: Garment "${existing.name}" was modified by another session (expected v${input.expectedVersion}, found v${currentVer}). Please reload latest changes.`
          );
        }

        const nextVersion = currentVer + 1;
        const updatePayload = mapProductToDbRow({
          ...input,
          fulfilment: input.fulfilment || (isMTO ? 'made_to_order' : 'stocked'),
          isMadeToOrder: isMTO,
          slug: baseSlug || existing.slug,
          version: nextVersion,
          updatedAt: now,
        });

        const { data: updated, error: updateErr } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', input.id)
          .eq('version', input.expectedVersion !== undefined ? input.expectedVersion : currentVer)
          .select()
          .single();

        if (updateErr || !updated) {
          throw new ConcurrencyConflictError(
            `Conflict: Simultaneous edit detected for "${existing.name}". Please refresh latest changes.`
          );
        }

        return { product: mapDbRowToProduct(updated), isNew: false };
      } else {
        // Create new
        const newId = input.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        let uniqueSlug = baseSlug || newId;

        const dbPayload = mapProductToDbRow({
          id: newId,
          slug: uniqueSlug,
          name: input.name,
          description: input.description || '',
          price: Number(input.price) || 0,
          currency: input.currency || 'USD',
          category: input.category || 'basics',
          status: input.status || 'draft',
          isDemoPrice: input.isDemoPrice !== undefined ? Boolean(input.isDemoPrice) : true,
          fulfilment: authoritativeFulfilment,
          isMadeToOrder: isMTO,
          images: input.images || [],
          variants:
            input.variants !== undefined
              ? input.variants
              : isMTO
              ? []
              : [
                  {
                    name: 'Standard',
                    hex: '#111111',
                    image: input.images?.[0] || '/garment_1.jpg',
                    sizes: [
                      { size: 'S', available: true, stock: 10 },
                      { size: 'M', available: true, stock: 10 },
                      { size: 'L', available: true, stock: 10 },
                    ],
                  },
                ],
          measurements: input.measurements || [],
          productionTime: input.productionTime || '',
          careInstructions: input.careInstructions || '',
          version: 1,
          createdAt: now,
          updatedAt: now,
        });

        const { data: created, error: createErr } = await supabase
          .from('products')
          .insert(dbPayload)
          .select()
          .single();

        if (createErr || !created) {
          throw new Error(createErr?.message || 'Failed to insert product into Supabase.');
        }

        return { product: mapDbRowToProduct(created), isNew: true };
      }
    }
  }

  // In production, Supabase database is strictly required. Local catalog persistence is disabled.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production configuration error: Supabase is required in production. Local catalog persistence is disabled.');
  }

  // Local fallback persistence (development / local testing only)
  return withCatalogLock(() => {
    const all = readLocalCatalog();
    let product: Product;
    let isNew = false;

    const existingIndex = input.id ? all.findIndex((p) => p.id === input.id) : -1;

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      const currentVer = existing.version ?? 1;

      if (input.expectedVersion !== undefined && input.expectedVersion !== currentVer) {
        throw new ConcurrencyConflictError(
          `Conflict: Garment "${existing.name}" was modified by another session (expected v${input.expectedVersion}, found v${currentVer}). Please reload latest changes.`
        );
      }

      const nextVersion = currentVer + 1;
      product = {
        ...existing,
        ...input,
        fulfilment: authoritativeFulfilment,
        isMadeToOrder: isMTO,
        slug: baseSlug || existing.slug,
        version: nextVersion,
        updatedAt: now,
      } as Product;

      all[existingIndex] = product;
    } else {
      isNew = true;
      const newId = input.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let uniqueSlug = baseSlug || newId;
      let counter = 1;
      while (all.some((p) => p.slug === uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      product = {
        id: newId,
        slug: uniqueSlug,
        name: input.name,
        description: input.description || '',
        price: Number(input.price) || 0,
        currency: input.currency || 'USD',
        category: input.category || 'basics',
        status: input.status || 'draft',
        isDemoPrice: input.isDemoPrice !== undefined ? Boolean(input.isDemoPrice) : true,
        fulfilment: authoritativeFulfilment,
        isMadeToOrder: isMTO,
        images: input.images || [],
        variants:
          input.variants !== undefined
            ? input.variants
            : isMTO
            ? []
            : [
                {
                  name: 'Standard',
                  hex: '#111111',
                  image: input.images?.[0] || '/garment_1.jpg',
                  sizes: [
                    { size: 'S', available: true, stock: 10 },
                    { size: 'M', available: true, stock: 10 },
                    { size: 'L', available: true, stock: 10 },
                  ],
                },
              ],
        measurements: input.measurements || [],
        productionTime: input.productionTime || '',
        careInstructions: input.careInstructions || '',
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      all.unshift(product);
    }

    writeLocalCatalog(all);
    return { product, isNew };
  });
}

/**
 * Deletes a product.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production configuration error: Supabase is required in production. Local catalog deletion is disabled.');
  }

  return withCatalogLock(() => {
    const all = readLocalCatalog();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) {
      return false;
    }
    writeLocalCatalog(filtered);
    return true;
  });
}

/**
 * Sets product status (published, draft, archived).
 * Blocks publishing if product selling details are incomplete.
 */
export async function setProductStatus(id: string, status: ProductStatus): Promise<Product | undefined> {
  // If attempting to publish, ensure the garment has all required selling information
  if (status === 'published') {
    const existing = await getProductById(id);
    if (!existing) return undefined;
    const publishCheck = validateProductPublishability({ ...existing, status });
    if (!publishCheck.canPublish) {
      throw new Error(
        `Cannot publish product "${existing.name}": missing required selling information (${publishCheck.missingFields.join(', ')}). Incomplete garments must remain drafts.`
      );
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return mapDbRowToProduct(data);
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production configuration error: Supabase is required in production. Local catalog update is disabled.');
  }

  return withCatalogLock(() => {
    const all = readLocalCatalog();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    all[index].status = status;
    all[index].version = (all[index].version || 1) + 1;
    all[index].updatedAt = new Date().toISOString();
    writeLocalCatalog(all);
    return all[index];
  });
}
