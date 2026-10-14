const fs = require('fs');
const path = require('path');
const http = require('http');

async function runTests() {
  console.log('=== STARTING CUSTOM SIZING VERIFICATION: GREY JOGGERS & WHITE PINSTRIPE PANTS ===\n');
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

  // 1. Catalog Verification for Both Products
  console.log('--- 1. Catalog Verification: Custom Sizing Reusing Cocoa Denim Flow ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const greyJoggers = catalog.find((p) => p.id === 'draft_grey_wide_leg_joggers');
  const whitePants = catalog.find((p) => p.id === 'draft_white_pinstripe_flared_pants');

  assert(Boolean(greyJoggers), 'draft_grey_wide_leg_joggers exists in catalog.json');
  assert(Boolean(whitePants), 'draft_white_pinstripe_flared_pants exists in catalog.json');

  // Verify Grey Joggers attributes
  assert(greyJoggers.price === 1299, `Grey Joggers price is 1299 (actual: ${greyJoggers.price})`);
  assert(greyJoggers.currency === 'INR', 'Grey Joggers currency is INR');
  assert(greyJoggers.isDemoPrice === false, 'Grey Joggers isDemoPrice is false');
  assert(greyJoggers.category === 'bottomwear', 'Grey Joggers category is bottomwear');
  assert(greyJoggers.fulfilment === 'made_to_order', 'Grey Joggers fulfilment is made_to_order');
  assert(greyJoggers.isMadeToOrder === true, 'Grey Joggers isMadeToOrder is true');
  assert(greyJoggers.status === 'draft', 'Grey Joggers status is draft');
  assert(!greyJoggers.imageCorrectionRequired, 'Grey Joggers imageCorrectionRequired is cleared');
  assert(!greyJoggers.imageCorrectionNote, 'Grey Joggers imageCorrectionNote is cleared');
  assert(greyJoggers.description.includes('Elastic waistband with a grey drawstring'), 'Grey Joggers waistband spec retained');
  assert(greyJoggers.images.length === 4, 'Grey Joggers has exactly 4 corrected gallery images');
  assert(greyJoggers.variants[0].sizes.length === 1, 'Grey Joggers has 1 size option');
  assert(greyJoggers.variants[0].sizes[0].size === 'Custom measurements', 'Grey Joggers size is "Custom measurements"');
  assert(greyJoggers.variants[0].sizes[0].available === true, 'Grey Joggers size is available');
  assert(Array.isArray(greyJoggers.measurements) && greyJoggers.measurements.length === 2, 'Grey Joggers has 2 required measurements');
  assert(greyJoggers.measurements.includes('Waist circumference'), 'Grey Joggers requires Waist circumference');
  assert(greyJoggers.measurements.includes('Requested garment outseam'), 'Grey Joggers requires Requested garment outseam');
  assert(greyJoggers.productionTime === '', 'Grey Joggers production time remains pending');
  assert(greyJoggers.careInstructions === '', 'Grey Joggers care instructions remain pending');

  // Verify White Pinstripe Flared Pants attributes
  assert(whitePants.price === 1549, `White Pants price is 1549 (actual: ${whitePants.price})`);
  assert(whitePants.currency === 'INR', 'White Pants currency is INR');
  assert(whitePants.isDemoPrice === false, 'White Pants isDemoPrice is false');
  assert(whitePants.category === 'bottomwear', 'White Pants category is bottomwear');
  assert(whitePants.fulfilment === 'made_to_order', 'White Pants fulfilment is made_to_order');
  assert(whitePants.isMadeToOrder === true, 'White Pants isMadeToOrder is true');
  assert(whitePants.status === 'draft', 'White Pants status is draft');
  assert(whitePants.description.includes('100% High-Grade Viscose'), 'White Pants viscose spec retained');
  assert(whitePants.images.length === 5, 'White Pants has exactly 5 gallery images');
  assert(whitePants.variants[0].sizes.length === 1, 'White Pants has 1 size option');
  assert(whitePants.variants[0].sizes[0].size === 'Custom measurements', 'White Pants size is "Custom measurements"');
  assert(whitePants.variants[0].sizes[0].available === true, 'White Pants size is available');
  assert(Array.isArray(whitePants.measurements) && whitePants.measurements.length === 2, 'White Pants has 2 required measurements');
  assert(whitePants.measurements.includes('Waist circumference'), 'White Pants requires Waist circumference');
  assert(whitePants.measurements.includes('Requested garment outseam'), 'White Pants requires Requested garment outseam');
  assert(whitePants.productionTime === '', 'White Pants production time remains pending');
  assert(whitePants.careInstructions === '', 'White Pants care instructions remain pending');

  // 2. Cart Configuration & Separation Testing
  console.log('\n--- 2. Cart Separation & Quantity Merge Logic ---');
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

  function areMeasurementsEqual(m1, m2) {
    if (!m1 && !m2) return true;
    if (!m1 || !m2) return false;
    return (
      (m1.waist?.trim() || '') === (m2.waist?.trim() || '') &&
      (m1.outseam?.trim() || '') === (m2.outseam?.trim() || '') &&
      m1.unit === m2.unit
    );
  }

  let cart = [];
  function addToCart(newItem) {
    const existing = cart.find(
      (i) =>
        i.productId === newItem.productId &&
        i.variantName === newItem.variantName &&
        i.size === newItem.size &&
        areMeasurementsEqual(i.customMeasurements, newItem.customMeasurements)
    );
    if (existing) {
      existing.quantity += newItem.quantity || 1;
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

  // Add Item A1: Grey Joggers, Waist 32 in, Outseam 42 in
  addToCart({
    productId: 'draft_grey_wide_leg_joggers',
    variantName: 'Grey',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 1, 'Cart has 1 item after adding first Grey Joggers configuration');
  assert(cart[0].id.includes('draft_grey_wide_leg_joggers_Grey_Custom measurements_w32_o42_in'), 'Item A1 ID matches measurements');

  // Add Item A2: Grey Joggers, Waist 34 in, Outseam 44 in (Different measurement configuration)
  addToCart({
    productId: 'draft_grey_wide_leg_joggers',
    variantName: 'Grey',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '34', outseam: '44', unit: 'in' },
  });
  assert(cart.length === 2, 'Different measurements on Grey Joggers remain separate cart items');
  assert(cart[0].id !== cart[1].id, 'Item A1 and A2 have distinct IDs');

  // Add Item A1 again: Exact same measurements -> Merges quantity
  addToCart({
    productId: 'draft_grey_wide_leg_joggers',
    variantName: 'Grey',
    size: 'Custom measurements',
    quantity: 2,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 2, 'Identical measurements merge quantity (cart length unchanged at 2)');
  assert(cart[0].quantity === 3, `Item A1 merged quantity is 3 (actual: ${cart[0].quantity})`);

  // Add Item B1: White Pinstripe Flared Pants, Waist 28 in, Outseam 40 in
  addToCart({
    productId: 'draft_white_pinstripe_flared_pants',
    variantName: 'White',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '28', outseam: '40', unit: 'in' },
  });
  assert(cart.length === 3, 'Adding White Pinstripe Pants creates item B1 (cart length 3)');

  // Add Item B2: White Pinstripe Flared Pants, Waist 72 cm, Outseam 102 cm (Different unit)
  addToCart({
    productId: 'draft_white_pinstripe_flared_pants',
    variantName: 'White',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '72', outseam: '102', unit: 'cm' },
  });
  assert(cart.length === 4, 'White Pinstripe Pants with metric units creates separate item B2 (cart length 4)');

  // Add Item B1 again: Exact same measurements -> Merges quantity
  addToCart({
    productId: 'draft_white_pinstripe_flared_pants',
    variantName: 'White',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '28', outseam: '40', unit: 'in' },
  });
  assert(cart.length === 4, 'Identical measurements on White Pants merge quantity (cart length remains 4)');
  assert(cart[2].quantity === 2, `Item B1 merged quantity is 2 (actual: ${cart[2].quantity})`);

  // 3. WhatsApp Enquiry Verification
  console.log('\n--- 3. WhatsApp Enquiry Formatting ---');
  function generateWhatsAppTestMessage(items) {
    const lines = [];
    lines.push('*DOWNFALL — BESPOKE COLLECTION ENQUIRY*');
    lines.push('');
    lines.push('*ORDER ITEMS*');
    items.forEach((item, index) => {
      const prod = catalog.find((p) => p.id === item.productId);
      const isDemo = prod?.isDemoPrice !== false;
      const formattedPrice = `₹${prod.price.toLocaleString('en-IN')} INR${isDemo ? ' (Demo)' : ''}`;
      lines.push(`${index + 1}. *${prod.name}*`);
      lines.push(`   • Fulfilment: Made to Order (Bespoke)`);
      lines.push(`   • Colour: ${item.variantName}`);
      lines.push(`   • Base Size: ${item.size}`);
      if (item.customMeasurements) {
        lines.push(`   • Custom Measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`);
      }
      lines.push(`   • Quantity: ${item.quantity}`);
      lines.push(`   • Est. Unit Price: ${formattedPrice}`);
    });
    return lines.join('\n');
  }

  const waMsg = generateWhatsAppTestMessage(cart);
  assert(waMsg.includes('Grey Wide Leg Joggers'), 'WhatsApp message contains Grey Wide Leg Joggers');
  assert(waMsg.includes('₹1,299 INR') && !waMsg.includes('₹1,299 INR (Demo)'), 'WhatsApp renders real INR 1,299 price without Demo');
  assert(waMsg.includes('Custom Measurements: Waist 32 in, Garment Outseam 42 in'), 'WhatsApp renders Grey Joggers Item A1 measurements');
  assert(waMsg.includes('Custom Measurements: Waist 34 in, Garment Outseam 44 in'), 'WhatsApp renders Grey Joggers Item A2 measurements');

  assert(waMsg.includes('White Pinstripe Flared Pants'), 'WhatsApp message contains White Pinstripe Flared Pants');
  assert(waMsg.includes('₹1,549 INR') && !waMsg.includes('₹1,549 INR (Demo)'), 'WhatsApp renders real INR 1,549 price without Demo');
  assert(waMsg.includes('Custom Measurements: Waist 28 in, Garment Outseam 40 in'), 'WhatsApp renders White Pants Item B1 measurements');
  assert(waMsg.includes('Custom Measurements: Waist 72 cm, Garment Outseam 102 cm'), 'WhatsApp renders White Pants Item B2 metric measurements');

  // 4. Anonymous Visitor 404 Protection Check
  console.log('\n--- 4. Anonymous Protection Check (Must Return 404) ---');
  const anonGrey = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers',
    method: 'GET',
  });
  assert(anonGrey.statusCode === 404, `Anonymous GET /products/grey-wide-leg-joggers returns 404 (actual: ${anonGrey.statusCode})`);

  const anonGreyPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers?preview=true',
    method: 'GET',
  });
  assert(anonGreyPreview.statusCode === 404, `Anonymous GET /products/grey-wide-leg-joggers?preview=true returns 404 (actual: ${anonGreyPreview.statusCode})`);

  const anonWhite = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants',
    method: 'GET',
  });
  assert(anonWhite.statusCode === 404, `Anonymous GET /products/white-pinstripe-flared-pants returns 404 (actual: ${anonWhite.statusCode})`);

  const anonWhitePreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants?preview=true',
    method: 'GET',
  });
  assert(anonWhitePreview.statusCode === 404, `Anonymous GET /products/white-pinstripe-flared-pants?preview=true returns 404 (actual: ${anonWhitePreview.statusCode})`);

  // 5. Authenticated Admin Preview & Custom Sizing UI Verification
  console.log('\n--- 5. Authenticated Admin Preview & Custom Sizing UI ---');
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

  // Admin Preview for Grey Wide Leg Joggers
  const adminGreyRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/grey-wide-leg-joggers?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  assert(adminGreyRes.statusCode === 200, `Admin preview Grey Joggers returns 200 OK (actual: ${adminGreyRes.statusCode})`);
  assert(adminGreyRes.body.includes('Grey Wide Leg Joggers'), 'Admin preview renders Grey Wide Leg Joggers name');
  assert(adminGreyRes.body.includes('1,299'), 'Admin preview renders 1,299 price');
  assert(adminGreyRes.body.includes('Custom measurements'), 'Renders "Custom measurements" size option');
  assert(adminGreyRes.body.includes('CUSTOM MEASUREMENTS'), 'Renders CUSTOM MEASUREMENTS header');
  assert(adminGreyRes.body.includes('IN (Inches)') && adminGreyRes.body.includes('CM (Centimetres)'), 'Renders Inches/cm unit selector');
  assert(adminGreyRes.body.includes('Waist circumference') && adminGreyRes.body.includes('waist-circ-input'), 'Renders Waist circumference input label');
  assert(adminGreyRes.body.includes('Requested garment outseam') && adminGreyRes.body.includes('outseam-input'), 'Renders Requested garment outseam input label');
  assert(adminGreyRes.body.includes('47 inches outseam is a reference garment specification'), 'Renders 47" reference note');
  assert(!adminGreyRes.body.includes('IMAGES FLAGGED FOR CORRECTION'), 'IMAGES FLAGGED FOR CORRECTION alert banner is cleared');
  assert(adminGreyRes.body.includes('ADD TO CART'), 'Has active ADD TO CART button (not sizing pending)');

  // Admin Preview for White Pinstripe Flared Pants
  const adminWhiteRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/white-pinstripe-flared-pants?preview=true',
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  assert(adminWhiteRes.statusCode === 200, `Admin preview White Pants returns 200 OK (actual: ${adminWhiteRes.statusCode})`);
  assert(adminWhiteRes.body.includes('White Pinstripe Flared Pants'), 'Admin preview renders White Pinstripe Flared Pants name');
  assert(adminWhiteRes.body.includes('1,549'), 'Admin preview renders 1,549 price');
  assert(adminWhiteRes.body.includes('Custom measurements'), 'Renders "Custom measurements" size option on White Pants');
  assert(adminWhiteRes.body.includes('CUSTOM MEASUREMENTS'), 'Renders CUSTOM MEASUREMENTS header on White Pants');
  assert(adminWhiteRes.body.includes('IN (Inches)') && adminWhiteRes.body.includes('CM (Centimetres)'), 'Renders Inches/cm unit selector on White Pants');
  assert(adminWhiteRes.body.includes('Waist circumference') && adminWhiteRes.body.includes('waist-circ-input'), 'Renders Waist circumference label on White Pants');
  assert(adminWhiteRes.body.includes('Requested garment outseam') && adminWhiteRes.body.includes('outseam-input'), 'Renders Requested garment outseam label on White Pants');
  assert(adminWhiteRes.body.includes('ADD TO CART'), 'Has active ADD TO CART button on White Pants');

  // Verify product-specific reference note isolation (White Pants MUST NOT inherit 47-inch / 6'4" reference)
  assert(
    !adminWhiteRes.body.includes('47 inches') && !adminWhiteRes.body.includes('47-inch'),
    'White Pants does NOT render 47 inches outseam reference'
  );
  assert(
    !adminWhiteRes.body.includes("6'4\"") && !adminWhiteRes.body.includes("6&apos;4&quot;"),
    'White Pants does NOT render 6\'4" model reference'
  );
  assert(
    adminWhiteRes.body.includes('Please specify your desired garment outseam and waist circumference'),
    'White Pants renders product-specific custom measurements guidance note'
  );

  // 6. Positive-Number & Blank-Value Validation Logic
  console.log('\n--- 6. Positive-Number & Blank-Value Validation Logic ---');
  function validateMeasurements(waist, outseam) {
    if (!waist.trim() || !outseam.trim()) {
      return { valid: false, error: 'Please enter both waist circumference and requested garment outseam before adding to bag.' };
    }
    const nw = parseFloat(waist.trim());
    const no = parseFloat(outseam.trim());
    if (isNaN(nw) || nw <= 0 || isNaN(no) || no <= 0) {
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
  assert(validateMeasurements('abc', '42').valid === false, 'Rejects non-numeric waist ("abc")');
  assert(validateMeasurements('32', '42').valid === true, 'Accepts valid positive integers (32, 42)');
  assert(validateMeasurements('32.5', '42.75').valid === true, 'Accepts valid positive decimals (32.5, 42.75)');

  // 7. Publication Readiness & Draft Protection Check
  console.log('\n--- 7. Publication Readiness & Draft Protection Check ---');
  const { validateProductPublishability } = require('../src/lib/catalog-types');
  const greyCheck = validateProductPublishability(greyJoggers);
  const whiteCheck = validateProductPublishability(whitePants);

  assert(greyCheck.canPublish === true, 'Grey Joggers meets publication criteria (images corrected, specs complete)');
  assert(greyCheck.missingFields.length === 0, 'Grey Joggers has no missing publication fields');
  assert(whiteCheck.canPublish === true, 'White Pants meets publication criteria (deferred fields optional)');
  assert(whiteCheck.missingFields.length === 0, 'White Pants has no missing publication fields');

  assert(greyJoggers.status === 'draft', 'Grey Joggers remains strictly unpublished in draft status');
  assert(whitePants.status === 'draft', 'White Pants remains strictly unpublished in draft status');

  // Verify publishing a genuinely incomplete draft without images/sizes (Black Joggers) is blocked with 400
  const blackJoggers = catalog.find((p) => p.id === 'draft_black_wide_leg_joggers');
  const blackCheck = validateProductPublishability(blackJoggers);
  assert(blackCheck.canPublish === false, 'Black Joggers publishability blocked (missing images & sizes)');
  assert(blackCheck.missingFields.includes('Product photography / imagery'), 'Black Joggers missing photography');

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
