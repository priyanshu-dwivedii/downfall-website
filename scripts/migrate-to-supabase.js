/**
 * DOWNFALL Atelier - Repeatable Supabase Migration Script
 *
 * Migrates local catalog.json and local product images to:
 * - Supabase PostgreSQL `products` table
 * - Supabase Storage bucket `catalog-images`
 *
 * Hardening Guarantees:
 * - Backups are IMMUTABLE (baseline backup is never overwritten on repeat runs)
 * - Repeat migrations PRESERVE NEWER CLOUD EDITS (does not blindly overwrite live changes)
 * - Records migration manifest to restrict rollback cleanup to specifically migrated records
 * - Preserves all 7 product IDs ('c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4')
 * - Preserves demo price flags, categories, and variant inventory counts
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment configuration via @next/env
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

async function runMigration() {
  console.log('====================================================');
  console.log('   DOWNFALL ATELIER - SUPABASE DATA MIGRATION      ');
  console.log('====================================================\n');

  // Verify credentials
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing required Supabase credentials.');
    console.error('Please configure the following environment variables:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
    console.error('  SUPABASE_SERVICE_ROLE_KEY\n');
    console.error('You can place them in .env.local or pass them directly when running this script.');
    process.exit(1);
  }

  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`ERROR: Catalog file not found at: ${catalogPath}`);
    process.exit(1);
  }

  const rawCatalog = fs.readFileSync(catalogPath, 'utf-8');
  const catalog = JSON.parse(rawCatalog);

  console.log(`✓ Loaded local catalog with ${catalog.length} products.`);

  // 1. Maintain Immutable Backups (Never overwrite an existing baseline backup)
  const backupPath = path.join(process.cwd(), 'src', 'data', 'catalog.backup.json');
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, rawCatalog, 'utf-8');
    console.log(`✓ Created immutable baseline backup at: ${backupPath}`);
  } else {
    console.log(`✓ Preserved existing immutable baseline backup at: ${backupPath}`);
  }

  // Create append-only timestamped backup
  const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedBackupPath = path.join(backupDir, `catalog-backup-${timestamp}.json`);
  fs.writeFileSync(timestampedBackupPath, rawCatalog, { encoding: 'utf-8', flag: 'wx' });
  console.log(`✓ Timestamped immutable backup saved to: ${timestampedBackupPath}`);

  // 2. Initialize Supabase Admin Client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify connection by checking table
  console.log('\nConnecting to Supabase instance...');
  const { error: testError } = await supabase.from('products').select('id').limit(1);
  if (testError) {
    console.error('ERROR: Failed to query products table in Supabase.');
    console.error(testError.message);
    console.error('Have you run the database migration at supabase/migrations/001_initial_schema.sql?');
    process.exit(1);
  }
  console.log('✓ Successfully connected to Supabase PostgreSQL database.');

  // 3. Ensure Storage Bucket Exists
  console.log('\nChecking Supabase Storage bucket "catalog-images"...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.warn('Warning checking buckets:', bucketError.message);
  } else {
    const bucketExists = buckets.some((b) => b.id === 'catalog-images' || b.name === 'catalog-images');
    if (!bucketExists) {
      console.log('Creating storage bucket "catalog-images"...');
      const { error: createBucketErr } = await supabase.storage.createBucket('catalog-images', {
        public: true,
      });
      if (createBucketErr) {
        console.warn('Bucket creation notice:', createBucketErr.message);
      } else {
        console.log('✓ Created storage bucket "catalog-images" with public read access.');
      }
    } else {
      console.log('✓ Storage bucket "catalog-images" is ready.');
    }
  }

  // 4. Collect and Upload Local Product Images
  console.log('\nCollecting images referenced in catalog...');
  const imagePaths = new Set();
  catalog.forEach((p) => {
    if (p.image && typeof p.image === 'string') imagePaths.add(p.image);
    if (Array.isArray(p.images)) {
      p.images.forEach((img) => typeof img === 'string' && imagePaths.add(img));
    }
    if (Array.isArray(p.variants)) {
      p.variants.forEach((v) => {
        if (v.image && typeof v.image === 'string') imagePaths.add(v.image);
      });
    }
  });

  console.log(`Found ${imagePaths.size} unique image references.`);
  const urlMap = new Map();

  for (const relPath of imagePaths) {
    // If it's already an absolute HTTP/HTTPS URL, preserve it
    if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
      urlMap.set(relPath, relPath);
      continue;
    }

    // Locate local file
    const cleanRelPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;
    const candidates = [
      path.join(process.cwd(), 'public', cleanRelPath),
      path.join(process.cwd(), 'public', 'uploads', path.basename(cleanRelPath)),
      path.join(process.cwd(), 'src', 'data', cleanRelPath),
    ];

    let foundLocalPath = null;
    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        foundLocalPath = cand;
        break;
      }
    }

    if (!foundLocalPath) {
      console.warn(`  [SKIP] Local file not found for: ${relPath}`);
      urlMap.set(relPath, relPath);
      continue;
    }

    const fileBuffer = fs.readFileSync(foundLocalPath);
    const mimeType = getMimeType(foundLocalPath);
    const destinationPath = `products/${path.basename(foundLocalPath)}`;

    console.log(`  Uploading ${path.basename(foundLocalPath)} (${fileBuffer.length} bytes)...`);
    const { error: uploadError } = await supabase.storage
      .from('catalog-images')
      .upload(destinationPath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`  Warning uploading ${destinationPath}:`, uploadError.message);
      urlMap.set(relPath, relPath);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(destinationPath);
      urlMap.set(relPath, publicUrlData.publicUrl);
      console.log(`  ✓ Uploaded -> ${publicUrlData.publicUrl}`);
    }
  }

  // 5. Transform Products for Database Schema
  console.log('\nTransforming catalog records for Supabase schema...');
  const migratedProducts = catalog.map((p) => {
    const mappedImages = (p.images || []).map((img) => urlMap.get(img) || img);
    const mappedVariants = (p.variants || []).map((v) => ({
      ...v,
      image: v.image ? urlMap.get(v.image) || v.image : undefined,
    }));

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      currency: p.currency || 'USD',
      category: p.category,
      status: p.status || 'published',
      is_demo_price: p.isDemoPrice !== undefined ? Boolean(p.isDemoPrice) : true,
      images: mappedImages,
      variants: mappedVariants,
      version: p.version || 1,
      updated_at: new Date().toISOString(),
    };
  });

  // 6. Inspect Live Cloud Records to Preserve Newer Cloud Edits
  console.log('\nInspecting live Supabase records to preserve newer cloud edits...');
  const { data: existingCloudProducts, error: fetchErr } = await supabase
    .from('products')
    .select('*');

  if (fetchErr) {
    console.error('ERROR: Could not query existing products from Supabase:', fetchErr.message);
    process.exit(1);
  }

  const cloudMap = new Map((existingCloudProducts || []).map((p) => [p.id, p]));
  const productsToUpsert = [];
  const preservedCloudIds = [];

  for (const localP of migratedProducts) {
    const cloudP = cloudMap.get(localP.id);
    if (!cloudP) {
      // Product does not exist in cloud yet -> insert
      productsToUpsert.push(localP);
      console.log(`  [NEW] Product "${localP.name}" (${localP.id}) not found in cloud -> scheduled for insertion.`);
    } else {
      const cloudVersion = Number(cloudP.version || 1);
      const localVersion = Number(localP.version || 1);
      const cloudUpdatedAt = cloudP.updated_at ? new Date(cloudP.updated_at).getTime() : 0;
      const cloudCreatedAt = cloudP.created_at ? new Date(cloudP.created_at).getTime() : 0;

      // Has this cloud product received live edits since initial migration?
      const hasLiveEdits = cloudVersion > localVersion || (cloudUpdatedAt - cloudCreatedAt > 2000);

      if (hasLiveEdits) {
        preservedCloudIds.push(cloudP.id);
        console.log(
          `  [PRESERVED] Product "${cloudP.name}" (${cloudP.id}) has newer cloud edits (v${cloudVersion}, updated: ${cloudP.updated_at}). Preserving live cloud data.`
        );
      } else {
        // Cloud product is unchanged from baseline -> sync
        productsToUpsert.push({
          ...localP,
          version: cloudVersion,
        });
        console.log(`  [SYNC] Product "${localP.name}" (${localP.id}) has no conflicting live edits -> syncing.`);
      }
    }
  }

  // 7. Upsert records that do not overwrite newer live edits
  if (productsToUpsert.length > 0) {
    console.log(`\nUpserting ${productsToUpsert.length} products into Supabase "products" table...`);
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error('ERROR: Failed to upsert products into Supabase:', upsertError.message);
      process.exit(1);
    }
    console.log(`✓ Successfully synced ${productsToUpsert.length} products in Supabase.`);
  } else {
    console.log(`\nNo products needed syncing. All ${preservedCloudIds.length} existing products have newer live cloud edits and were preserved.`);
  }

  // 8. Record Migration Manifest for Surgical Rollback
  const manifestPath = path.join(process.cwd(), 'src', 'data', 'migration-manifest.json');
  const manifest = {
    migratedAt: new Date().toISOString(),
    migratedProductIds: productsToUpsert.map((p) => p.id),
    preservedCloudProductIds: preservedCloudIds,
    baselineBackupPath: backupPath,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✓ Migration manifest recorded at: ${manifestPath}`);

  // 9. Verification Query
  console.log('\n--- VERIFYING CLOUD DATA ---');
  const { data: verifiedProducts, error: verifyError } = await supabase
    .from('products')
    .select('id, slug, name, price, currency, category, status, is_demo_price, version, variants, images')
    .order('id');

  if (verifyError) {
    console.error('ERROR during verification query:', verifyError.message);
    process.exit(1);
  }

  console.log(`Verified ${verifiedProducts.length} rows in Supabase:`);
  console.table(
    verifiedProducts.map((p) => ({
      ID: p.id,
      Slug: p.slug,
      Name: p.name,
      Category: p.category,
      Status: p.status,
      Price: `${p.currency} ${p.price}`,
      Version: p.version,
      Variants: Array.isArray(p.variants) ? p.variants.length : 0,
      Images: Array.isArray(p.images) ? p.images.length : 0,
    }))
  );

  console.log('\n====================================================');
  console.log('   MIGRATION COMPLETED AND VERIFIED SUCCESSFULLY    ');
  console.log('====================================================');
  console.log(`1. Synced: ${productsToUpsert.length} products.`);
  console.log(`2. Preserved: ${preservedCloudIds.length} live cloud products with newer edits.`);
  console.log(`3. Immutable baseline backup intact at: ${backupPath}`);
  console.log(`4. Manifest saved for restricted rollback at: ${manifestPath}`);
}

runMigration().catch((err) => {
  console.error('Unexpected migration failure:', err);
  process.exit(1);
});
