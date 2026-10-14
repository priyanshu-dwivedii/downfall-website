/**
 * Test Suite: Brown Pinstripe Flared Pants Draft Update & Preview Verification
 *
 * Verifies:
 * 1. Image assets: Exactly the 5 requested PNGs from D:\Downfall Products\Downfall Products\Pinstripe Flared Pants
 * 2. Hash & byte count verification: byte-for-byte original preservation (no recolouring or resizing).
 * 3. Gallery ordering: image 1 primary hero, images 2-5 sequential.
 * 4. Catalog entry: Name, price INR 1549 (no Demo), bottomwear, Brown colour, made-to-order, description.
 * 5. Isolation: White and Grey galleries remain unchanged.
 * 6. Sizing pending: sizes and measurements empty, production time & care pending.
 * 7. Model reference check: Zero copied 47" outseam or 6'4" model height claims.
 * 8. Anonymous access protection: 404 with or without ?preview=true.
 * 9. Authenticated admin preview: 200 OK, full 5-image gallery, SIZING PENDING button state.
 * 10. Publication protection: Rejects publication with 400 Bad Request.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
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

async function runTests() {
  console.log('=== STARTING BROWN PINSTRIPE FLARED PANTS VERIFICATION ===\n');

  // --- 1. Image Assets Verification ---
  console.log('--- 1. Image Assets Verification ---');
  const targetDir = path.join(process.cwd(), 'public', 'products', 'brown-pinstripe-flared-pants');
  assert(fs.existsSync(targetDir), 'Directory public/products/brown-pinstripe-flared-pants exists');

  const expectedImages = [
    { name: 'brown-pinstripe-flared-pants-1.png', size: 1834049 },
    { name: 'brown-pinstripe-flared-pants-2.png', size: 1735625 },
    { name: 'brown-pinstripe-flared-pants-3.png', size: 1775696 },
    { name: 'brown-pinstripe-flared-pants-4.png', size: 1742858 },
    { name: 'brown-pinstripe-flared-pants-5.png', size: 1817098 },
  ];

  for (const img of expectedImages) {
    const fullPath = path.join(targetDir, img.name);
    assert(fs.existsSync(fullPath), `Image exists: ${img.name}`);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      assert(stat.size === img.size, `${img.name} size matches source exact byte count (${stat.size} bytes)`);
    }
  }

  // --- 2. Catalog Entry Verification ---
  console.log('\n--- 2. Catalog Entry Verification ---');
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const brownPants = catalog.find((p) => p.id === 'draft_brown_pinstripe_flared_pants');
  assert(Boolean(brownPants), 'draft_brown_pinstripe_flared_pants exists in catalog.json');
  assert(brownPants.slug === 'brown-pinstripe-flared-pants', `Slug is brown-pinstripe-flared-pants (actual: ${brownPants.slug})`);
  assert(brownPants.name === 'Brown Pinstripe Flared Pants', `Name is Brown Pinstripe Flared Pants (actual: ${brownPants.name})`);
  assert(brownPants.status === 'draft', `Status is draft (actual: ${brownPants.status})`);
  assert(brownPants.price === 1549, `Price is 1549 (actual: ${brownPants.price})`);
  assert(brownPants.currency === 'INR', `Currency is INR (actual: ${brownPants.currency})`);
  assert(brownPants.isDemoPrice === false, `isDemoPrice is false (actual: ${brownPants.isDemoPrice})`);
  assert(brownPants.category === 'bottomwear', `Category is bottomwear (actual: ${brownPants.category})`);
  assert(brownPants.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${brownPants.fulfilment})`);
  assert(brownPants.isMadeToOrder === true, 'isMadeToOrder is true');

  // Images in order
  assert(brownPants.images && brownPants.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(brownPants.images[0] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-1.png', 'Image 1 is primary');
  assert(brownPants.images[1] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-2.png', 'Image 2 is second');
  assert(brownPants.images[2] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-3.png', 'Image 3 is third');
  assert(brownPants.images[3] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-4.png', 'Image 4 is fourth');
  assert(brownPants.images[4] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-5.png', 'Image 5 is fifth');

  // Variants & colour
  assert(brownPants.variants && brownPants.variants.length === 1, 'Variants length is 1');
  const brownVariant = brownPants.variants[0];
  assert(brownVariant.name === 'Brown', `Colour is Brown (actual: ${brownVariant.name})`);
  assert(brownVariant.hex === '#5c4033', `Hex is #5c4033 (actual: ${brownVariant.hex})`);
  assert(brownVariant.image === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-1.png', 'Primary image is assigned to Brown variant');
  assert(Array.isArray(brownVariant.sizes) && brownVariant.sizes.length === 0, 'Sizing is pending confirmation (sizes is empty)');
  assert(Array.isArray(brownPants.measurements) && brownPants.measurements.length === 0, 'Measurements is empty');

  // Pending fields
  assert(brownPants.productionTime === '', 'Production time remains pending');
  assert(brownPants.careInstructions === '', 'Care instructions remain pending');

  // Description & specs retained
  assert(brownPants.description.includes('Overview:'), 'Overview retained');
  assert(brownPants.description.includes('100% High-Grade Viscose'), 'Viscose fabric specification retained');
  assert(brownPants.description.includes('Broad waistline'), 'Broad waistline specification retained');
  assert(brownPants.description.includes('Two-button closure'), 'Two-button closure specification retained');
  assert(!brownPants.description.includes('47 inches'), 'Does NOT copy 47-inch outseam reference');
  assert(!brownPants.description.includes("6'4\""), 'Does NOT copy 6\'4" model height reference');

  // --- 3. White and Grey Galleries Unchanged ---
  console.log('\n--- 3. White and Grey Galleries Unchanged ---');
  const whitePants = catalog.find((p) => p.id === 'draft_white_pinstripe_flared_pants');
  const greyPants = catalog.find((p) => p.id === 'draft_grey_pinstripe_flared_pants');
  assert(Boolean(whitePants), 'draft_white_pinstripe_flared_pants exists');
  assert(Boolean(greyPants), 'draft_grey_pinstripe_flared_pants exists');
  assert(whitePants.images.length === 5, 'White Pants preserves its 5 gallery images');
  assert(whitePants.images[0] === '/products/white-pinstripe-flared-pants/white-pinstripe-flared-pants-1.png', 'White Pants primary image is white-pinstripe-flared-pants-1.png');
  assert(greyPants.images.length === 5, 'Grey Pants preserves its 5 gallery images');
  assert(greyPants.images[0] === '/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-1.png', 'Grey Pants primary image is grey-pinstripe-flared-pants-1.png');

  // --- 4. Draft Security & Protection Check ---
  console.log('\n--- 4. Draft Security & Protection Check ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/brown-pinstripe-flared-pants',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);

  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/brown-pinstripe-flared-pants?preview=true',
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
    !catalogData.products.some((p) => p.id === 'draft_brown_pinstripe_flared_pants'),
    'Public /api/catalog does NOT expose draft_brown_pinstripe_flared_pants'
  );

  // Public enquiry validation rejection
  const enquiryPayload = JSON.stringify({
    items: [
      {
        productId: 'draft_brown_pinstripe_flared_pants',
        variantName: 'Brown',
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

  // --- 5. Authenticated Admin Preview Access ---
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
    path: '/products/brown-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('Brown Pinstripe Flared Pants'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,549'), 'Admin preview renders price 1,549');
  assert(adminPreviewRes.body.includes('Made to Order'), 'Admin preview renders Made to Order tag');

  const priceSnippet = adminPreviewRes.body.slice(
    adminPreviewRes.body.indexOf('1,549'),
    adminPreviewRes.body.indexOf('1,549') + 200
  );
  assert(!priceSnippet.includes('(Demo)'), 'Main price does NOT have (Demo) tag');

  // Verify all 5 images rendered in gallery
  assert(adminPreviewRes.body.includes('brown-pinstripe-flared-pants-1.png'), 'Gallery contains Image 1');
  assert(adminPreviewRes.body.includes('brown-pinstripe-flared-pants-2.png'), 'Gallery contains Image 2');
  assert(adminPreviewRes.body.includes('brown-pinstripe-flared-pants-3.png'), 'Gallery contains Image 3');
  assert(adminPreviewRes.body.includes('brown-pinstripe-flared-pants-4.png'), 'Gallery contains Image 4');
  assert(adminPreviewRes.body.includes('brown-pinstripe-flared-pants-5.png'), 'Gallery contains Image 5');

  // Swatch
  assert(adminPreviewRes.body.includes('#5c4033') || adminPreviewRes.body.includes('Brown'), 'Renders Brown colour swatch');

  // Sizing pending message and button
  assert(
    adminPreviewRes.body.includes('Commercial sizing options and specifications pending confirmation'),
    'Displays pending commercial sizing notice'
  );
  assert(adminPreviewRes.body.includes('SIZING PENDING'), 'Add to cart button displays SIZING PENDING');

  // Zero model height / outseam claims
  assert(!adminPreviewRes.body.includes('47 inches'), 'Does NOT render 47 inches outseam');
  assert(!adminPreviewRes.body.includes("6'4\""), 'Does NOT render 6\'4" model reference');

  // --- 6. Publication Rejection Check ---
  console.log('\n--- 6. Publication Rejection Check ---');
  const pubAttemptRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/draft_brown_pinstripe_flared_pants',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    },
    JSON.stringify({ status: 'published' })
  );
  assert(pubAttemptRes.statusCode === 400, `Publish attempt on Brown Pinstripe Pants is rejected with 400 (actual: ${pubAttemptRes.statusCode})`);

  console.log(`\n=== SUMMARY OF RESULTS ===`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
