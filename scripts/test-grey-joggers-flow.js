const fs = require('fs');
const path = require('path');
const http = require('http');
const { validateProductPublishability } = require('../src/lib/catalog-types');

async function runTests() {
  console.log('=== STARTING GREY WIDE LEG JOGGERS VERIFICATION ===\n');
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

  // 1. Verify Image Assets in public directory
  console.log('--- 1. Image Assets Verification ---');
  const imgDir = path.join(__dirname, '..', 'public', 'products', 'grey-wide-leg-joggers');
  assert(fs.existsSync(imgDir), 'Directory public/products/grey-wide-leg-joggers exists');

  for (let i = 1; i <= 4; i++) {
    const filename = `grey-wide-leg-joggers-${i}.png`;
    const filePath = path.join(imgDir, filename);
    assert(fs.existsSync(filePath), `Image exists: ${filename}`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(stats.size > 1500000, `${filename} size preserved original (${stats.size} bytes)`);
    }
  }

  const file5 = path.join(imgDir, 'grey-wide-leg-joggers-5.png');
  assert(!fs.existsSync(file5), 'Old 5th image removed from active directory');

  const publicBackup = path.join(imgDir, 'original-flagged-drawstring');
  const privateArchive = path.join(__dirname, '..', 'archive', 'original-flagged-images', 'grey-wide-leg-joggers');
  assert(!fs.existsSync(publicBackup), 'Old flagged backups removed from public/ directory');
  assert(fs.existsSync(path.join(privateArchive, 'grey-wide-leg-joggers-5.png')), 'Original files preserved privately in archive/');

  // 2. Catalog Entry Verification
  console.log('\n--- 2. Catalog Entry Verification ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const greyJoggers = catalog.find((p) => p.id === 'draft_grey_wide_leg_joggers');
  const beigeJoggers = catalog.find((p) => p.id === 'draft_beige_wide_leg_joggers');
  const blackJoggers = catalog.find((p) => p.id === 'draft_black_wide_leg_joggers');

  assert(Boolean(greyJoggers), 'draft_grey_wide_leg_joggers exists in catalog.json');
  assert(greyJoggers.slug === 'grey-wide-leg-joggers', `Slug is grey-wide-leg-joggers (actual: ${greyJoggers.slug})`);
  assert(greyJoggers.name === 'Grey Wide Leg Joggers', `Name is Grey Wide Leg Joggers (actual: ${greyJoggers.name})`);
  assert(greyJoggers.status === 'draft', `Status is draft (actual: ${greyJoggers.status})`);
  assert(greyJoggers.price === 1299, `Price is 1299 (actual: ${greyJoggers.price})`);
  assert(greyJoggers.currency === 'INR', `Currency is INR (actual: ${greyJoggers.currency})`);
  assert(greyJoggers.isDemoPrice === false, `isDemoPrice is false (actual: ${greyJoggers.isDemoPrice})`);
  assert(greyJoggers.category === 'bottomwear', `Category is bottomwear (actual: ${greyJoggers.category})`);
  assert(greyJoggers.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${greyJoggers.fulfilment})`);
  assert(greyJoggers.isMadeToOrder === true, `isMadeToOrder is true`);

  // Images gallery order
  assert(Array.isArray(greyJoggers.images) && greyJoggers.images.length === 4, 'Has exactly 4 corrected images in gallery array');
  assert(greyJoggers.images[0].includes('grey-wide-leg-joggers-1.png'), 'Image 1 is primary');
  assert(greyJoggers.images[1].includes('grey-wide-leg-joggers-2.png'), 'Image 2 is second');
  assert(greyJoggers.images[2].includes('grey-wide-leg-joggers-3.png'), 'Image 3 is third');
  assert(greyJoggers.images[3].includes('grey-wide-leg-joggers-4.png'), 'Image 4 is fourth');

  // Variant colour is Grey (#808080)
  assert(greyJoggers.variants.length === 1, 'Variants length is 1');
  assert(greyJoggers.variants[0].name === 'Grey', `Colour is Grey (actual: ${greyJoggers.variants[0].name})`);
  assert(greyJoggers.variants[0].hex.toLowerCase() === '#808080', `Hex is #808080 (actual: ${greyJoggers.variants[0].hex})`);
  assert(greyJoggers.variants[0].image.includes('grey-wide-leg-joggers-1.png'), 'Primary image is assigned to Grey variant');

  // Custom sizing measurements
  assert(greyJoggers.variants[0].sizes.length === 1, 'Sizes length is 1');
  assert(greyJoggers.variants[0].sizes[0].size === 'Custom measurements', 'Size is Custom measurements');
  assert(greyJoggers.measurements.length === 2, 'Requires 2 measurements');
  assert(greyJoggers.measurements.includes('Waist circumference'), 'Requires Waist circumference');
  assert(greyJoggers.measurements.includes('Requested garment outseam'), 'Requires Requested garment outseam');
  assert(greyJoggers.productionTime === '', 'Production time remains deferred');
  assert(greyJoggers.careInstructions === '', 'Care instructions remain deferred');

  // Fabric and fit specifications
  assert(greyJoggers.description.includes('Breathable 220 GSM fabric'), 'Retains 220 GSM fabric specification');
  assert(greyJoggers.description.includes('Relaxed wide-leg fit'), 'Retains relaxed wide-leg fit specification');
  assert(greyJoggers.description.includes('High rise'), 'Retains high rise specification');
  assert(
    greyJoggers.description.includes('Elastic waistband with a grey drawstring'),
    'Waistband specification updated to "Elastic waistband with a grey drawstring"'
  );
  assert(
    !greyJoggers.description.toLowerCase().includes('black'),
    'Description contains no references to black drawstring tips'
  );
  assert(
    !greyJoggers.imageCorrectionRequired,
    'imageCorrectionRequired flag is cleared'
  );
  assert(
    !greyJoggers.imageCorrectionNote,
    'imageCorrectionNote is cleared'
  );

  // 3. Beige and Black Joggers Isolation Check
  console.log('\n--- 3. Beige and Black Joggers Isolation Check ---');
  assert(Boolean(beigeJoggers), 'draft_beige_wide_leg_joggers exists');
  assert(Boolean(blackJoggers), 'draft_black_wide_leg_joggers exists');
  assert(!beigeJoggers.images.some((img) => img.includes('grey-wide-leg-joggers')), 'Beige draft images remain distinct (grey images not assigned)');
  assert(blackJoggers.images.length === 0, 'Black draft images remain empty (grey images not assigned)');

  // 4. Draft Security & Protection Check
  console.log('\n--- 4. Draft Security & Protection Check ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);

  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers?preview=true',
    method: 'GET',
  });
  assert(anonWithPreview.statusCode === 404, `Anonymous request with preview=true returns 404 (actual: ${anonWithPreview.statusCode})`);

  // Public catalog endpoint check
  const catalogRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/catalog',
    method: 'GET',
  });
  const catalogData = JSON.parse(catalogRes.body);
  assert(
    !catalogData.products.some((p) => p.id === 'draft_grey_wide_leg_joggers'),
    'Public /api/catalog does NOT expose draft_grey_wide_leg_joggers'
  );

  // 5. Authenticated Admin Preview Access
  console.log('\n--- 5. Authenticated Admin Preview Access ---');
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
  assert(loginRes.statusCode === 200, 'Admin login successful');
  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];

  const adminPreviewRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('Grey Wide Leg Joggers'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,299'), 'Admin preview renders price 1,299');
  assert(adminPreviewRes.body.includes('Made to Order'), 'Admin preview renders Made to Order tag');

  // Verify corrected 4 images rendered in thumbnail gallery
  assert(adminPreviewRes.body.includes('grey-wide-leg-joggers-1.png'), 'Gallery contains Image 1');
  assert(adminPreviewRes.body.includes('grey-wide-leg-joggers-2.png'), 'Gallery contains Image 2');
  assert(adminPreviewRes.body.includes('grey-wide-leg-joggers-3.png'), 'Gallery contains Image 3');
  assert(adminPreviewRes.body.includes('grey-wide-leg-joggers-4.png'), 'Gallery contains Image 4');
  assert(!adminPreviewRes.body.includes('grey-wide-leg-joggers-5.png'), 'Gallery excludes old 5th image');

  // Verify Custom Sizing UI and Add to Cart
  assert(adminPreviewRes.body.includes('Grey'), 'Renders Grey colour swatch');
  assert(adminPreviewRes.body.includes('Custom measurements'), 'Renders Custom measurements size option');
  assert(adminPreviewRes.body.includes('ADD TO CART'), 'Add to cart button is active');

  // Verify Image Correction Flag Banner is cleared
  assert(
    !adminPreviewRes.body.includes('IMAGES FLAGGED FOR CORRECTION'),
    'Admin preview omits IMAGES FLAGGED FOR CORRECTION alert banner (flag cleared)'
  );

  // 6. Publication Readiness Verification
  console.log('\n--- 6. Publication Readiness Verification ---');
  const publishCheck = validateProductPublishability(greyJoggers);
  assert(publishCheck.canPublish === true, 'Grey Joggers meets publication criteria (canPublish: true)');
  assert(publishCheck.missingFields.length === 0, 'No missing publication fields');
  assert(greyJoggers.status === 'draft', 'Product status remains draft (unpublished)');

  console.log(`\n=== SUMMARY OF RESULTS ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
