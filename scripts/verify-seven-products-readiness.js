const fs = require('fs');
const path = require('path');
const http = require('http');

async function runVerification() {
  console.log('========================================================================');
  console.log('  DOWNFALL ATELIER - SEVEN INTENDED PRODUCTS READINESS & GALLERY CHECK');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  function httpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      });
      req.on('error', reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  // Load catalog.json
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const TARGET_SEVEN_IDS = [
    'draft_cocoa_skater_denim',
    'draft_indigo_drape_jeans',
    'draft_beige_wide_leg_joggers',
    'draft_white_pinstripe_flared_pants',
    'draft_brown_pinstripe_flared_pants',
    'draft_grey_pinstripe_flared_pants',
    'draft_grey_wide_leg_joggers',
  ];

  // -------------------------------------------------------------------------
  // 1. LOCAL GALLERY & ASSET VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- 1. LOCAL GALLERY & ASSET VERIFICATION ---');

  const EXPECTED_ASSETS = {
    draft_cocoa_skater_denim: {
      folder: '90s-retro-cocoa-skater-denim',
      count: 5,
      prefix: 'cocoa-skater-denim',
    },
    draft_indigo_drape_jeans: {
      folder: 'classic-indigo-drape-jeans',
      count: 5,
      prefix: 'classic-indigo-drape-jeans',
    },
    draft_beige_wide_leg_joggers: {
      folder: 'beige-wide-leg-joggers',
      count: 5,
      prefix: 'beige-wide-leg-joggers',
    },
    draft_white_pinstripe_flared_pants: {
      folder: 'white-pinstripe-flared-pants',
      count: 5,
      prefix: 'white-pinstripe-flared-pants',
    },
    draft_brown_pinstripe_flared_pants: {
      folder: 'brown-pinstripe-flared-pants',
      count: 5,
      prefix: 'brown-pinstripe-flared-pants',
    },
    draft_grey_pinstripe_flared_pants: {
      folder: 'grey-pinstripe-flared-pants',
      count: 5,
      prefix: 'grey-pinstripe-flared-pants',
    },
    draft_grey_wide_leg_joggers: {
      folder: 'grey-wide-leg-joggers',
      count: 4, // Exactly 4 corrected PNGs
      prefix: 'grey-wide-leg-joggers',
    },
  };

  const publicProductsDir = path.join(__dirname, '..', 'public', 'products');

  for (const id of TARGET_SEVEN_IDS) {
    const config = EXPECTED_ASSETS[id];
    const product = catalog.find((p) => p.id === id);
    assert(Boolean(product), `${id} exists in catalog.json`);

    const productDir = path.join(publicProductsDir, config.folder);
    assert(fs.existsSync(productDir), `${product.name}: Folder public/products/${config.folder} exists`);

    // Verify disk image assets
    for (let i = 1; i <= config.count; i++) {
      const filename = `${config.prefix}-${i}.png`;
      const filePath = path.join(productDir, filename);
      const exists = fs.existsSync(filePath);
      assert(exists, `${product.name}: File ${filename} exists on disk`);
      if (exists) {
        const stats = fs.statSync(filePath);
        assert(stats.size > 1000000, `${product.name}: ${filename} size is valid high-res PNG (${stats.size} bytes)`);
      }
    }

    // Verify catalog gallery array
    assert(
      Array.isArray(product.images) && product.images.length === config.count,
      `${product.name}: Catalog images array has exactly ${config.count} items (actual: ${product.images?.length})`
    );
    assert(
      product.images[0].includes(`${config.prefix}-1.png`),
      `${product.name}: Image 1 is primary in gallery`
    );

    // Verify variant image
    assert(
      product.variants.length > 0 && product.variants[0].image.includes(`${config.prefix}-1.png`),
      `${product.name}: Variant image points to primary Image 1`
    );
  }

  // Specific Grey Joggers Gallery Assertions
  console.log('\n--- Grey Wide Leg Joggers Gallery Isolation & Corrections ---');
  const greyJoggers = catalog.find((p) => p.id === 'draft_grey_wide_leg_joggers');
  const greyDir = path.join(publicProductsDir, 'grey-wide-leg-joggers');

  assert(
    !fs.existsSync(path.join(greyDir, 'grey-wide-leg-joggers-5.png')),
    'Grey Joggers: 5th image (old black-tipped) removed from active directory'
  );
  assert(
    !greyJoggers.images.some((img) => img.includes('grey-wide-leg-joggers-5.png')),
    'Grey Joggers: 5th image removed from catalog gallery array'
  );

  const publicBackupDir = path.join(greyDir, 'original-flagged-drawstring');
  const privateArchiveDir = path.join(__dirname, '..', 'archive', 'original-flagged-images', 'grey-wide-leg-joggers');
  assert(
    !fs.existsSync(publicBackupDir),
    'Grey Joggers: Backups removed from public/ to avoid inclusion in deployment assets'
  );
  assert(
    fs.existsSync(path.join(privateArchiveDir, 'grey-wide-leg-joggers-1.png')) &&
    fs.existsSync(path.join(privateArchiveDir, 'grey-wide-leg-joggers-5.png')),
    'Grey Joggers: Original files preserved privately in archive/original-flagged-images/grey-wide-leg-joggers'
  );

  assert(
    !greyJoggers.imageCorrectionRequired,
    'Grey Joggers: imageCorrectionRequired flag is cleared'
  );
  assert(
    !greyJoggers.imageCorrectionNote,
    'Grey Joggers: imageCorrectionNote is cleared'
  );

  // Black Joggers Exclusion
  console.log('\n--- Black Joggers Exclusion Check ---');
  const blackJoggers = catalog.find((p) => p.id === 'draft_black_wide_leg_joggers');
  assert(Boolean(blackJoggers), 'draft_black_wide_leg_joggers exists in catalog');
  assert(
    Array.isArray(blackJoggers.images) && blackJoggers.images.length === 0,
    'Black Joggers: images array is empty (pending assets)'
  );
  assert(
    !TARGET_SEVEN_IDS.includes(blackJoggers.id),
    'Black Joggers: Excluded from planned 7-product batch'
  );

  // -------------------------------------------------------------------------
  // 2. MEASUREMENT-FLOW VERIFICATION FOR THE 7 PRODUCTS
  // -------------------------------------------------------------------------
  console.log('\n--- 2. MEASUREMENT-FLOW VERIFICATION ---');

  const EXPECTED_PRICING = {
    draft_cocoa_skater_denim: 1649,
    draft_indigo_drape_jeans: 1799,
    draft_beige_wide_leg_joggers: 1299,
    draft_white_pinstripe_flared_pants: 1549,
    draft_brown_pinstripe_flared_pants: 1549,
    draft_grey_pinstripe_flared_pants: 1549,
    draft_grey_wide_leg_joggers: 1299,
  };

  for (const id of TARGET_SEVEN_IDS) {
    const product = catalog.find((p) => p.id === id);

    assert(product.category === 'bottomwear', `${product.name}: category is "bottomwear"`);
    assert(product.fulfilment === 'made_to_order', `${product.name}: fulfilment is "made_to_order"`);
    assert(product.isMadeToOrder === true, `${product.name}: isMadeToOrder is true`);
    assert(product.currency === 'INR', `${product.name}: currency is "INR"`);
    assert(product.isDemoPrice === false, `${product.name}: isDemoPrice is false`);
    assert(
      product.price === EXPECTED_PRICING[id],
      `${product.name}: price is ₹${EXPECTED_PRICING[id]} (actual: ${product.price})`
    );

    // Custom measurements setup
    assert(
      product.variants.length > 0 &&
      product.variants[0].sizes.length === 1 &&
      product.variants[0].sizes[0].size === 'Custom measurements' &&
      product.variants[0].sizes[0].available === true,
      `${product.name}: Sizing is "Custom measurements" (available: true)`
    );

    assert(
      Array.isArray(product.measurements) &&
      product.measurements.includes('Waist circumference') &&
      product.measurements.includes('Requested garment outseam'),
      `${product.name}: Requires Waist circumference and Requested garment outseam`
    );

    assert(
      typeof product.referenceNote === 'string' && product.referenceNote.includes('Customer values remain blank by default'),
      `${product.name}: Reference note configured and enforces blank customer defaults`
    );
  }

  // -------------------------------------------------------------------------
  // 3. PUBLICATION-READINESS VERIFICATION (CANPUBLISH & REMAINING BLOCKERS)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. PUBLICATION-READINESS VERIFICATION ---');

  // Load publication validator
  function validatePublishability(p) {
    const missingFields = [];
    if (!p.name || !p.name.trim()) missingFields.push('Product name');
    if (p.price === undefined || isNaN(Number(p.price)) || Number(p.price) <= 0) missingFields.push('Valid price (> 0)');
    if (!p.category || !['basics', 'formal', 'luxury', 'bottomwear'].includes(p.category)) missingFields.push('Valid category');
    if (!p.description || !p.description.trim()) missingFields.push('Product description');

    if (p.imageCorrectionRequired) {
      missingFields.push('Corrected product photography (flagged)');
    }

    const hasPhotos = Array.isArray(p.images) && p.images.length > 0 && p.images.some((img) => img && img.trim().length > 0);
    if (!hasPhotos) missingFields.push('Product photography / imagery');

    const isMTO = p.fulfilment ? p.fulfilment === 'made_to_order' : Boolean(p.isMadeToOrder);
    if (isMTO) {
      const hasVariantsWithSizes = Array.isArray(p.variants) && p.variants.length > 0 && p.variants.some((v) => Array.isArray(v.sizes) && v.sizes.length > 0);
      const hasMeasurements = Array.isArray(p.measurements) && p.measurements.length > 0;
      if (!hasVariantsWithSizes && !hasMeasurements) {
        missingFields.push('Size choices or customisation/measurement options');
      }
      // Production lead time and care instructions deferred by client - optional for publication
    }
    return {
      canPublish: missingFields.length === 0,
      missingFields,
    };
  }

  console.log('\nEvaluating publication readiness for all 7 intended products:');
  for (const id of TARGET_SEVEN_IDS) {
    const product = catalog.find((p) => p.id === id);
    const check = validatePublishability(product);

    assert(check.canPublish === true, `${product.name}: canPublish is TRUE (ready for publication)`);
    assert(check.missingFields.length === 0, `${product.name}: missingFields is EMPTY`);
    assert(product.status === 'draft', `${product.name}: status is strictly preserved as "draft"`);
  }

  console.log('\nEvaluating Black Joggers publication lock:');
  const blackCheck = validatePublishability(blackJoggers);
  assert(blackCheck.canPublish === false, 'Black Joggers: canPublish is FALSE (publication blocked)');
  assert(blackCheck.missingFields.includes('Product photography / imagery'), 'Black Joggers: missing photography');
  assert(blackCheck.missingFields.includes('Size choices or customisation/measurement options'), 'Black Joggers: missing sizes/measurements');

  // -------------------------------------------------------------------------
  // 4. CUSTOMER-FACING DISPLAY CHECKS (ACCORDION & DEFERRED DETAILS)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. CUSTOMER-FACING DISPLAY CHECKS VIA HTTP ---');

  // Login as admin
  const loginPayload = JSON.stringify({
    username: 'Pratyaksh',
    password: '5sJ54iyUckeeSpTxpED6hbmCAiSq8dJG',
  });

  const loginRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
      },
    },
    loginPayload
  );
  assert(loginRes.statusCode === 200, 'Admin login successful for preview check');
  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];

  // Preview Grey Wide Leg Joggers
  const greyPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  assert(greyPreview.statusCode === 200, 'Admin preview Grey Joggers returns 200 OK');
  assert(greyPreview.body.includes('Grey Wide Leg Joggers'), 'Renders product title');
  assert(greyPreview.body.includes('1,299'), 'Renders ₹1,299 price');
  assert(!greyPreview.body.includes('IMAGES FLAGGED FOR CORRECTION'), 'IMAGES FLAGGED FOR CORRECTION warning banner is OMITTED');
  assert(!greyPreview.body.includes('Refer to garment label for specific material and care instructions.'), 'Omitted empty Care Instructions accordion & placeholder text');
  assert(!greyPreview.body.includes('PRODUCTION & FULFILMENT'), 'Omitted empty Production Lead Time accordion');

  // Preview Cocoa Skater Denim (which HAS populated care instructions & production lead time)
  const cocoaPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/90s-retro-cocoa-skater-denim?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  assert(!cocoaPreview.body.includes('CARE INSTRUCTIONS'), 'Cocoa Skater Denim: Omitted deferred CARE INSTRUCTIONS');
  assert(!cocoaPreview.body.includes('Hand wash cold inside out'), 'Cocoa Skater Denim: Removed invented care text');
  assert(
    !cocoaPreview.body.includes('PRODUCTION &amp; FULFILMENT') && !cocoaPreview.body.includes('PRODUCTION & FULFILMENT'),
    'Cocoa Skater Denim: Omitted deferred PRODUCTION & FULFILMENT'
  );
  assert(!cocoaPreview.body.includes('7-10 business days'), 'Cocoa Skater Denim: Removed invented production lead time');

  // Preview White Pinstripe Flared Pants (deferred care & production)
  const whitePreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  assert(whitePreview.statusCode === 200, 'Admin preview White Pinstripe Pants returns 200 OK');
  assert(!whitePreview.body.includes('Refer to garment label'), 'White Pants: Omitted placeholder text');
  assert(!whitePreview.body.includes('CARE INSTRUCTIONS'), 'White Pants: Omitted deferred CARE INSTRUCTIONS');
  assert(!whitePreview.body.includes('PRODUCTION & FULFILMENT'), 'White Pants: Omitted deferred PRODUCTION & FULFILMENT');

  console.log(`\n========================================================================`);
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification failed with uncaught error:', err);
  process.exit(1);
});
