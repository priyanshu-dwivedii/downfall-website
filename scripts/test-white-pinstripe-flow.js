const fs = require('fs');
const path = require('path');
const http = require('http');

async function runTests() {
  console.log('=== STARTING WHITE PINSTRIPE FLARED PANTS VERIFICATION ===\n');
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
  const imgDir = path.join(__dirname, '..', 'public', 'products', 'white-pinstripe-flared-pants');
  assert(fs.existsSync(imgDir), 'Directory public/products/white-pinstripe-flared-pants exists');

  for (let i = 1; i <= 5; i++) {
    const filename = `white-pinstripe-flared-pants-${i}.png`;
    const filePath = path.join(imgDir, filename);
    assert(fs.existsSync(filePath), `Image exists: ${filename}`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(stats.size > 1500000, `${filename} size preserved original (${stats.size} bytes)`);
    }
  }

  // 2. Catalog Entry Verification
  console.log('\n--- 2. Catalog Entry Verification ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const whitePants = catalog.find((p) => p.id === 'draft_white_pinstripe_flared_pants');
  const brownPants = catalog.find((p) => p.id === 'draft_brown_pinstripe_flared_pants');
  const greyPants = catalog.find((p) => p.id === 'draft_grey_pinstripe_flared_pants');

  assert(Boolean(whitePants), 'draft_white_pinstripe_flared_pants exists in catalog.json');
  assert(whitePants.status === 'draft', `Status is draft (actual: ${whitePants.status})`);
  assert(whitePants.price === 1549, `Price is 1549 (actual: ${whitePants.price})`);
  assert(whitePants.currency === 'INR', `Currency is INR (actual: ${whitePants.currency})`);
  assert(whitePants.isDemoPrice === false, `isDemoPrice is false (actual: ${whitePants.isDemoPrice})`);
  assert(whitePants.category === 'bottomwear', `Category is bottomwear (actual: ${whitePants.category})`);
  assert(whitePants.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${whitePants.fulfilment})`);
  assert(whitePants.isMadeToOrder === true, `isMadeToOrder is true`);

  // Images order
  assert(Array.isArray(whitePants.images) && whitePants.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(whitePants.images[0].includes('white-pinstripe-flared-pants-1.png'), 'Image 1 is primary');
  assert(whitePants.images[1].includes('white-pinstripe-flared-pants-2.png'), 'Image 2 is second');
  assert(whitePants.images[2].includes('white-pinstripe-flared-pants-3.png'), 'Image 3 is third');
  assert(whitePants.images[3].includes('white-pinstripe-flared-pants-4.png'), 'Image 4 is fourth');
  assert(whitePants.images[4].includes('white-pinstripe-flared-pants-5.png'), 'Image 5 is fifth');

  // Variant colour is White
  assert(whitePants.variants.length === 1, 'Variants length is 1');
  assert(whitePants.variants[0].name === 'White', `Colour is White (actual: ${whitePants.variants[0].name})`);
  assert(whitePants.variants[0].image.includes('white-pinstripe-flared-pants-1.png'), 'Primary image is assigned to White variant');

  // No invented sizing, measurements, production time, or care instructions
  assert(whitePants.variants[0].sizes.length === 0, 'Does NOT invent sizes (sizes is empty)');
  assert(whitePants.measurements.length === 0, 'Does NOT invent measurements (measurements is empty)');
  assert(whitePants.productionTime === '', 'Does NOT invent production time');
  assert(whitePants.careInstructions === '', 'Does NOT invent care instructions');

  // Approved description and specifications retained
  assert(whitePants.description.includes('Flared trousers featuring vertical pinstripes'), 'Approved overview retained');
  assert(whitePants.description.includes('100% High-Grade Viscose'), 'Viscose fabric specification retained');
  assert(whitePants.description.includes('Broad waistline'), 'Broad waistline specification retained');
  assert(whitePants.description.includes('Two-button closure'), 'Two-button closure specification retained');

  // 3. Brown and Grey drafts isolation check
  console.log('\n--- 3. Brown and Grey Drafts Isolation Check ---');
  assert(Boolean(brownPants), 'draft_brown_pinstripe_flared_pants exists');
  assert(Boolean(greyPants), 'draft_grey_pinstripe_flared_pants exists');
  assert(brownPants.images.length === 0, 'Brown draft images remain empty (white images not assigned)');
  assert(greyPants.images.length === 0, 'Grey draft images remain empty (white images not assigned)');

  // 4. Draft Security & Protection
  console.log('\n--- 4. Draft Security & Protection Check ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);

  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants?preview=true',
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
    !catalogData.products.some((p) => p.id === 'draft_white_pinstripe_flared_pants'),
    'Public /api/catalog does NOT expose draft_white_pinstripe_flared_pants'
  );

  // Public enquiry validation rejection
  const enquiryPayload = JSON.stringify({
    items: [
      {
        productId: 'draft_white_pinstripe_flared_pants',
        variantName: 'White',
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
    path: '/products/white-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('White Pinstripe Flared Pants'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,549'), 'Admin preview renders price 1,549');
  assert(adminPreviewRes.body.includes('Made to Order'), 'Admin preview renders Made to Order tag');

  const priceSnippet = adminPreviewRes.body.slice(
    adminPreviewRes.body.indexOf('1,549'),
    adminPreviewRes.body.indexOf('1,549') + 200
  );
  assert(!priceSnippet.includes('(Demo)'), 'Main price does NOT have (Demo) tag');

  // Verify all 5 images rendered in thumbnail gallery
  assert(adminPreviewRes.body.includes('white-pinstripe-flared-pants-1.png'), 'Gallery contains Image 1');
  assert(adminPreviewRes.body.includes('white-pinstripe-flared-pants-2.png'), 'Gallery contains Image 2');
  assert(adminPreviewRes.body.includes('white-pinstripe-flared-pants-3.png'), 'Gallery contains Image 3');
  assert(adminPreviewRes.body.includes('white-pinstripe-flared-pants-4.png'), 'Gallery contains Image 4');
  assert(adminPreviewRes.body.includes('white-pinstripe-flared-pants-5.png'), 'Gallery contains Image 5');

  // Verify Colour White and pending sizing message
  assert(adminPreviewRes.body.includes('White'), 'Renders White colour swatch');
  assert(
    adminPreviewRes.body.includes('Commercial sizing options and specifications pending confirmation'),
    'Displays pending commercial sizing notice'
  );
  assert(adminPreviewRes.body.includes('SIZING PENDING'), 'Add to cart button displays SIZING PENDING');

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
