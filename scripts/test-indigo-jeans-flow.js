const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('=== STARTING CLASSIC INDIGO DRAPE JEANS VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Verify Image Assets in public directory
  console.log('--- 1. Image Assets Verification ---');
  const imgDir = path.join(__dirname, '..', 'public', 'products', 'classic-indigo-drape-jeans');
  assert(fs.existsSync(imgDir), 'Directory public/products/classic-indigo-drape-jeans exists');

  for (let i = 1; i <= 5; i++) {
    const filename = `classic-indigo-drape-jeans-${i}.png`;
    const filePath = path.join(imgDir, filename);
    assert(fs.existsSync(filePath), `Image exists: ${filename}`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(stats.size > 1000000, `${filename} size is preserved original (${stats.size} bytes)`);
    }
  }

  // 2. Catalog Entry Verification
  console.log('\n--- 2. Catalog Entry Verification ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const indigo = catalog.find((p) => p.id === 'draft_indigo_drape_jeans');

  assert(Boolean(indigo), 'draft_indigo_drape_jeans exists in catalog.json');
  assert(indigo.name === 'Classic Indigo Drape Jeans', `Name is "Classic Indigo Drape Jeans" (actual: ${indigo.name})`);
  assert(indigo.slug === 'classic-indigo-drape-jeans', `Slug is "classic-indigo-drape-jeans" (actual: ${indigo.slug})`);
  assert(indigo.status === 'draft', `Status is draft (actual: ${indigo.status})`);
  assert(indigo.price === 1799, `Price is 1799 (actual: ${indigo.price})`);
  assert(indigo.currency === 'INR', `Currency is INR (actual: ${indigo.currency})`);
  assert(indigo.isDemoPrice === false, `isDemoPrice is false (actual: ${indigo.isDemoPrice})`);
  assert(indigo.category === 'bottomwear', `Category is bottomwear (actual: ${indigo.category})`);
  assert(indigo.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${indigo.fulfilment})`);
  assert(indigo.isMadeToOrder === true, `isMadeToOrder is true`);
  assert(Array.isArray(indigo.images) && indigo.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(indigo.images[0].includes('classic-indigo-drape-jeans-1.png'), 'Image 1 is primary');
  assert(indigo.images[1].includes('classic-indigo-drape-jeans-2.png'), 'Image 2 is second');
  assert(indigo.images[2].includes('classic-indigo-drape-jeans-3.png'), 'Image 3 is third');
  assert(indigo.images[3].includes('classic-indigo-drape-jeans-4.png'), 'Image 4 is fourth');
  assert(indigo.images[4].includes('classic-indigo-drape-jeans-5.png'), 'Image 5 is fifth');

  assert(indigo.variants.length === 1, 'Variants length is 1 (Indigo)');
  assert(indigo.variants[0].name === 'Indigo', 'Variant name is Indigo');
  assert(indigo.variants[0].hex === '#264E86', 'Variant hex is #264E86');
  assert(indigo.variants[0].sizes.length === 1, 'Sizes length is 1');
  assert(indigo.variants[0].sizes[0].size === 'Custom measurements', 'Sizing is "Custom measurements"');
  assert(indigo.description.includes('Upgrade your daily rotation with a classic indigo finish'), 'Description includes user overview');
  assert(indigo.description.includes('Classic Indigo Colour'), 'Description includes Key Features');
  assert(indigo.description.includes('Custom waist circumference and garment outseam'), 'Description includes Size & Fit info');

  assert(Array.isArray(indigo.measurements) && indigo.measurements.length === 2, 'Has 2 required measurements');
  assert(indigo.measurements.includes('Waist circumference'), 'Measurements include Waist circumference');
  assert(indigo.measurements.includes('Requested garment outseam'), 'Measurements include Requested garment outseam');

  console.log(`\nVerification Complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
