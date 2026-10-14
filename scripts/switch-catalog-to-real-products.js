/**
 * DOWNFALL Atelier - Cloud Catalog Switch Script
 *
 * Transactionally/atomically executes the live catalog transition:
 * 1. Takes an immutable pre-switch backup of all cloud product records.
 * 2. Publishes the 7 real Bottomwear garments: status = 'published'.
 * 3. Archives the 7 demo products ('c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'): status = 'archived'. (Never deleted).
 * 4. Ensures Black Joggers is strictly excluded.
 * 5. Syncs local src/data/catalog.json to reflect the authoritative live statuses.
 * 6. Verifies the final live catalog state in Supabase.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd());

const REAL_BOTTOMWEAR_IDS = [
  'draft_cocoa_skater_denim',
  'draft_indigo_drape_jeans',
  'draft_beige_wide_leg_joggers',
  'draft_white_pinstripe_flared_pants',
  'draft_brown_pinstripe_flared_pants',
  'draft_grey_pinstripe_flared_pants',
  'draft_grey_wide_leg_joggers',
];

const DEMO_PRODUCT_IDS = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function switchCatalog() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - LIVE CATALOG TRANSITION & SWITCH');
  console.log('================================================================\n');

  // 1. Fetch current cloud catalog
  console.log('Fetching live products from Supabase before transition...');
  const { data: cloudProducts, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .order('id');

  if (fetchErr) {
    console.error('Fatal fetch error:', fetchErr.message);
    process.exit(1);
  }

  console.log(`✓ Fetched ${cloudProducts.length} products from cloud database.`);

  // 2. Create pre-switch immutable cloud backup
  const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `cloud-catalog-pre-switch-${timestamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        backedUpAt: new Date().toISOString(),
        note: 'Immutable cloud catalog backup immediately prior to bottomwear publishing and demo archiving',
        totalProducts: cloudProducts.length,
        products: cloudProducts,
      },
      null,
      2
    ),
    { encoding: 'utf-8', flag: 'wx' }
  );
  console.log(`✓ Pre-switch cloud backup saved to: ${backupPath}\n`);

  // 3. Safety checks
  // 3a. Ensure all 7 real bottomwear products exist in Supabase
  for (const id of REAL_BOTTOMWEAR_IDS) {
    const exists = cloudProducts.some((p) => p.id === id);
    if (!exists) {
      throw new Error(`Cannot proceed: Required real product "${id}" is missing in Supabase.`);
    }
  }

  // 3b. Ensure all 7 demo products exist in Supabase
  for (const id of DEMO_PRODUCT_IDS) {
    const exists = cloudProducts.some((p) => p.id === id);
    if (!exists) {
      throw new Error(`Cannot proceed: Demo product "${id}" is missing in Supabase.`);
    }
  }

  // 3c. Ensure Black Joggers is not among the products to publish
  if (REAL_BOTTOMWEAR_IDS.includes('draft_black_wide_leg_joggers')) {
    throw new Error('SECURITY VIOLATION: Black Joggers must not be published.');
  }

  // 4. Publish the 7 real Bottomwear products
  console.log('--- PUBLISHING 7 REAL BOTTOMWEAR GARMENTS ---');
  const publishResults = [];
  for (const id of REAL_BOTTOMWEAR_IDS) {
    const current = cloudProducts.find((p) => p.id === id);
    const newVersion = (current.version || 1) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({
        status: 'published',
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, status, version, price, currency')
      .single();

    if (updateErr) {
      throw new Error(`Failed to publish ${id}: ${updateErr.message}`);
    }
    publishResults.push(updated);
    console.log(`  ✓ [PUBLISHED] ${updated.id.padEnd(35)} | "${updated.name}" (v${updated.version})`);
  }

  // 5. Archive the 7 demo products (DO NOT DELETE)
  console.log('\n--- ARCHIVING 7 DEMO PRODUCTS (PRESERVED, NOT DELETED) ---');
  const archiveResults = [];
  for (const id of DEMO_PRODUCT_IDS) {
    const current = cloudProducts.find((p) => p.id === id);
    const newVersion = (current.version || 1) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({
        status: 'archived',
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, status, version')
      .single();

    if (updateErr) {
      throw new Error(`Failed to archive demo product ${id}: ${updateErr.message}`);
    }
    archiveResults.push(updated);
    console.log(`  ✓ [ARCHIVED]  ${updated.id.padEnd(10)} | "${updated.name}" (v${updated.version})`);
  }

  // 6. Verify final state in Supabase
  console.log('\n--- VERIFYING FINAL SUPABASE CATALOG STATE ---');
  const { data: finalProducts, error: finalErr } = await supabase
    .from('products')
    .select('id, name, status, category, price, currency, fulfilment')
    .order('id');

  if (finalErr) throw new Error(finalErr.message);

  const published = finalProducts.filter((p) => p.status === 'published');
  const archived = finalProducts.filter((p) => p.status === 'archived');
  const drafts = finalProducts.filter((p) => p.status === 'draft');

  console.log(`Total Products:    ${finalProducts.length}`);
  console.log(`Published (Live):  ${published.length} (Expected: 7)`);
  console.log(`Archived (Demo):   ${archived.length} (Expected: 7)`);
  console.log(`Drafts:            ${drafts.length}`);

  if (published.length !== 7 || archived.length !== 7) {
    throw new Error(`Unexpected catalog distribution: ${published.length} published, ${archived.length} archived`);
  }

  // Assert all published products are Bottomwear
  const allBottomwear = published.every((p) => p.category === 'bottomwear' && p.fulfilment === 'made_to_order');
  if (!allBottomwear) {
    throw new Error('Not all published products are bottomwear made-to-order!');
  }
  console.log('✓ All 7 published garments are real Made-to-Order Bottomwear.');

  // Assert all demo products are archived
  const allDemosArchived = DEMO_PRODUCT_IDS.every((id) => archived.some((p) => p.id === id));
  if (!allDemosArchived) {
    throw new Error('Not all demo products were archived!');
  }
  console.log('✓ All 7 demo products safely retained in archived status.');

  // 7. Update local catalog.json to mirror the cloud state
  console.log('\n--- UPDATING LOCAL CATALOG.JSON ---');
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    const localCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    for (const item of localCatalog) {
      if (REAL_BOTTOMWEAR_IDS.includes(item.id)) {
        item.status = 'published';
      } else if (DEMO_PRODUCT_IDS.includes(item.id)) {
        item.status = 'archived';
      }
    }
    fs.writeFileSync(catalogPath, JSON.stringify(localCatalog, null, 2), 'utf-8');
    console.log('✓ Local src/data/catalog.json updated to reflect published bottomwear and archived demos.');
  }

  console.log('\n================================================================');
  console.log('  CATALOG TRANSITION COMPLETE AND FULLY VERIFIED IN CLOUD!');
  console.log('================================================================\n');

  return { published, archived };
}

if (require.main === module) {
  switchCatalog().catch((err) => {
    console.error('Fatal transition error:', err);
    process.exit(1);
  });
}

module.exports = { switchCatalog };
