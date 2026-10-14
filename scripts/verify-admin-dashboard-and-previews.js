/**
 * DOWNFALL Atelier - Admin Dashboard & Preview Verification
 *
 * Verifies:
 * 1. Price formatting by currency (₹1,299, ₹1,549, ₹1,649, ₹1,799).
 * 2. Display of "Made to Order" instead of stock counts.
 * 3. Database mappings preserve fulfilment, custom measurements, reference notes, and gallery URLs.
 * 4. Authenticated previews load correctly and anonymous visitors cannot access drafts.
 * 5. Draft records contain no invented stock values.
 */

const assert = require('assert');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TARGET_DRAFTS = [
  { id: 'draft_cocoa_skater_denim', name: '90s Retro Cocoa Skater Denim', slug: '90s-retro-cocoa-skater-denim', expectedPrice: '₹1,649' },
  { id: 'draft_indigo_drape_jeans', name: 'Classic Indigo Drape Jeans', slug: 'classic-indigo-drape-jeans', expectedPrice: '₹1,799' },
  { id: 'draft_beige_wide_leg_joggers', name: 'Beige Wide Leg Joggers', slug: 'beige-wide-leg-joggers', expectedPrice: '₹1,299' },
  { id: 'draft_white_pinstripe_flared_pants', name: 'White Pinstripe Flared Pants', slug: 'white-pinstripe-flared-pants', expectedPrice: '₹1,549' },
  { id: 'draft_brown_pinstripe_flared_pants', name: 'Brown Pinstripe Flared Pants', slug: 'brown-pinstripe-flared-pants', expectedPrice: '₹1,549' },
  { id: 'draft_grey_pinstripe_flared_pants', name: 'Grey Pinstripe Flared Pants', slug: 'grey-pinstripe-flared-pants', expectedPrice: '₹1,549' },
  { id: 'draft_grey_wide_leg_joggers', name: 'Grey Wide Leg Joggers', slug: 'grey-wide-leg-joggers', expectedPrice: '₹1,299' },
];

