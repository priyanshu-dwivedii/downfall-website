const http = require('http');

async function runTests() {
  console.log('=== STARTING DRAFT PREVIEW PROTECTION & AUTHORIZATION TESTS ===\n');
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

  // 1. Anonymous visitor without preview parameter
  console.log('--- 1. Anonymous Request without preview param ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/90s-retro-cocoa-skater-denim',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);
  assert(!anonNoPreview.body.includes('cocoa-skater-denim-1.png'), 'Anonymous response does not expose draft image assets');

  // 2. Anonymous visitor WITH ?preview=true parameter (MUST NOT EXPOSE DRAFT)
  console.log('\n--- 2. Anonymous Request WITH ?preview=true param ---');
  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/90s-retro-cocoa-skater-denim?preview=true',
    method: 'GET',
  });
  assert(anonWithPreview.statusCode === 404, `Anonymous request with preview=true returns 404 (actual: ${anonWithPreview.statusCode})`);
  assert(!anonWithPreview.body.includes('cocoa-skater-denim-1.png'), 'Anonymous request with preview=true does not expose draft image assets');

  // 3. Public Catalog API Route checks
  console.log('\n--- 3. Public Catalog API Route Protection ---');
  const catalogRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/catalog',
    method: 'GET',
  });
  assert(catalogRes.statusCode === 200, `GET /api/catalog returns 200 (actual: ${catalogRes.statusCode})`);
  const catalogData = JSON.parse(catalogRes.body);
  assert(
    !catalogData.products.some((p) => p.id === 'draft_cocoa_skater_denim'),
    'Public /api/catalog does NOT include draft_cocoa_skater_denim'
  );

  const catalogPreviewRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/catalog?preview=true',
    method: 'GET',
  });
  const catalogPreviewData = JSON.parse(catalogPreviewRes.body);
  assert(
    !catalogPreviewData.products.some((p) => p.id === 'draft_cocoa_skater_denim'),
    'Anonymous GET /api/catalog?preview=true does NOT include draft_cocoa_skater_denim'
  );

  // 4. Public Enquiry Validation rejects unpublished products
  console.log('\n--- 4. Public Enquiry Validation Rejection ---');
  const publicEnquiryPayload = JSON.stringify({
    items: [
      {
        productId: 'draft_cocoa_skater_denim',
        variantName: 'Cocoa',
        size: 'Custom measurements',
        quantity: 1,
      },
    ],
  });

  const publicValidateRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/enquiry/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(publicEnquiryPayload),
      },
    },
    publicEnquiryPayload
  );

  assert(publicValidateRes.statusCode === 400, `Public enquiry validation returns 400 Bad Request (actual: ${publicValidateRes.statusCode})`);
  const validateJson = JSON.parse(publicValidateRes.body);
  assert(validateJson.valid === false, 'Public enquiry validation returns valid: false');
  assert(
    validateJson.rejectedItems?.some((r) => r.productId === 'draft_cocoa_skater_denim'),
    'draft_cocoa_skater_denim is explicitly in rejectedItems list'
  );
  assert(
    validateJson.error.includes('Unpublished') || validateJson.rejectedItems[0].reason.includes('unpublished draft'),
    `Rejection message clearly identifies unpublished draft (actual: ${validateJson.error})`
  );

  // 5. Authenticate Admin and Test Authorized Preview
  console.log('\n--- 5. Admin Authentication & Authorized Preview Access ---');
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

  assert(loginRes.statusCode === 200, `Admin login successful with HTTP 200 (actual: ${loginRes.statusCode})`);
  const setCookie = loginRes.headers['set-cookie'];
  assert(Boolean(setCookie && setCookie.length > 0), 'Admin login returned session cookie');

  const cookieHeader = Array.isArray(setCookie) ? setCookie.map((c) => c.split(';')[0]).join('; ') : setCookie.split(';')[0];

  // 6. Authorized Admin access with ?preview=true
  console.log('\n--- 6. Authorized Admin Preview Access ---');
  const adminPreviewRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/90s-retro-cocoa-skater-denim?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Authorized admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('90s Retro Cocoa Skater Denim'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,649'), 'Admin preview renders price 1,649');
  assert(adminPreviewRes.body.includes('Made to Order'), 'Admin preview renders Made to Order tag');
  const priceSnippet = adminPreviewRes.body.slice(
    adminPreviewRes.body.indexOf('1,649'),
    adminPreviewRes.body.indexOf('1,649') + 200
  );
  assert(!priceSnippet.includes('(Demo)'), 'Admin preview main price does NOT contain (Demo) tag');
  assert(adminPreviewRes.body.includes('cocoa-skater-denim-1.png'), 'Admin preview contains Image 1');
  assert(adminPreviewRes.body.includes('cocoa-skater-denim-2.png'), 'Admin preview contains Image 2');
  assert(adminPreviewRes.body.includes('cocoa-skater-denim-3.png'), 'Admin preview contains Image 3');
  assert(adminPreviewRes.body.includes('cocoa-skater-denim-4.png'), 'Admin preview contains Image 4');
  assert(adminPreviewRes.body.includes('cocoa-skater-denim-5.png'), 'Admin preview contains Image 5');
  assert(adminPreviewRes.body.includes('CUSTOM MEASUREMENTS'), 'Admin preview contains CUSTOM MEASUREMENTS section');
  assert(adminPreviewRes.body.includes('Waist circumference'), 'Admin preview contains Waist circumference input');
  assert(adminPreviewRes.body.includes('Requested garment outseam'), 'Admin preview contains Requested garment outseam input');
  assert(adminPreviewRes.body.includes('47 inches outseam is a reference garment specification'), 'Admin preview contains reference note');

  // 7. Admin Enquiry Validation
  console.log('\n--- 7. Admin Enquiry Validation Test ---');
  const adminValidateRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/enquiry/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(publicEnquiryPayload),
        Cookie: cookieHeader,
      },
    },
    publicEnquiryPayload
  );

  assert(adminValidateRes.statusCode === 200, `Admin enquiry validation returns 200 OK (actual: ${adminValidateRes.statusCode})`);
  const adminValidateJson = JSON.parse(adminValidateRes.body);
  assert(adminValidateJson.valid === true, 'Admin enquiry validation allows preview test');
  assert(adminValidateJson.isAuthorizedAdmin === true, 'Identifies as authorized admin session');

  console.log(`\n=== SUMMARY OF RESULTS ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
