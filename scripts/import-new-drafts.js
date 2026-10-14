/**
 * DOWNFALL Atelier - Targeted Draft Import Script
 *
 * Imports ONLY the seven new made-to-order bottomwear drafts into Supabase.
 *
 * Guarantees:
 * - Does NOT perform a bulk import.
 * - Does NOT touch or overwrite existing demo products ('c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4') or live product edits.
 * - Keeps all seven garments strictly in 'draft' status (unpublished).
 * - Enforces authoritative 'made_to_order' fulfilment with is_made_to_order: true.
 * - Enforces INR currency and real pricing with is_demo_price: false.
 * - Defaults to DRY-RUN mode to avoid unexpected execution without explicit --execute flag.
 */

const fs = require('fs');
const path = require('path');

// 1. Target ID Whitelist - strictly restricted to the 7 intended bottomwear drafts (Black Joggers excluded)
const TARGET_DRAFT_IDS = [
  'draft_cocoa_skater_denim',
  'draft_indigo_drape_jeans',
  'draft_beige_wide_leg_joggers',
  'draft_white_pinstripe_flared_pants',
  'draft_brown_pinstripe_flared_pants',
  'draft_grey_pinstripe_flared_pants',
  'draft_grey_wide_leg_joggers',
];

// Protected demo product IDs that must NEVER be modified by this script
const PROTECTED_DEMO_IDS = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];

