const fs = require('fs');
const path = require('path');
const http = require('http');

async function runTests() {
  console.log('=== STARTING GREY PINSTRIPE FLARED PANTS VERIFICATION ===\n');
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
  const imgDir = path.join(__dirname, '..', 'public', 'products', 'grey-pinstripe-flared-pants');
  assert(fs.existsSync(imgDir), 'Directory public/products/grey-pinstripe-flared-pants exists');

  const expectedSizes = [1789224, 1759541, 1687809, 1755976, 1802836];

  for (let i = 1; i <= 5; i++) {
    const filename = `grey-pinstripe-flared-pants-${i}.png`;
    const filePath = path.join(imgDir, filename);
    assert(fs.existsSync(filePath), `Image exists: ${filename}`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(
        stats.size === expectedSizes[i - 1],
        `${filename} size matches source exact byte count (${stats.size} bytes)`
      );
    }
  }

  // 2. Catalog Entry Verification
  console.log('\n--- 2. Catalog Entry Verification ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const greyPants = catalog.find((p) => p.id === 'draft_grey_pinstripe_flared_pants');
  const whitePants = catalog.find((p) => p.id === 'draft_white_pinstripe_flared_pants');
  const brownPants = catalog.find((p) => p.id === 'draft_brown_pinstripe_flared_pants');

  assert(Boolean(greyPants), 'draft_grey_pinstripe_flared_pants exists in catalog.json');
  assert(greyPants.slug === 'grey-pinstripe-flared-pants', `Slug is grey-pinstripe-flared-pants (actual: ${greyPants.slug})`);
  assert(greyPants.name === 'Grey Pinstripe Flared Pants', `Name is Grey Pinstripe Flared Pants (actual: ${greyPants.name})`);
  assert(greyPants.status === 'draft', `Status is draft (actual: ${greyPants.status})`);
  assert(greyPants.price === 1549, `Price is 1549 (actual: ${greyPants.price})`);
  assert(greyPants.currency === 'INR', `Currency is INR (actual: ${greyPants.currency})`);
  assert(greyPants.isDemoPrice === false, `isDemoPrice is false (actual: ${greyPants.isDemoPrice})`);
  assert(greyPants.category === 'bottomwear', `Category is bottomwear (actual: ${greyPants.category})`);
  assert(greyPants.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${greyPants.fulfilment})`);
  assert(greyPants.isMadeToOrder === true, 'isMadeToOrder is true');

  // Images order: image 1 primary, 2-5 in sequence
  assert(Array.isArray(greyPants.images) && greyPants.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(greyPants.images[0].includes('grey-pinstripe-flared-pants-1.png'), 'Image 1 is primary');
  assert(greyPants.images[1].includes('grey-pinstripe-flared-pants-2.png'), 'Image 2 is second');
  assert(greyPants.images[2].includes('grey-pinstripe-flared-pants-3.png'), 'Image 3 is third');
  assert(greyPants.images[3].includes('grey-pinstripe-flared-pants-4.png'), 'Image 4 is fourth');
  assert(greyPants.images[4].includes('grey-pinstripe-flared-pants-5.png'), 'Image 5 is fifth');

  // Variant colour Grey
  assert(greyPants.variants.length === 1, 'Variants length is 1');
  assert(greyPants.variants[0].name === 'Grey', `Colour is Grey (actual: ${greyPants.variants[0].name})`);
  assert(greyPants.variants[0].hex.toLowerCase() === '#808080', `Hex is #808080 (actual: ${greyPants.variants[0].hex})`);
  assert(greyPants.variants[0].image.includes('grey-pinstripe-flared-pants-1.png'), 'Primary image is assigned to Grey variant');

  // Sizing pending until confirmed: sizes is empty, measurements is empty
  assert(greyPants.variants[0].sizes.length === 0, 'Sizing is pending confirmation (sizes is empty)');
  assert(greyPants.measurements.length === 0, 'Measurements is empty');
  assert(greyPants.productionTime === '', 'Production time remains pending');
  assert(greyPants.careInstructions === '', 'Care instructions remain pending');

  // Approved pinstripe description retained
  assert(greyPants.description.includes('Flared trousers featuring vertical pinstripes'), 'Overview retained');
  assert(greyPants.description.includes('100% High-Grade Viscose'), 'Viscose fabric specification retained');
  assert(greyPants.description.includes('Broad waistline'), 'Broad waistline specification retained');
  assert(greyPants.description.includes('Two-button closure'), 'Two-button closure specification retained');

  // Model reference isolation (no 47" or 6'4" claims copied)
  assert(!greyPants.description.includes('47 inches') && !greyPants.description.includes('47-inch'), 'Does NOT copy 47-inch outseam reference');
  assert(!greyPants.description.includes("6'4\""), 'Does NOT copy 6\'4" model height reference');

  // 3. White and Brown Galleries Unchanged
  console.log('\n--- 3. White and Brown Galleries Unchanged ---');
  assert(Boolean(whitePants), 'draft_white_pinstripe_flared_pants exists');
  assert(Boolean(brownPants), 'draft_brown_pinstripe_flared_pants exists');
  assert(whitePants.images.length === 5, 'White Pants preserves its 5 gallery images');
  assert(whitePants.images[0].includes('white-pinstripe-flared-pants-1.png'), 'White Pants primary image is white-pinstripe-flared-pants-1.png');
  assert(brownPants.images.length === 0, 'Brown Pants images gallery remains empty');

  // 4. Draft Security & Protection Check
  console.log('\n--- 4. Draft Security & Protection Check ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-pinstripe-flared-pants',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);

  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-pinstripe-flared-pants?preview=true',
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
    !catalogData.products.some((p) => p.id === 'draft_grey_pinstripe_flared_pants'),
    'Public /api/catalog does NOT expose draft_grey_pinstripe_flared_pants'
  );

  // Public enquiry validation rejection
  const enquiryPayload = JSON.stringify({
    items: [
      {
        productId: 'draft_grey_pinstripe_flared_pants',
        variantName: 'Grey',
        size: 'Custom',
        quantity: 1,
      },
    ],
  });
  const validateRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/enquiry/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(enquiryPayload),
      },
    },
    enquiryPayload
  );
  assert(validateRes.statusCode === 400, `Public enquiry validation rejects draft with 400 (actual: ${validateRes.statusCode})`);

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
    path: '/products/grey-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('Grey Pinstripe Flared Pants'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,549'), 'Admin preview renders price 1,549');
  assert(adminPreviewRes.body.includes('Made to Order'), 'Admin preview renders Made to Order tag');

  const priceSnippet = adminPreviewRes.body.slice(
    adminPreviewRes.body.indexOf('1,549'),
    adminPreviewRes.body.indexOf('1,549') + 200
  );
  assert(!priceSnippet.includes('(Demo)'), 'Main price does NOT have (Demo) tag');

  // Verify all 5 images rendered in thumbnail gallery
  assert(adminPreviewRes.body.includes('grey-pinstripe-flared-pants-1.png'), 'Gallery contains Image 1');
  assert(adminPreviewRes.body.includes('grey-pinstripe-flared-pants-2.png'), 'Gallery contains Image 2');
  assert(adminPreviewRes.body.includes('grey-pinstripe-flared-pants-3.png'), 'Gallery contains Image 3');
  assert(adminPreviewRes.body.includes('grey-pinstripe-flared-pants-4.png'), 'Gallery contains Image 4');
  assert(adminPreviewRes.body.includes('grey-pinstripe-flared-pants-5.png'), 'Gallery contains Image 5');

  // Verify Colour Grey and pending sizing state
  assert(adminPreviewRes.body.includes('Grey'), 'Renders Grey colour swatch');
  assert(
    adminPreviewRes.body.includes('Commercial sizing options and specifications pending confirmation'),
    'Displays pending commercial sizing notice'
  );
  assert(adminPreviewRes.body.includes('SIZING PENDING'), 'Add to cart button displays SIZING PENDING');

  // Model reference isolation in preview
  assert(!adminPreviewRes.body.includes('47 inches') && !adminPreviewRes.body.includes('47-inch'), 'Does NOT render 47 inches outseam');
  assert(!adminPreviewRes.body.includes("6'4\"") && !adminPreviewRes.body.includes("6&apos;4&quot;"), 'Does NOT render 6\'4" model reference');

  // 6. Publication Rejection Check
  console.log('\n--- 6. Publication Rejection Check ---');
  const pubAttemptRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/draft_grey_pinstripe_flared_pants',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    },
    JSON.stringify({ status: 'published' })
  );
  assert(pubAttemptRes.statusCode === 400, `Publish attempt on Grey Pinstripe Pants is rejected with 400 (actual: ${pubAttemptRes.statusCode})`);

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
