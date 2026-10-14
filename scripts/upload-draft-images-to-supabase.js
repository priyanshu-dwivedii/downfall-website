/**
 * DOWNFALL Atelier - Upload Draft Bottomwear Images to Supabase Storage
 *
 * Uploads all 34 active gallery images across the seven bottomwear drafts to
 * the 'catalog-images' public bucket in Supabase Storage.
 *
 * Strict Rules:
 * - Excludes archived incorrect Grey Joggers photos (in /archive/).
 * - Uploads only active PNG assets from public/products/.
 * - Preserves exact original PNG format and byte-level resolution.
 * - Idempotent upsert allows re-running safely.
 * - Maps product and variant image references to their authoritative cloud URLs.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd());

const TARGET_DRAFT_IDS = [
  'draft_cocoa_skater_denim',
  'draft_indigo_drape_jeans',
  'draft_beige_wide_leg_joggers',
  'draft_white_pinstripe_flared_pants',
  'draft_brown_pinstripe_flared_pants',
  'draft_grey_pinstripe_flared_pants',
  'draft_grey_wide_leg_joggers',
];

const BUCKET_NAME = 'catalog-images';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function uploadDraftImages() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - DRAFT BOTTOMWEAR IMAGE CLOUD UPLOAD');
  console.log('================================================================\n');

  // Verify catalog.json
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const drafts = catalog.filter((p) => TARGET_DRAFT_IDS.includes(p.id));
  if (drafts.length !== TARGET_DRAFT_IDS.length) {
    throw new Error(`Expected ${TARGET_DRAFT_IDS.length} drafts, found ${drafts.length}`);
  }

  // Collect all unique active local images referenced across the 7 drafts
  const imageMap = new Map(); // localRelativePath -> { draftId, fullPath, storagePath }
  
  for (const draft of drafts) {
    const allRefs = new Set([
      ...(draft.images || []),
      ...(draft.variants || []).map((v) => v.image).filter(Boolean),
    ]);

    for (const ref of allRefs) {
      // Must not reference archive folder
      if (ref.includes('archive') || ref.includes('original-flagged-images')) {
        throw new Error(`[CRITICAL SECURITY] Draft ${draft.id} references archived image: ${ref}`);
      }

      // Must be a public product path
      const cleanPath = ref.startsWith('/') ? ref.slice(1) : ref;
      const fullPath = path.join(process.cwd(), 'public', cleanPath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Referenced image not found on disk: ${fullPath} (product: ${draft.id})`);
      }

      const storagePath = cleanPath; // e.g. "products/grey-wide-leg-joggers/grey-wide-leg-joggers-1.png"
      if (!imageMap.has(ref)) {
        imageMap.set(ref, {
          ref,
          fullPath,
          storagePath,
          size: fs.statSync(fullPath).size,
          draftIds: [draft.id],
        });
      } else {
        imageMap.get(ref).draftIds.push(draft.id);
      }
    }
  }

  console.log(`Discovered ${imageMap.size} unique active image assets across the 7 drafts.`);
  if (imageMap.size !== 34) {
    throw new Error(`Expected exactly 34 active gallery images, but collected ${imageMap.size}!`);
  }

  // Verify storage bucket
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    throw new Error(`Failed to list storage buckets: ${bucketErr.message}`);
  }
  const bucket = buckets.find((b) => b.id === BUCKET_NAME || b.name === BUCKET_NAME);
  if (!bucket) {
    throw new Error(`Storage bucket "${BUCKET_NAME}" does not exist in Supabase!`);
  }
  console.log(`✓ Confirmed Supabase Storage bucket "${BUCKET_NAME}" is active.\n`);

  console.log('--- UPLOADING IMAGES TO SUPABASE STORAGE ---');
  const uploadResults = [];
  const urlMapping = {}; // localRef -> cloudUrl

  for (const [ref, info] of imageMap.entries()) {
    const fileBuffer = fs.readFileSync(info.fullPath);
    const contentType = 'image/png';

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(info.storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Upload failed for ${info.storagePath}: ${uploadErr.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(info.storagePath);

    const cloudUrl = publicUrlData.publicUrl;
    urlMapping[ref] = cloudUrl;

    uploadResults.push({
      localRef: ref,
      storagePath: info.storagePath,
      sizeBytes: info.size,
      cloudUrl,
      products: info.draftIds,
    });

    console.log(`  ✓ Uploaded: ${info.storagePath.padEnd(65)} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log(`\n✓ All ${uploadResults.length} images successfully uploaded to Supabase Storage.`);

  // Write image upload manifest
  const manifestPath = path.join(process.cwd(), 'src', 'data', 'draft-images-manifest.json');
  const manifestData = {
    uploadedAt: new Date().toISOString(),
    bucket: BUCKET_NAME,
    totalImages: uploadResults.length,
    images: uploadResults,
    urlMapping,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');
  console.log(`✓ Image upload manifest saved to: ${manifestPath}`);

  return { manifestData, urlMapping };
}

if (require.main === module) {
  uploadDraftImages().catch((err) => {
    console.error('Fatal upload error:', err);
    process.exit(1);
  });
}

module.exports = { uploadDraftImages, TARGET_DRAFT_IDS };
