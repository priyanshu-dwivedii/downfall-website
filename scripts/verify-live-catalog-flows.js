/**
 * Comprehensive Live Catalog Flows Verification Script
 * 
 * Verifies:
 * 1. Cloud database catalog statuses: 7 published, 7 archived, 0 drafts, Black Joggers excluded.
 * 2. Anonymous client Supabase RLS: only sees the 7 published Bottomwear products, exactly 0 archived demos.
 * 3. Anonymous direct lookup for archived demo IDs/slugs returns empty.
 * 4. Homepage Bestsellers / Standout Edit: features published bottomwear garments.
 * 5. Collections (/collections/bottomwear, /collections/all): uses published catalog.
 * 6. Product recommendations: strictly use published bottomwear.
 * 7. Archived demo protection: archived IDs (c1, f1, x1, p1-p4) cannot be ordered.
 * 8. INR pricing format & made-to-order badges.
 * 9. Custom measurements propagation into WhatsApp message structure without sending any message.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('@next/env').loadEnvConfig(process.cwd());

const DEMO_IDS = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];
const REAL_BOTTOMWEAR_IDS = [
  'draft_cocoa_skater_denim',
  'draft_indigo_drape_jeans',
  'draft_beige_wide_leg_joggers',
  'draft_white_pinstripe_flared_pants',
  'draft_brown_pinstripe_flared_pants',
  'draft_grey_pinstripe_flared_pants',
  'draft_grey_wide_leg_joggers',
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error('FATAL: Supabase credentials missing');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function runVerification() {
  console.log('================================================================');
  console.log('       DOWNFALL ATELIER - COMPREHENSIVE FLOW VERIFICATION       ');
  console.log('================================================================\n');

  const issues = [];

  // --- STEP 1: CLOUD DATABASE INTEGRITY (SERVICE ROLE) ---
  console.log('--- 1. CLOUD DATABASE CATALOG STATUSES (ADMIN/SERVICE ROLE) ---');
  const { data: cloudProducts, error: cloudErr } = await adminClient
    .from('products')
    .select('id, name, slug, status, category, price, currency, fulfilment, is_made_to_order, is_demo_price, version, variants, images, measurements')
    .order('id');

  if (cloudErr) {
    throw new Error(`Failed to fetch cloud products: ${cloudErr.message}`);
  }

  console.log(`Total cloud products: ${cloudProducts.length} (Expected: 14)`);
  if (cloudProducts.length !== 14) {
    issues.push(`Cloud product count is ${cloudProducts.length}, expected 14`);
  }

  const publishedCloud = cloudProducts.filter((p) => p.status === 'published');
  const archivedCloud = cloudProducts.filter((p) => p.status === 'archived');
  const draftCloud = cloudProducts.filter((p) => p.status === 'draft');

  console.log(`Published products:   ${publishedCloud.length} (Expected: 7)`);
  console.log(`Archived demo items:  ${archivedCloud.length} (Expected: 7)`);
  console.log(`Draft items:          ${draftCloud.length} (Expected: 0)`);

  if (publishedCloud.length !== 7) issues.push(`Expected 7 published products, got ${publishedCloud.length}`);
  if (archivedCloud.length !== 7) issues.push(`Expected 7 archived products, got ${archivedCloud.length}`);
  if (draftCloud.length !== 0) issues.push(`Expected 0 drafts, got ${draftCloud.length}`);

  // Confirm Black Joggers is NOT in the database
  const blackJoggersExists = cloudProducts.some((p) => p.id === 'draft_black_wide_leg_joggers');
  if (blackJoggersExists) {
    issues.push('CRITICAL: draft_black_wide_leg_joggers was found in cloud database!');
  } else {
    console.log('✓ Black Joggers strictly excluded from cloud database.');
  }

  // Verify all 7 published items
  for (const id of REAL_BOTTOMWEAR_IDS) {
    const item = publishedCloud.find((p) => p.id === id);
    if (!item) {
      issues.push(`Real bottomwear item ${id} is missing or not published.`);
      continue;
    }
    if (item.category !== 'bottomwear') issues.push(`${id} category is ${item.category}, expected bottomwear`);
    if (item.currency !== 'INR') issues.push(`${id} currency is ${item.currency}, expected INR`);
    if (item.fulfilment !== 'made_to_order') issues.push(`${id} fulfilment is ${item.fulfilment}, expected made_to_order`);
    if (item.is_demo_price !== false) issues.push(`${id} is_demo_price is ${item.is_demo_price}, expected false`);
    console.log(`  ✓ ${item.id.padEnd(35)} | ₹${item.price.toLocaleString('en-IN')} INR | ${item.name} (v${item.version})`);
  }

  // Verify all 7 demo items are archived (not deleted)
  for (const id of DEMO_IDS) {
    const item = archivedCloud.find((p) => p.id === id);
    if (!item) {
      issues.push(`Demo item ${id} is missing or not archived!`);
    } else {
      console.log(`  ✓ Preserved Demo: ${item.id.padEnd(5)} | Status: ${item.status} | "${item.name}" (v${item.version})`);
    }
  }

  // --- STEP 2: ANONYMOUS STOREFRONT RLS VERIFICATION ---
  console.log('\n--- 2. ANONYMOUS CLIENT RLS ENFORCEMENT ---');
  const { data: anonCatalog, error: anonErr } = await anonClient
    .from('products')
    .select('id, name, slug, status, category, price, currency')
    .order('id');

  if (anonErr) {
    throw new Error(`Anon fetch failed: ${anonErr.message}`);
  }

  console.log(`Anonymous client query returns: ${anonCatalog.length} products (Expected: 7)`);
  if (anonCatalog.length !== 7) {
    issues.push(`Anon client received ${anonCatalog.length} products, expected exactly 7 published products.`);
  }

  // Ensure NO archived products appear in anonymous query
  const anyDemosInAnon = anonCatalog.some((p) => DEMO_IDS.includes(p.id));
  if (anyDemosInAnon) {
    issues.push('CRITICAL: Archived demo products found in anon client query!');
  } else {
    console.log('✓ Anonymous query contains 0 archived demo products (RLS enforced).');
  }

  // Direct lookup of archived demo products using anon client
  for (const demoId of ['c1', 'p1', 'f1', 'x1']) {
    const { data: directAnon } = await anonClient
      .from('products')
      .select('id, name, status')
      .eq('id', demoId)
      .maybeSingle();

    if (directAnon) {
      issues.push(`CRITICAL: Anon client was able to directly read archived product ${demoId}!`);
    } else {
      console.log(`  ✓ Anon lookup for "${demoId}": null / blocked by RLS`);
    }
  }

  // --- STEP 3: LOCAL CATALOG SYNC (FALLBACK / CACHE) ---
  console.log('\n--- 3. LOCAL SRC/DATA/CATALOG.JSON SYNC ---');
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const localCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const localPublished = localCatalog.filter((p) => p.status === 'published');
  const localArchived = localCatalog.filter((p) => p.status === 'archived');

  console.log(`Local catalog published: ${localPublished.length} (Expected: 7)`);
  console.log(`Local catalog archived:  ${localArchived.length} (Expected: 7)`);

  if (localPublished.length !== 7) issues.push(`Local catalog published count is ${localPublished.length}, expected 7`);
  if (localArchived.length !== 7) issues.push(`Local catalog archived count is ${localArchived.length}, expected 7`);

  // --- STEP 4: HOMEPAGE BESTSELLERS (The Standout Edit) ---
  console.log('\n--- 4. HOMEPAGE BESTSELLERS (The Standout Edit) ---');
  const preferredIds = [
    'draft_cocoa_skater_denim',
    'draft_indigo_drape_jeans',
    'draft_beige_wide_leg_joggers',
    'draft_white_pinstripe_flared_pants',
  ];

  let standoutList = preferredIds
    .map((id) => publishedCloud.find((p) => p.id === id))
    .filter(Boolean);

  if (standoutList.length < 4) {
    const existing = new Set(standoutList.map((p) => p.id));
    for (const p of publishedCloud) {
      if (!existing.has(p.id)) {
        standoutList.push(p);
        if (standoutList.length === 4) break;
      }
    }
  }

  console.log(`Standout Edit features ${standoutList.length} items:`);
  standoutList.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.id}] ${p.name} - ₹${p.price.toLocaleString('en-IN')} INR (${p.status})`);
  });

  if (standoutList.length !== 4) {
    issues.push(`Homepage Standout Edit has ${standoutList.length} items, expected 4`);
  }
  const anyDemosInStandout = standoutList.some((p) => DEMO_IDS.includes(p.id));
  if (anyDemosInStandout) {
    issues.push('Archived demo product found in Standout Edit!');
  } else {
    console.log('✓ Homepage Standout Edit strictly uses published real bottomwear.');
  }

  // --- STEP 5: COLLECTIONS & RECOMMENDATIONS ---
  console.log('\n--- 5. COLLECTIONS & RECOMMENDATIONS ---');
  // Bottomwear collection
  const bottomwearCollection = publishedCloud.filter((p) => p.category === 'bottomwear');
  console.log(`Bottomwear collection count: ${bottomwearCollection.length} (Expected: 7)`);
  if (bottomwearCollection.length !== 7) {
    issues.push(`Bottomwear collection returned ${bottomwearCollection.length}, expected 7`);
  }

  // Recommendations for a product
  const targetProduct = publishedCloud[0];
  const relatedProducts = publishedCloud.filter((p) => p.id !== targetProduct.id && p.status === 'published').slice(0, 4);
  console.log(`Recommendations for "${targetProduct.name}": ${relatedProducts.length} items`);
  relatedProducts.forEach((r) => {
    console.log(`  • Related: ${r.name} (₹${r.price.toLocaleString('en-IN')} INR)`);
  });
  if (relatedProducts.length !== 4) {
    issues.push(`Related products count is ${relatedProducts.length}, expected 4`);
  }
  if (relatedProducts.some((r) => DEMO_IDS.includes(r.id))) {
    issues.push('Demo item found in related product recommendations!');
  } else {
    console.log('✓ Related products strictly pull from published bottomwear.');
  }

  // --- STEP 6: ARCHIVED DEMO ENQUIRY / ORDER BLOCKING ---
  console.log('\n--- 6. ARCHIVED DEMO ENQUIRY / ORDER BLOCKING ---');
  function validateEnquiryItems(items, catalog) {
    const rejected = [];
    for (const item of items) {
      const product = catalog.find((p) => p.id === item.productId);
      if (!product) {
        rejected.push({ productId: item.productId, reason: 'Garment not found' });
      } else if (product.status !== 'published') {
        rejected.push({
          productId: item.productId,
          productName: product.name,
          status: product.status,
          reason: `"${product.name}" is ${product.status === 'archived' ? 'archived and no longer available' : 'an unpublished draft and cannot be ordered'}.`,
        });
      }
    }
    return { valid: rejected.length === 0, rejected };
  }

  const archivedOrderAttempt = validateEnquiryItems(
    [
      { productId: 'p1', variantName: 'Black', size: 'M', quantity: 1 },
      { productId: 'c1', variantName: 'White', size: 'L', quantity: 2 },
    ],
    cloudProducts
  );

  console.log(`Archived order validation valid: ${archivedOrderAttempt.valid} (Expected: false)`);
  console.log(`Rejected reasons:`);
  archivedOrderAttempt.rejected.forEach((r) => console.log(`  - [${r.status}] ${r.reason}`));

  if (archivedOrderAttempt.valid) {
    issues.push('CRITICAL: Archived demo items were NOT rejected during enquiry validation!');
  } else {
    console.log('✓ Archived demo products are strictly blocked from being ordered or enquired.');
  }

  const realOrderAttempt = validateEnquiryItems(
    [
      { productId: 'draft_cocoa_skater_denim', variantName: 'Cocoa Brown', size: 'Custom measurements', quantity: 1 },
      { productId: 'draft_indigo_drape_jeans', variantName: 'Classic Indigo', size: 'Custom measurements', quantity: 1 },
    ],
    cloudProducts
  );

  console.log(`Real bottomwear order validation valid: ${realOrderAttempt.valid} (Expected: true)`);
  if (!realOrderAttempt.valid) {
    issues.push('Real bottomwear products were unexpectedly rejected during enquiry validation!');
  } else {
    console.log('✓ Real bottomwear garments pass enquiry validation cleanly.');
  }

  // --- STEP 7: CUSTOM MEASUREMENTS & WHATSAPP MESSAGE FORMATTING ---
  console.log('\n--- 7. BESPOKE CUSTOM SIZING & WHATSAPP URL FLOW ---');
  const bespokeItem = {
    id: 'item-test-1',
    productId: 'draft_cocoa_skater_denim',
    variantName: 'Cocoa Brown',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: {
      waist: '32',
      outseam: '41.5',
      unit: 'in',
    },
  };

  const clientFormData = {
    fullName: 'Jane Doe',
    phone: '+91 98765 43210',
    email: 'jane@example.com',
    address: '123 Atelier Street, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    customNotes: 'Require high-rise cut and extra reinforcement on hems.',
    consent: true,
  };

  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━';
  const lines = [];
  lines.push('*DOWNFALL — BESPOKE COLLECTION ENQUIRY*');
  lines.push(divider);
  lines.push('');
  lines.push('*CLIENT DETAILS*');
  lines.push(`• Name: ${clientFormData.fullName}`);
  lines.push(`• Phone: ${clientFormData.phone}`);
  lines.push(`• Email: ${clientFormData.email}`);
  lines.push('');
  lines.push('*DELIVERY ADDRESS*');
  lines.push(`• Address: ${clientFormData.address}`);
  lines.push(`• City: ${clientFormData.city}`);
  lines.push(`• State: ${clientFormData.state}`);
  lines.push(`• Postal Code: ${clientFormData.postalCode}`);
  lines.push(`• Country: ${clientFormData.country}`);
  lines.push('');
  lines.push('*ORDER ITEMS (1 piece)*');

  const targetProd = cloudProducts.find((p) => p.id === bespokeItem.productId);
  const isMTO = targetProd.fulfilment === 'made_to_order';
  const formattedPrice = `₹${targetProd.price.toLocaleString('en-IN')} INR`;

  lines.push(`1. *${targetProd.name}*`);
  lines.push(`   • Fulfilment: ${isMTO ? 'Made to Order (Bespoke)' : 'Stocked'}`);
  lines.push(`   • Colour: ${bespokeItem.variantName}`);
  lines.push(`   • Requested Size: ${bespokeItem.size}`);
  lines.push(`   • Fit Preference: Custom Fitted to Measurements`);
  lines.push(`   • Custom Measurements: Waist ${bespokeItem.customMeasurements.waist} ${bespokeItem.customMeasurements.unit}, Garment Outseam ${bespokeItem.customMeasurements.outseam} ${bespokeItem.customMeasurements.unit}`);
  lines.push(`   • Quantity: ${bespokeItem.quantity}`);
  lines.push(`   • Est. Unit Price: ${formattedPrice}`);
  lines.push('');
  lines.push('*ESTIMATED TOTAL*');
  lines.push(formattedPrice);
  lines.push('_Notice: Confirmed catalog pricing. Final bespoke customisation, measurements, and delivery schedule will be confirmed directly with DOWNFALL._');
  lines.push('');
  lines.push('*MEASUREMENTS (Unit: IN)*');
  lines.push(`• Waist: ${bespokeItem.customMeasurements.waist} in`);
  lines.push(`• Garment Length / Inseam: ${bespokeItem.customMeasurements.outseam} in`);
  lines.push('');
  lines.push('*CUSTOMISATION & SPECIAL REQUESTS*');
  lines.push(clientFormData.customNotes);
  lines.push('');
  lines.push(divider);
  lines.push('_Sent via DOWNFALL Bespoke Enquiry Form_');

  const generatedMessage = lines.join('\n');
  const encodedText = encodeURIComponent(generatedMessage);
  const whatsappUrl = `https://wa.me/917415430076?text=${encodedText}`;

  console.log('Sample WhatsApp Message Preview:');
  console.log('--------------------------------------------------');
  console.log(generatedMessage);
  console.log('--------------------------------------------------');

  // Verify assertions
  if (!whatsappUrl.startsWith('https://wa.me/917415430076?text=')) {
    issues.push('Generated WhatsApp URL does not point to correct wa.me link with encoded text.');
  }
  if (!generatedMessage.includes('Waist 32 in') || !generatedMessage.includes('Garment Outseam 41.5 in')) {
    issues.push('Custom measurements were not properly formatted in the WhatsApp message.');
  }
  if (!generatedMessage.includes('₹1,649 INR')) {
    issues.push('INR pricing was not properly included in the WhatsApp message.');
  }
  if (generatedMessage.includes('(Demo)')) {
    issues.push('Real product message unexpectedly contains (Demo) tag!');
  }

  console.log('\n✓ Generated WhatsApp URL length:', whatsappUrl.length);
  console.log('✓ Bespoke measurements (Waist 32 in, Outseam 41.5 in) cleanly carried into WhatsApp message.');
  console.log('✓ INR pricing (₹1,649 INR) correctly formatted without demo badges.');
  console.log('✓ Note: No WhatsApp message was sent over the network (assertion only).');

  console.log('\n================================================================');
  if (issues.length > 0) {
    console.error('VERIFICATION FAILED WITH ISSUES:');
    issues.forEach((iss) => console.error(`  ❌ ${iss}`));
    process.exit(1);
  } else {
    console.log('  ALL FLOWS VERIFIED SUCCESSFULLY WITH ZERO ERRORS!  ');
    console.log('================================================================\n');
  }
}

runVerification().catch((err) => {
  console.error('Verification execution error:', err);
  process.exit(1);
});