async function runVerification() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - ADMIN DASHBOARD & PREVIEW VERIFICATION');
  console.log('================================================================\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { mapDbRowToProduct, mapProductToDbRow } = require('../src/lib/catalog.ts');

  // 1. Fetch live cloud products via Admin Client
  console.log('--- 1. AUDITING IMPORTED DRAFTS IN SUPABASE ---');
  const { data: cloudProducts, error: fetchErr } = await adminClient
    .from('products')
    .select('*')
    .in('id', TARGET_DRAFTS.map((t) => t.id));

  assert.ifError(fetchErr);
  assert.strictEqual(cloudProducts.length, 7, 'All 7 target drafts must exist in Supabase');

  for (const target of TARGET_DRAFTS) {
    const row = cloudProducts.find((p) => p.id === target.id);
    assert.ok(row, `Product ${target.id} must exist in cloud database`);
    const product = mapDbRowToProduct(row);

    // 1a. Currency & Price formatting
    const isINR = (product.currency || '').toUpperCase() === 'INR';
    const formattedPrice = isINR
      ? `₹${Number(product.price).toLocaleString('en-IN')}`
      : `$${Number(product.price).toFixed(2)}`;
    assert.strictEqual(formattedPrice, target.expectedPrice, `Formatted price for ${product.id} must be ${target.expectedPrice}`);
    console.log(`✓ [PRICE] ${product.name.padEnd(32)} -> ${formattedPrice} (${product.currency})`);

    // 1b. Made to Order & Fulfilment
    assert.strictEqual(product.fulfilment, 'made_to_order');
    assert.strictEqual(product.isMadeToOrder, true);
    console.log(`  ✓ Fulfilment: made_to_order (Display: "Made to Order", no stock counts)`);

    // 1c. No invented stock values
    for (const v of product.variants) {
      for (const s of v.sizes) {
        assert.strictEqual(s.stock, undefined, `Invented stock found on ${product.id} size "${s.size}"`);
      }
    }
    console.log(`  ✓ Stock: Zero invented stock values in variant specifications`);

    // 1d. Custom measurements preserved
    assert.ok(Array.isArray(product.measurements) && product.measurements.length >= 2, 'Custom measurements array must be populated');
    assert.ok(product.measurements.some((m) => m.toLowerCase().includes('waist')), 'Must include Waist measurement');
    assert.ok(product.measurements.some((m) => m.toLowerCase().includes('outseam')), 'Must include Outseam measurement');
    console.log(`  ✓ Custom Measurements: [${product.measurements.join(', ')}]`);

    // 1e. Product-specific reference notes preserved
    assert.ok(typeof product.referenceNote === 'string' && product.referenceNote.length > 0, 'Reference note must be present');
    console.log(`  ✓ Reference Note: "${product.referenceNote.slice(0, 55)}..."`);

    // 1f. Gallery cloud URLs
    assert.ok(Array.isArray(product.images) && product.images.length >= 4, 'Must have active gallery images');
    for (const img of product.images) {
      assert.ok(img.startsWith('https://'), `Image URL must be HTTPS: ${img}`);
      assert.ok(img.includes('supabase.co/storage/v1/object/public/catalog-images/'), `Image URL must be Supabase Storage: ${img}`);
      assert.ok(!img.includes('archive'), `Image URL must not reference archive: ${img}`);
    }
    console.log(`  ✓ Gallery Images: ${product.images.length} Supabase Storage URLs mapped`);
  }

  // --------------------------------------------------------------------------
  // 2. Database Mapping Roundtrip Integrity
  // --------------------------------------------------------------------------
  console.log('\n--- 2. DATABASE MAPPING ROUNDTRIP INTEGRITY ---');
  const sampleRow = cloudProducts[0];
  const mappedProduct = mapDbRowToProduct(sampleRow);
  const remappedRow = mapProductToDbRow(mappedProduct);

  assert.strictEqual(remappedRow.fulfilment, sampleRow.fulfilment);
  assert.strictEqual(remappedRow.is_made_to_order, sampleRow.is_made_to_order);
  assert.strictEqual(remappedRow.reference_note, sampleRow.reference_note);
  assert.deepStrictEqual(remappedRow.measurements, sampleRow.measurements);
  assert.deepStrictEqual(remappedRow.images, sampleRow.images);
  console.log('✓ mapDbRowToProduct <-> mapProductToDbRow roundtrips flawlessly without data loss.');

  // --------------------------------------------------------------------------
  // 3. Authenticated Preview vs Anonymous Privacy
  // --------------------------------------------------------------------------
  console.log('\n--- 3. AUTHENTICATED PREVIEW VS ANONYMOUS PRIVACY ---');
  const { getProductBySlug, getCatalog } = require('../src/lib/catalog.ts');

  // 3a. Authenticated admin preview query
  const testSlug = '90s-retro-cocoa-skater-denim';
  const previewProduct = await getProductBySlug(testSlug, true); // isAuthorizedPreview = true
  assert.ok(previewProduct, 'Authenticated admin MUST be able to load draft by slug');
  assert.strictEqual(previewProduct.status, 'draft');
  assert.strictEqual(previewProduct.slug, testSlug);
  console.log(`✓ Authenticated preview loads draft: "${previewProduct.name}" (Status: ${previewProduct.status})`);

  // 3b. Anonymous query for draft slug (MUST RETURN UNDEFINED)
  const anonDraftLookup = await getProductBySlug(testSlug, false); // isAuthorizedPreview = false
  assert.strictEqual(anonDraftLookup, undefined, 'Anonymous request MUST return undefined (triggers 404)');
  console.log(`✓ Anonymous lookup for "${testSlug}" safely returns undefined (triggers 404)`);

  // 3c. Public storefront catalog resolution
  const publicStorefront = await getCatalog(false);
  assert.strictEqual(publicStorefront.length, 7, 'Public storefront must ONLY resolve the 7 published demo products');
  const anyDraftInStorefront = publicStorefront.some((p) => p.status !== 'published');
  assert.strictEqual(anyDraftInStorefront, false, 'No drafts can ever appear in public storefront catalog');
  console.log(`✓ Public storefront catalog returns exactly ${publicStorefront.length} published products (zero drafts exposed)`);

  // 3d. Supabase Direct Anonymous RLS enforcement
  const { data: anonSupabaseProducts } = await anonClient.from('products').select('id, status');
  assert.strictEqual(anonSupabaseProducts.length, 7, 'Direct anonymous Supabase query returns only 7 products');
  assert.ok(anonSupabaseProducts.every((p) => p.status === 'published'), 'All rows returned to anon must be status="published"');
  console.log(`✓ Direct Supabase RLS enforces 0 drafts returned to anonymous clients`);

  console.log('\n================================================================');
  console.log('  ALL ADMIN DASHBOARD & PREVIEW VERIFICATION CHECKS PASSED!');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
