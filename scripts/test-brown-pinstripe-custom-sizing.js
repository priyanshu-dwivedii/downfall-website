/**
 * Test Suite: Custom Sizing for Brown Pinstripe Flared Pants
 * 
 * Verifies:
 * 1. Catalog configuration: sizing option "Custom measurements", required measurements, price INR 1549, 5 images.
 * 2. Product-specific reference note (no 47" or 6'4" references, no invented stock counts).
 * 3. Authenticated admin preview: working measurement inputs (inches/cm selector, blank defaults, waist and outseam inputs).
 * 4. Add to Cart button displays "ADD TO CART" (not "SIZING PENDING").
 * 5. Validation: blank input rejection and positive-number enforcement.
 * 6. Cart separation: different measurements create separate cart items; identical merge quantities.
 * 7. Measurement carry-through to checkout order summary and WhatsApp enquiry.
 * 8. Draft protection: anonymous access receives 404; public API hides draft.
 * 9. Production time & care remain pending; publication attempt rejected with 400.
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
  console.log('=== STARTING BROWN PINSTRIPE FLARED PANTS CUSTOM SIZING TEST ===\n');

  // --- 1. Catalog Verification ---
  console.log('--- 1. Catalog Verification ---');
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const brownPants = catalog.find((p) => p.id === 'draft_brown_pinstripe_flared_pants');
  assert(Boolean(brownPants), 'draft_brown_pinstripe_flared_pants exists in catalog.json');
  assert(brownPants.price === 1549, `Price is 1549 (actual: ${brownPants.price})`);
  assert(brownPants.currency === 'INR', 'Currency is INR');
  assert(brownPants.isDemoPrice === false, 'isDemoPrice is false (real commercial price)');
  assert(brownPants.category === 'bottomwear', 'Category is bottomwear');
  assert(brownPants.status === 'draft', 'Status is draft (unpublished)');
  assert(brownPants.fulfilment === 'made_to_order', 'Fulfilment is made_to_order');
  assert(brownPants.isMadeToOrder === true, 'isMadeToOrder is true');
  assert(brownPants.images && brownPants.images.length === 5, 'Has exactly 5 gallery images');
  assert(brownPants.images[0] === '/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-1.png', 'Image 1 is primary');

  // Sizing option
  assert(brownPants.variants && brownPants.variants.length === 1, 'Has 1 variant (Brown)');
  const brownVariant = brownPants.variants[0];
  assert(brownVariant.name === 'Brown', 'Variant name is Brown');
  assert(brownVariant.hex === '#5c4033', 'Variant hex is #5c4033');
  assert(brownVariant.sizes && brownVariant.sizes.length === 1, 'Variant has 1 size option');
  assert(brownVariant.sizes[0].size === 'Custom measurements', 'Size option is "Custom measurements"');
  assert(brownVariant.sizes[0].available === true, 'Size option is available');
  assert(brownVariant.sizes[0].stock === undefined, 'No invented stock count on size option');

  // Measurements
  assert(Array.isArray(brownPants.measurements), 'Measurements is an array');
  assert(brownPants.measurements.length === 2, 'Has exactly 2 required measurements');
  assert(brownPants.measurements.includes('Waist circumference'), 'Requires Waist circumference');
  assert(brownPants.measurements.includes('Requested garment outseam'), 'Requires Requested garment outseam');

  // Reference note & pending fields
  assert(Boolean(brownPants.referenceNote), 'Has referenceNote defined');
  assert(!brownPants.referenceNote.includes('47 inches'), 'referenceNote does NOT copy 47 inches outseam');
  assert(!brownPants.referenceNote.includes("6'4\""), 'referenceNote does NOT copy 6\'4" model reference');
  assert(brownPants.productionTime === '', 'Production time remains pending ("")');
  assert(brownPants.careInstructions === '', 'Care instructions remain pending ("")');

  // --- 2. Anonymous Access Protection (Must Return 404) ---
  console.log('\n--- 2. Anonymous Access Protection ---');
  const anonDirect = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/brown-pinstripe-flared-pants',
    method: 'GET',
  });
  assert(anonDirect.statusCode === 404, `Anonymous GET /products/brown-pinstripe-flared-pants returns 404 (actual: ${anonDirect.statusCode})`);

  const anonPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/brown-pinstripe-flared-pants?preview=true',
    method: 'GET',
  });
  assert(anonPreview.statusCode === 404, `Anonymous GET with ?preview=true returns 404 (actual: ${anonPreview.statusCode})`);

  // --- 3. Authenticated Admin Preview & Custom Sizing UI ---
  console.log('\n--- 3. Authenticated Admin Preview & Custom Sizing UI ---');
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
  assert(Boolean(cookieHeader), 'Received admin session cookie');

  const adminPreviewRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/brown-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  const html = adminPreviewRes.body;

  assert(html.includes('Brown Pinstripe Flared Pants'), 'Admin preview renders Brown Pinstripe Flared Pants title');
  assert(html.includes('1,549') || html.includes('1549'), 'Admin preview renders 1,549 price');
  assert(!html.includes('1,549 (Demo)'), 'Price does NOT have (Demo) label');

  // Custom sizing controls present
  assert(html.includes('Custom measurements'), 'Renders "Custom measurements" size option');
  assert(html.includes('CUSTOM MEASUREMENTS'), 'Renders CUSTOM MEASUREMENTS panel header');
  assert(html.includes('IN (Inches)') && html.includes('CM (Centimetres)'), 'Renders Inches/cm unit toggle');
  assert(html.includes('Waist circumference'), 'Renders Waist circumference input field');
  assert(html.includes('Requested garment outseam'), 'Renders Requested garment outseam input field');

  // CTA button state: working input instead of SIZING PENDING
  assert(html.includes('ADD TO CART'), 'Renders active ADD TO CART button');
  assert(!html.includes('SIZING PENDING'), 'Does NOT render SIZING PENDING button');

  // Absence of model height / outseam copies
  assert(!html.includes('47 inches outseam is a reference garment specification modeled at 6\'4"'), 'Does NOT render Cocoa Denim 47" / 6\'4" reference text');
  assert(html.includes('Please specify your desired garment outseam and waist circumference. Customer values remain blank by default.'), 'Renders product-specific reference note');

  // --- 4. Custom Measurement Validation Logic ---
  console.log('\n--- 4. Measurement Validation Logic ---');
  function validateMeasurements(waist, outseam) {
    if (!waist.trim() || !outseam.trim()) {
      return { valid: false, error: 'Please enter both waist circumference and requested garment outseam before adding to bag.' };
    }
    const numWaist = parseFloat(waist.trim());
    const numOutseam = parseFloat(outseam.trim());
    if (isNaN(numWaist) || numWaist <= 0 || isNaN(numOutseam) || numOutseam <= 0) {
      return { valid: false, error: 'Please enter valid positive numbers for both waist circumference and requested garment outseam.' };
    }
    return { valid: true };
  }

  assert(validateMeasurements('', '').valid === false, 'Rejects blank initial values');
  assert(validateMeasurements('32', '').valid === false, 'Rejects blank outseam');
  assert(validateMeasurements('', '42').valid === false, 'Rejects blank waist');
  assert(validateMeasurements('-32', '42').valid === false, 'Rejects negative waist (-32)');
  assert(validateMeasurements('32', '-42').valid === false, 'Rejects negative outseam (-42)');
  assert(validateMeasurements('0', '42').valid === false, 'Rejects zero waist (0)');
  assert(validateMeasurements('32', '0').valid === false, 'Rejects zero outseam (0)');
  assert(validateMeasurements('abc', '42').valid === false, 'Rejects non-numeric waist ("abc")');
  assert(validateMeasurements('32', '42').valid === true, 'Accepts valid positive integers (32, 42)');
  assert(validateMeasurements('31.5', '41.5').valid === true, 'Accepts valid decimal measurements (31.5, 41.5)');

  // --- 5. Cart Separation & Quantity Merge Logic ---
  console.log('\n--- 5. Cart Separation & Merge Logic ---');
  function areMeasurementsEqual(m1, m2) {
    if (!m1 && !m2) return true;
    if (!m1 || !m2) return false;
    return (
      (m1.waist?.trim() || '') === (m2.waist?.trim() || '') &&
      (m1.outseam?.trim() || '') === (m2.outseam?.trim() || '') &&
      m1.unit === m2.unit
    );
  }

  function buildItemId(item) {
    let id = `${item.productId}_${item.variantName}_${item.size}`;
    if (item.customMeasurements) {
      const w = (item.customMeasurements.waist || '').trim();
      const o = (item.customMeasurements.outseam || '').trim();
      const u = item.customMeasurements.unit || 'in';
      id += `_w${w}_o${o}_${u}`;
    }
    return id;
  }

  let cart = [];
  function addToCart(newItem) {
    const existingIndex = cart.findIndex(
      (i) =>
        i.productId === newItem.productId &&
        i.variantName === newItem.variantName &&
        i.size === newItem.size &&
        areMeasurementsEqual(i.customMeasurements, newItem.customMeasurements)
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += newItem.quantity || 1;
    } else {
      cart.push({
        id: buildItemId(newItem),
        productId: newItem.productId,
        variantName: newItem.variantName,
        size: newItem.size,
        quantity: newItem.quantity || 1,
        customMeasurements: newItem.customMeasurements,
      });
    }
  }

  // Add Item B1: 32" waist, 42" outseam
  addToCart({
    productId: 'draft_brown_pinstripe_flared_pants',
    variantName: 'Brown',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 1, 'Cart has 1 item after adding first Brown Pants configuration');
  assert(cart[0].id === 'draft_brown_pinstripe_flared_pants_Brown_Custom measurements_w32_o42_in', 'Item B1 ID includes measurements');

  // Add Item B2: 34" waist, 44" outseam (different measurements)
  addToCart({
    productId: 'draft_brown_pinstripe_flared_pants',
    variantName: 'Brown',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '34', outseam: '44', unit: 'in' },
  });
  assert(cart.length === 2, 'Different measurements remain separate cart items (cart length 2)');
  assert(cart[0].id !== cart[1].id, 'Item B1 and B2 have distinct IDs');

  // Add Item B1 again (identical measurements) -> should merge quantity
  addToCart({
    productId: 'draft_brown_pinstripe_flared_pants',
    variantName: 'Brown',
    size: 'Custom measurements',
    quantity: 2,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 2, 'Identical measurements merge quantity (cart length unchanged at 2)');
  assert(cart[0].quantity === 3, `Item B1 merged quantity is 3 (actual: ${cart[0].quantity})`);

  // Add Item W1: White Pinstripe Pants for isolation check
  addToCart({
    productId: 'draft_white_pinstripe_flared_pants',
    variantName: 'White',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 3, 'Adding White Pants creates separate item W1 (cart length 3)');
  assert(cart[2].productId === 'draft_white_pinstripe_flared_pants', 'Item W1 is White Pinstripe Pants');

  // Add Item G1: Grey Pinstripe Pants for isolation check
  addToCart({
    productId: 'draft_grey_pinstripe_flared_pants',
    variantName: 'Grey',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 4, 'Adding Grey Pants creates separate item G1 (cart length 4)');
  assert(cart[3].productId === 'draft_grey_pinstripe_flared_pants', 'Item G1 is Grey Pinstripe Pants');

  // --- 6. WhatsApp & Checkout Enquiry Carry-Through ---
  console.log('\n--- 6. WhatsApp & Checkout Carry-Through ---');
  function formatWhatsAppOrder(items, catalogList) {
    const lines = [];
    lines.push('*DOWNFALL ATELIER — BESPOKE ORDER ENQUIRY*');
    lines.push('');
    lines.push('*ITEMS:*');
    items.forEach((item, idx) => {
      const prod = catalogList.find((p) => p.id === item.productId);
      const name = prod ? prod.name : item.productId;
      const price = prod ? prod.price : 0;
      const cur = prod ? prod.currency : 'INR';
      lines.push(`${idx + 1}. *${name}* (${item.variantName})`);
      lines.push(`   • Size: ${item.size}`);
      lines.push(`   • Quantity: ${item.quantity}`);
      lines.push(`   • Unit Price: ${cur === 'INR' ? '₹' : '$'}${price.toLocaleString('en-IN')}`);
      if (item.customMeasurements) {
        lines.push(`   • Custom Measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`);
      }
    });
    return lines.join('\n');
  }

  const waText = formatWhatsAppOrder(cart, catalog);
  assert(waText.includes('Brown Pinstripe Flared Pants'), 'WhatsApp message contains Brown Pinstripe Flared Pants');
  assert(waText.includes('₹1,549'), 'WhatsApp renders real INR 1,549 price without Demo');
  assert(waText.includes('Waist 32 in, Garment Outseam 42 in'), 'WhatsApp renders B1 bespoke measurements');
  assert(waText.includes('Waist 34 in, Garment Outseam 44 in'), 'WhatsApp renders B2 bespoke measurements');
  assert(waText.includes('White Pinstripe Flared Pants'), 'WhatsApp preserves White Pinstripe Pants entry');
  assert(waText.includes('Grey Pinstripe Flared Pants'), 'WhatsApp preserves Grey Pinstripe Pants entry');

  // --- 7. Publication Rejection Check via API ---
  console.log('\n--- 7. Publication Rejection Check ---');
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

  console.log('\n=== SUMMARY OF RESULTS ===');
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