function loadEnv() {
  try {
    const { loadEnvConfig } = require('@next/env');
    loadEnvConfig(process.cwd());
  } catch (err) {
    const envFiles = ['.env.local', '.env'];
    for (const envFile of envFiles) {
      const fullPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  }
}

loadEnv();

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const forceOverwrite = args.includes('--force');

async function main() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - TARGETED DRAFT PRODUCT IMPORT');
  console.log(`  Mode: ${isExecute ? 'LIVE EXECUTION' : 'DRY-RUN / VERIFY ONLY (No DB changes)'}`);
  console.log('================================================================\n');

  // Load catalog.json
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`ERROR: catalog.json not found at: ${catalogPath}`);
    process.exit(1);
  }

  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`✓ Loaded local catalog containing ${rawCatalog.length} total entries.`);

  // Filter strictly for the 7 target drafts
  const targetedDrafts = rawCatalog.filter((item) => TARGET_DRAFT_IDS.includes(item.id));

  console.log(`✓ Located ${targetedDrafts.length} of ${TARGET_DRAFT_IDS.length} target draft products.`);

  if (targetedDrafts.length !== TARGET_DRAFT_IDS.length) {
    const missing = TARGET_DRAFT_IDS.filter((id) => !targetedDrafts.some((d) => d.id === id));
    console.error(`ERROR: Missing target draft IDs in catalog: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Safety Assertion: ensure NONE of the protected demo products are included
  const intersectedDemoIds = targetedDrafts.filter((d) => PROTECTED_DEMO_IDS.includes(d.id));
  if (intersectedDemoIds.length > 0) {
    console.error(`CRITICAL SAFETY ERROR: Target set contains protected demo IDs: ${intersectedDemoIds.map((d) => d.id).join(', ')}`);
    process.exit(1);
  }

  // Validate each draft's schema and fields
  console.log('\n--- DRAFT VERIFICATION & PREPARATION ---');
  const preparedRows = [];

  for (const draft of targetedDrafts) {
    // Assert status is draft
    if (draft.status !== 'draft') {
      console.error(`ERROR: Product "${draft.name}" (${draft.id}) status is "${draft.status}". Must be "draft".`);
      process.exit(1);
    }

    // Assert fulfilment is made_to_order and isMadeToOrder is true
    const fulfilment = draft.fulfilment || 'made_to_order';
    if (fulfilment !== 'made_to_order') {
      console.error(`ERROR: Product "${draft.name}" (${draft.id}) fulfilment is "${fulfilment}". Must be "made_to_order".`);
      process.exit(1);
    }

    // Load image upload manifest if present to map cloud URLs
    const imageManifestPath = path.join(process.cwd(), 'src', 'data', 'draft-images-manifest.json');
    let urlMapping = {};
    if (fs.existsSync(imageManifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(imageManifestPath, 'utf-8'));
        urlMapping = manifest.urlMapping || {};
      } catch (err) {
        console.warn('Notice: Could not parse draft-images-manifest.json:', err.message);
      }
    }

    const mapUrl = (ref) => urlMapping[ref] || ref;

    const mappedImages = (draft.images || []).map(mapUrl);
    const mappedVariants = (draft.variants || []).map((v) => ({
      ...v,
      image: v.image ? mapUrl(v.image) : v.image,
    }));

    const row = {
      id: draft.id,
      slug: draft.slug,
      name: draft.name,
      description: draft.description || '',
      price: Number(draft.price),
      currency: draft.currency || 'INR',
      category: draft.category || 'bottomwear',
      status: 'draft', // Strictly unpublished
      is_demo_price: false, // Real commercial pricing
      fulfilment: 'made_to_order',
      is_made_to_order: true,
      production_time: draft.productionTime || '',
      care_instructions: draft.careInstructions || '',
      measurements: Array.isArray(draft.measurements) ? draft.measurements : [],
      reference_note: draft.referenceNote || null,
      image_correction_required: Boolean(draft.imageCorrectionRequired),
      image_correction_note: draft.imageCorrectionNote || null,
      images: mappedImages,
      variants: mappedVariants,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    // Guardrail: Flagged images must NEVER be published
    if (draft.imageCorrectionRequired && row.status === 'published') {
      throw new Error(`[SECURITY] Product ${draft.id} has images flagged for correction and cannot be imported with status="published"!`);
    }

    preparedRows.push(row);
    const flagTag = draft.imageCorrectionRequired ? ' | ⚠️ IMAGES FLAGGED FOR CORRECTION' : '';
    const cloudImgCount = row.images.filter((img) => img.startsWith('https://')).length;
    console.log(`  [OK] ${row.id.padEnd(35)} | ₹${row.price} ${row.currency} | ${row.category} | ${cloudImgCount}/${row.images.length} cloud images | status: ${row.status}${flagTag}`);
  }

  console.log(`\n✓ All ${preparedRows.length} draft records verified and structured for Supabase.`);

  if (!isExecute) {
    console.log('\n================================================================');
    console.log('  DRY-RUN SUMMARY');
    console.log('================================================================');
    console.log(`  Targeted Draft Products (${preparedRows.length}):`);
    preparedRows.forEach((r, i) => {
      const orig = targetedDrafts.find((d) => d.id === r.id);
      const flagNotice = orig?.imageCorrectionRequired ? ' [⚠️ IMAGES FLAGGED FOR CORRECTION - DO NOT PUBLISH]' : '';
      console.log(`    ${i + 1}. [${r.id}] "${r.name}" (Slug: ${r.slug}, Price: ₹${r.price} INR)${flagNotice}`);
    });
    console.log('\n  Protected Demo Products (Untouched):');
    PROTECTED_DEMO_IDS.forEach((id) => {
      console.log(`    • ${id} preserved in current state`);
    });
    console.log('\n  Status: All drafts set to unpublished ("draft").');
    console.log('  Notice: Database changes were NOT executed.');
    console.log('  To execute when approved: node scripts/import-new-drafts.js --execute');
    console.log('================================================================\n');
    return;
  }

  // If --execute was passed:
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Supabase credentials missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log('\nConnecting to Supabase...');

  // Inspect existing records in Supabase for these 7 IDs
  const { data: existingRows, error: checkErr } = await supabase
    .from('products')
    .select('id, name, status, version')
    .in('id', TARGET_DRAFT_IDS);

  if (checkErr) {
    console.error('ERROR inspecting Supabase products:', checkErr.message);
    process.exit(1);
  }

  const existingMap = new Map((existingRows || []).map((r) => [r.id, r]));

  for (const row of preparedRows) {
    const existing = existingMap.get(row.id);
    if (existing && !forceOverwrite) {
      console.log(`  [SKIP] ${row.id} already exists in Supabase (v${existing.version}, status: ${existing.status}). Preserving live edits.`);
      continue;
    }

    const { error: upsertErr } = await supabase
      .from('products')
      .upsert(row, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`  [FAIL] Failed to import ${row.id}:`, upsertErr.message);
    } else {
      console.log(`  [INSERTED] ${row.id} successfully written to Supabase.`);
    }
  }

  console.log('\n✓ Targeted draft import complete.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
