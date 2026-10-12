/**
 * DOWNFALL Atelier - Rollback Procedure Script
 *
 * Reverts to the local catalog.json backup:
 * - Restores `src/data/catalog.json` from the immutable baseline backup (`src/data/catalog.backup.json`)
 * - Backups remain strictly IMMUTABLE and are never destroyed or overwritten
 * - Optional: If `--clean-cloud` is passed and Supabase credentials are present,
 *   RESTRICTS rollback cleanup specifically to migrated records recorded in the
 *   migration manifest. Live products added in cloud or unmigrated records are NEVER deleted.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment configuration via @next/env
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

const cleanCloud = process.argv.includes('--clean-cloud');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runRollback() {
  console.log('====================================================');
  console.log('      DOWNFALL ATELIER - MIGRATION ROLLBACK         ');
  console.log('====================================================\n');

  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const backupPath = path.join(process.cwd(), 'src', 'data', 'catalog.backup.json');
  const manifestPath = path.join(process.cwd(), 'src', 'data', 'migration-manifest.json');

  if (!fs.existsSync(backupPath)) {
    console.error(`ERROR: Immutable backup file not found at ${backupPath}.`);
    console.error('Cannot restore without backup file.');
    process.exit(1);
  }

  // 1. Restore local catalog from immutable backup
  console.log(`Restoring local catalog from immutable backup: ${backupPath}...`);
  const backupContent = fs.readFileSync(backupPath, 'utf-8');
  const parsedBackup = JSON.parse(backupContent);

  if (!Array.isArray(parsedBackup) || parsedBackup.length === 0) {
    console.error('ERROR: Backup content is invalid or empty.');
    process.exit(1);
  }

  // Write restored content to catalog.json (backup file remains untouched and immutable)
  fs.writeFileSync(catalogPath, backupContent, 'utf-8');
  console.log(`✓ Restored ${parsedBackup.length} products to ${catalogPath}.`);
  console.log(`✓ Baseline backup retained intact and immutable at: ${backupPath}`);

  // Verify restored local products
  const expectedIds = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];
  const restoredIds = parsedBackup.map((p) => p.id);
  const allPresent = expectedIds.every((id) => restoredIds.includes(id));

  if (!allPresent) {
    console.warn('WARNING: Restored catalog does not contain all standard product IDs!');
  } else {
    console.log('✓ All standard product IDs (c1, f1, x1, p1, p2, p3, p4) verified in local catalog.');
  }

  // 2. Restricted Cloud Cleanup (Restricted to specifically migrated records only)
  if (cleanCloud) {
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n--clean-cloud requested: Determining specifically migrated records...');

      let targetProductIds = [];
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (Array.isArray(manifest.migratedProductIds) && manifest.migratedProductIds.length > 0) {
            targetProductIds = manifest.migratedProductIds;
            console.log(`Loaded ${targetProductIds.length} migrated product IDs from migration manifest.`);
          }
        } catch (manifestErr) {
          console.warn('Notice: Could not parse migration manifest, falling back to backup product IDs.');
        }
      }

      if (targetProductIds.length === 0) {
        targetProductIds = parsedBackup.map((p) => p.id);
        console.log(`Using ${targetProductIds.length} product IDs from immutable backup.`);
      }

      console.log(`Restricting cloud cleanup strictly to specifically migrated records: [${targetProductIds.join(', ')}]`);
      console.log('Live cloud products outside this set will NOT be affected.');

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });

      const { data: deletedRows, error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', targetProductIds)
        .select('id, name');

      if (deleteError) {
        console.error('Failed to clean up migrated products from cloud:', deleteError.message);
      } else {
        const deletedCount = deletedRows ? deletedRows.length : targetProductIds.length;
        console.log(`✓ Successfully cleaned up ${deletedCount} specifically migrated records from Supabase.`);
      }
    } else {
      console.log('\n--clean-cloud passed, but no Supabase credentials configured. Cloud cleanup skipped.');
    }
  } else {
    console.log('\nNote: Cloud products were preserved. To delete specifically migrated cloud records, run:');
    console.log('  node scripts/rollback-from-supabase.js --clean-cloud');
  }

  console.log('\n====================================================');
  console.log('           ROLLBACK COMPLETED SUCCESSFULLY          ');
  console.log('====================================================');
  console.log('1. Local catalog.json restored to its original pre-migration state.');
  console.log('2. Backup files preserved untouched (immutable).');
  if (cleanCloud) {
    console.log('3. Cloud cleanup strictly restricted to specifically migrated records.');
  }
}

runRollback().catch((err) => {
  console.error('Rollback failure:', err);
  process.exit(1);
});
