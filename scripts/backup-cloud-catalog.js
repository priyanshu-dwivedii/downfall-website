/**
 * DOWNFALL Atelier - Cloud Catalog Backup Script
 *
 * Pulls the live catalog directly from Supabase, saves an immutable backup,
 * and records the exact current product IDs, statuses, and versions.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function backupCloudCatalog() {
  console.log('================================================================');
  console.log('  DOWNFALL ATELIER - CLOUD CATALOG BACKUP');
  console.log('================================================================\n');

  console.log('Fetching all live products from Supabase...');
  const { data: cloudProducts, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('ERROR querying Supabase products:', error.message);
    process.exit(1);
  }

  console.log(`✓ Fetched ${cloudProducts.length} products from cloud database.`);

  const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `cloud-catalog-backup-${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  const manifest = {
    backedUpAt: new Date().toISOString(),
    totalProducts: cloudProducts.length,
    productsSummary: cloudProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      version: p.version,
      category: p.category,
      price: p.price,
      currency: p.currency,
      imageCount: Array.isArray(p.images) ? p.images.length : 0,
      variantCount: Array.isArray(p.variants) ? p.variants.length : 0,
    })),
    products: cloudProducts,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(manifest, null, 2), { encoding: 'utf-8', flag: 'wx' });
  console.log(`✓ Immutable cloud backup saved to: ${backupFilePath}`);

  console.log('\n--- CURRENT CLOUD CATALOG METADATA ---');
  console.table(manifest.productsSummary);

  return manifest;
}

if (require.main === module) {
  backupCloudCatalog().catch((err) => {
    console.error('Fatal backup error:', err);
    process.exit(1);
  });
}

module.exports = { backupCloudCatalog };
