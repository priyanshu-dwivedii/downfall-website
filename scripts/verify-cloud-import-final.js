/**
 * DOWNFALL Atelier - Final Cloud Verification Script
 *
 * Verifies all criteria specified in the migration & draft import task:
 * 1. Checks all 7 new products in Supabase:
 *    - status: 'draft'
 *    - INR price and is_demo_price: false
 *    - category: 'bottomwear'
 *    - fulfilment: 'made_to_order', is_made_to_order: true
 *    - custom measurement configuration (Waist circumference, Outseam, blank defaults)
 *    - product-specific reference_note populated
 *    - production_time and care_instructions strictly empty
 *    - all 34 images mapped to active Supabase Storage public HTTPS URLs
 *    - zero references to /archive/ or old black-tipped drawstring images
 * 2. Checks demo products in Supabase:
 *    - Exactly 7 demo products exist ('c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4')
 *    - statuses unchanged ('published')
 *    - versions preserved (c1 is v4, p4 is v2, etc.)
 * 3. Confirms Black Joggers was NOT imported into Supabase.
 * 4. Anonymous session verification:
 *    - Anon client reading catalog returns ONLY published demo products (7 products)
 *    - Anon client querying draft products returns 0 rows
 *    - Anon direct lookup of draft slugs returns empty/null
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing Supabase credentials in environment.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const EXPECTED_DRAFTS = [
  { id: 'draft_cocoa_skater_denim', name: '90s Retro Cocoa Skater Denim', slug: '90s-retro-cocoa-skater-denim', price: 1649, imagesCount: 5 },
  { id: 'draft_indigo_drape_jeans', name: 'Classic Indigo Drape Jeans', slug: 'classic-indigo-drape-jeans', price: 1799, imagesCount: 5 },
  { id: 'draft_beige_wide_leg_joggers', name: 'Beige Wide Leg Joggers', slug: 'beige-wide-leg-joggers', price: 1299, imagesCount: 5 },
  { id: 'draft_white_pinstripe_flared_pants', name: 'White Pinstripe Flared Pants', slug: 'white-pinstripe-flared-pants', price: 1549, imagesCount: 5 },
  { id: 'draft_brown_pinstripe_flared_pants', name: 'Brown Pinstripe Flared Pants', slug: 'brown-pinstripe-flared-pants', price: 1549, imagesCount: 5 },
  { id: 'draft_grey_pinstripe_flared_pants', name: 'Grey Pinstripe Flared Pants', slug: 'grey-pinstripe-flared-pants', price: 1549, imagesCount: 5 },
  { id: 'draft_grey_wide_leg_joggers', name: 'Grey Wide Leg Joggers', slug: 'grey-wide-leg-joggers', price: 1299, imagesCount: 4 },
];

const PROTECTED_DEMO_IDS = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];

async function runVerification() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - POST-IMPORT CLOUD VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✓ [PASS] ${testName}${detail ? ' - ' + detail : ''}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // 1. Fetch all cloud products via Admin Client
  // --------------------------------------------------------------------------
  console.log('--- 1. CLOUD PRODUCT AUDIT (Admin Service Role) ---');
  const { data: allProducts, error: fetchErr } = await adminClient
    .from('products')
    .select('*')
    .order('id');

  if (fetchErr) {
    console.error('Fatal fetch error:', fetchErr.message);
    process.exit(1);
  }

  assert(allProducts.length === 14, 'Total Cloud Product Count', `Found ${allProducts.length} (expected 7 demo + 7 drafts = 14)`);

  // --------------------------------------------------------------------------
  // 2. Verify Black Joggers is NOT imported
  // --------------------------------------------------------------------------
  const blackJoggers = allProducts.find(
    (p) => p.id === 'draft_black_wide_leg_joggers' || p.slug === 'black-wide-leg-joggers'
  );
  assert(!blackJoggers, 'Black Joggers Exclusion', 'Black Joggers does not exist in Supabase');

  // --------------------------------------------------------------------------
  // 3. Verify Existing 7 Demo Products Unchanged
  // --------------------------------------------------------------------------
  console.log('\n--- 2. DEMO PRODUCT PRESERVATION ---');
  const demoProducts = allProducts.filter((p) => PROTECTED_DEMO_IDS.includes(p.id));
  assert(demoProducts.length === 7, 'All 7 Demo Products Present', `Found IDs: ${demoProducts.map((p) => p.id).join(', ')}`);

  const demoStatuses = demoProducts.every((p) => p.status === 'published');
  assert(demoStatuses, 'Demo Product Statuses Intact', 'All 7 demo products remain published');

  const c1 = demoProducts.find((p) => p.id === 'c1');
  assert(c1 && c1.version >= 4, 'Demo Product c1 Live Version Preserved', `c1 is version ${c1?.version} (>= 4)`);

  const p4 = demoProducts.find((p) => p.id === 'p4');
  assert(p4 && p4.version >= 2, 'Demo Product p4 Live Version Preserved', `p4 is version ${p4?.version} (>= 2)`);

  // --------------------------------------------------------------------------
  // 4. Verify 7 New Bottomwear Drafts in Supabase
  // --------------------------------------------------------------------------
  console.log('\n--- 3. SEVEN NEW BOTTOMWEAR DRAFTS VERIFICATION ---');
  let totalCloudImages = 0;

  for (const expected of EXPECTED_DRAFTS) {
    const row = allProducts.find((p) => p.id === expected.id);
    assert(Boolean(row), `Product Exists: ${expected.id}`, `"${expected.name}"`);
    if (!row) continue;

    // Status: draft
    assert(row.status === 'draft', `Draft Status: ${row.id}`, `status="${row.status}"`);

    // Price and currency
    assert(
      Number(row.price) === expected.price && row.currency === 'INR' && row.is_demo_price === false,
      `Pricing: ${row.id}`,
      `₹${row.price} ${row.currency} (is_demo_price: ${row.is_demo_price})`
    );

    // Category: bottomwear
    assert(row.category === 'bottomwear', `Category: ${row.id}`, `category="${row.category}"`);

    // Fulfilment: made_to_order
    assert(
      row.fulfilment === 'made_to_order' && row.is_made_to_order === true,
      `Fulfilment: ${row.id}`,
      `fulfilment="${row.fulfilment}", is_made_to_order=${row.is_made_to_order}`
    );

    // Custom measurements configuration
    const hasMeasurements = Array.isArray(row.measurements) && row.measurements.length >= 2;
    const hasWaist = row.measurements?.some((m) => typeof m === 'string' ? m.toLowerCase().includes('waist') : m.id?.includes('waist'));
    const hasOutseam = row.measurements?.some((m) => typeof m === 'string' ? m.toLowerCase().includes('outseam') : m.id?.includes('outseam'));
    assert(
      hasMeasurements && hasWaist && hasOutseam,
      `Custom Measurements: ${row.id}`,
      `Waist & Outseam measurements: [${row.measurements.join(', ')}]`
    );

    // Product-specific reference note
    assert(
      typeof row.reference_note === 'string' && row.reference_note.length > 0,
      `Reference Note: ${row.id}`,
      `"${row.reference_note?.slice(0, 50)}..."`
    );

    // Empty production time and care instructions
    const emptyProduction = row.production_time === '' || row.production_time === null;
    const emptyCare = row.care_instructions === '' || row.care_instructions === null;
    assert(
      emptyProduction && emptyCare,
      `Empty Production & Care: ${row.id}`,
      `production_time="${row.production_time}", care_instructions="${row.care_instructions}"`
    );

    // Images mapped to Supabase Storage
    const images = Array.isArray(row.images) ? row.images : [];
    const allCloudUrls = images.every((img) => img.startsWith('https://') && img.includes('supabase.co/storage/v1/object/public/catalog-images/products/'));
    const noArchivedUrls = images.every((img) => !img.includes('archive') && !img.includes('flagged'));
    assert(
      images.length === expected.imagesCount && allCloudUrls && noArchivedUrls,
      `Cloud Gallery Images: ${row.id}`,
      `${images.length}/${expected.imagesCount} valid Supabase Storage URLs`
    );
    totalCloudImages += images.length;

    // Variant image mapped to cloud URL
    if (Array.isArray(row.variants) && row.variants.length > 0) {
      const varImg = row.variants[0].image;
      const validVarImg = varImg.startsWith('https://') && varImg.includes('supabase.co/storage/v1/object/public/catalog-images/products/');
      assert(validVarImg, `Variant Cloud Image: ${row.id}`, varImg);
    }
  }

  assert(totalCloudImages === 34, 'Total Cloud Images Across All 7 Drafts', `${totalCloudImages}/34 gallery images uploaded and mapped`);

  // --------------------------------------------------------------------------
  // 5. Anonymous Visitor Security & RLS Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- 4. ANONYMOUS RLS PRIVACY & DRAFT PROTECTION ---');
  
  // 5a. Anonymous catalog query
  const { data: anonProducts, error: anonErr } = await anonClient
    .from('products')
    .select('id, name, status, category')
    .order('id');

  assert(!anonErr, 'Anonymous Query Succeeded', 'No error executing public query');
  assert(anonProducts && anonProducts.length === 7, 'Anonymous Product Count', `Returned exactly ${anonProducts?.length} published products`);
  
  const anyDraftVisible = (anonProducts || []).some((p) => p.status === 'draft');
  assert(!anyDraftVisible, 'Anonymous Draft Exclusion', 'Zero draft products exposed in public listing');

  // 5b. Direct lookup of draft product via Anon Client
  const { data: directDraftLookup } = await anonClient
    .from('products')
    .select('*')
    .eq('id', 'draft_cocoa_skater_denim');
  assert(!directDraftLookup || directDraftLookup.length === 0, 'Anonymous Direct Draft Lookup', 'Returns 0 results for draft_cocoa_skater_denim');

  const { data: directJoggersLookup } = await anonClient
    .from('products')
    .select('*')
    .eq('id', 'draft_grey_wide_leg_joggers');
  assert(!directJoggersLookup || directJoggersLookup.length === 0, 'Anonymous Direct Draft Lookup', 'Returns 0 results for draft_grey_wide_leg_joggers');

  // 5c. Anonymous visitor cannot insert or mutate
  const { error: anonInsertErr } = await anonClient
    .from('products')
    .insert({ id: 'anon_exploit', name: 'Exploit', slug: 'anon-exploit', price: 1, category: 'basics' });
  assert(Boolean(anonInsertErr), 'Anonymous Insert Blocked', 'Public client cannot write to products table');

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unexpected verification error:', err);
  process.exit(1);
});
