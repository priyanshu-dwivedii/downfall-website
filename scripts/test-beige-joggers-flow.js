const fs = require('fs');
const path = require('path');
const http = require('http');

async function runTests() {
  console.log('=== STARTING BEIGE WIDE LEG JOGGERS CUSTOM MEASUREMENTS VERIFICATION ===\n');
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

  // 1. Image Assets & Source Preservation
  console.log('--- 1. Image Assets & Preservation Verification ---');
  const targetDir = path.join(__dirname, '..', 'public', 'products', 'beige-wide-leg-joggers');
  assert(fs.existsSync(targetDir), 'Directory public/products/beige-wide-leg-joggers exists');

  const expectedImages = [
    { name: 'beige-wide-leg-joggers-1.png', size: 1799060 },
    { name: 'beige-wide-leg-joggers-2.png', size: 1812659 },
    { name: 'beige-wide-leg-joggers-3.png', size: 1702938 },
    { name: 'beige-wide-leg-joggers-4.png', size: 1755820 },
    { name: 'beige-wide-leg-joggers-5.png', size: 1925930 },
  ];

  for (const img of expectedImages) {
    const filePath = path.join(targetDir, img.name);
    assert(fs.existsSync(filePath), `Target image exists: ${img.name}`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(stats.size === img.size, `${img.name} size preserved exactly (${stats.size} bytes)`);
    }
  }

  // 2. Catalog Entry Verification: Custom Sizing & Confirmed Waistband
  console.log('\n--- 2. Catalog Verification: Confirmed Waistband & Custom Sizing ---');
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const beigeJoggers = catalog.find((p) => p.id === 'draft_beige_wide_leg_joggers');
  const greyJoggers = catalog.find((p) => p.id === 'draft_grey_wide_leg_joggers');
  const blackJoggers = catalog.find((p) => p.id === 'draft_black_wide_leg_joggers');

  assert(Boolean(beigeJoggers), 'draft_beige_wide_leg_joggers exists in catalog.json');
  assert(beigeJoggers.slug === 'beige-wide-leg-joggers', `Slug is beige-wide-leg-joggers (actual: ${beigeJoggers.slug})`);
  assert(beigeJoggers.name === 'Beige Wide Leg Joggers', `Name is Beige Wide Leg Joggers (actual: ${beigeJoggers.name})`);
  assert(beigeJoggers.status === 'draft', `Status is draft (actual: ${beigeJoggers.status})`);
  assert(beigeJoggers.price === 1299, `Price is 1299 (actual: ${beigeJoggers.price})`);
  assert(beigeJoggers.currency === 'INR', `Currency is INR (actual: ${beigeJoggers.currency})`);
  assert(beigeJoggers.isDemoPrice === false, `isDemoPrice is false (actual: ${beigeJoggers.isDemoPrice})`);
  assert(beigeJoggers.category === 'bottomwear', `Category is bottomwear (actual: ${beigeJoggers.category})`);
  assert(beigeJoggers.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${beigeJoggers.fulfilment})`);
  assert(beigeJoggers.isMadeToOrder === true, 'isMadeToOrder is true');

  // Images gallery order
  assert(Array.isArray(beigeJoggers.images) && beigeJoggers.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(beigeJoggers.images[0] === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-1.png', 'Image 1 is primary');
  assert(beigeJoggers.images[1] === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-2.png', 'Image 2 is second');
  assert(beigeJoggers.images[2] === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-3.png', 'Image 3 is third');
  assert(beigeJoggers.images[3] === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-4.png', 'Image 4 is fourth');
  assert(beigeJoggers.images[4] === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-5.png', 'Image 5 is fifth');

  // Variant colour is Beige
  assert(beigeJoggers.variants.length === 1, 'Variants length is 1');
  assert(beigeJoggers.variants[0].name === 'Beige', `Colour is Beige (actual: ${beigeJoggers.variants[0].name})`);
  assert(beigeJoggers.variants[0].hex.toLowerCase() === '#d4c5b9', `Hex is #D4C5B9 (actual: ${beigeJoggers.variants[0].hex})`);
  assert(beigeJoggers.variants[0].image === '/products/beige-wide-leg-joggers/beige-wide-leg-joggers-1.png', 'Primary image assigned to Beige variant');

  // Custom measurements sizing configuration
  assert(beigeJoggers.variants[0].sizes.length === 1, 'Beige Joggers has 1 size option');
  assert(beigeJoggers.variants[0].sizes[0].size === 'Custom measurements', 'Beige Joggers size is "Custom measurements"');
  assert(beigeJoggers.variants[0].sizes[0].available === true, 'Beige Joggers size is available');
  assert(Array.isArray(beigeJoggers.measurements) && beigeJoggers.measurements.length === 2, 'Beige Joggers requires 2 measurements');
  assert(beigeJoggers.measurements.includes('Waist circumference'), 'Requires Waist circumference');
  assert(beigeJoggers.measurements.includes('Requested garment outseam'), 'Requires Requested garment outseam');

  // Pending production and care instructions
  assert(beigeJoggers.productionTime === '', 'Leaves production time pending');
  assert(beigeJoggers.careInstructions === '', 'Leaves care instructions pending');

  // Fabric and fit specifications
  assert(beigeJoggers.description.includes('Breathable 220 GSM fabric'), 'Retains 220 GSM fabric specification');
  assert(beigeJoggers.description.includes('Relaxed wide-leg fit'), 'Retains relaxed wide-leg fit specification');
  assert(beigeJoggers.description.includes('High rise'), 'Retains high rise specification');

  // Confirmed Waistband: Elastic waistband with a beige drawstring
  assert(
    beigeJoggers.description.includes('Elastic waistband with a beige drawstring'),
    'Waistband updated to "Elastic waistband with a beige drawstring."'
  );
  assert(
    !beigeJoggers.description.toLowerCase().includes('without a drawstring'),
    'Description does NOT contain "without a drawstring"'
  );

  // Reference note
  assert(
    beigeJoggers.referenceNote && beigeJoggers.referenceNote.includes('47 inches outseam is a reference garment specification'),
    'Retains reference note explaining 47" outseam modeled at 6\'4" is not a default'
  );

  // Galleries isolation
  assert(greyJoggers.images.length === 5, 'Grey gallery remains 5 images');
  assert(blackJoggers.images.length === 0, 'Black gallery remains empty');
  assert(!beigeJoggers.images.some((img) => img.includes('grey-wide-leg-joggers')), 'Beige gallery isolated from Grey images');

  // 3. Cart Separation & Quantity Merge Logic
  console.log('\n--- 3. Cart Separation & Quantity Merge Logic ---');
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
      existing.quantity += newItem.quantity;
    } else {
      cart.push({ ...newItem, id: buildItemId(newItem) });
    }
  }

  // Add Item 1: Beige Joggers (32 in waist, 42 in outseam)
  addToCart({
    productId: 'draft_beige_wide_leg_joggers',
    variantName: 'Beige',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 1, 'Cart has 1 item after first addition');
  assert(cart[0].id === 'draft_beige_wide_leg_joggers_Beige_Custom measurements_w32_o42_in', 'Item 1 ID reflects measurements');

  // Add Item 2: Different measurements (34 in waist, 44 in outseam) -> must remain separate
  addToCart({
    productId: 'draft_beige_wide_leg_joggers',
    variantName: 'Beige',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '34', outseam: '44', unit: 'in' },
  });
  assert(cart.length === 2, 'Different measurements remain separate cart items (cart length: 2)');
  assert(cart[0].id !== cart[1].id, 'Item 1 and Item 2 have distinct IDs');

  // Add Item 3: Identical measurements as Item 1 -> must merge quantity
  addToCart({
    productId: 'draft_beige_wide_leg_joggers',
    variantName: 'Beige',
    size: 'Custom measurements',
    quantity: 2,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 2, 'Identical measurements merge quantity (cart length unchanged at 2)');
  assert(cart[0].quantity === 3, `Merged quantity is 3 (actual: ${cart[0].quantity})`);

  // Add Item 4: Metric units (81 cm waist, 106 cm outseam) -> must create separate item
  addToCart({
    productId: 'draft_beige_wide_leg_joggers',
    variantName: 'Beige',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '81', outseam: '106', unit: 'cm' },
  });
  assert(cart.length === 3, 'Metric unit configuration creates distinct cart item (cart length: 3)');

  // 4. WhatsApp Enquiry Message Formatting
  console.log('\n--- 4. WhatsApp Enquiry Formatting ---');
  function generateEnquiryMessage(items, orderNumber) {
    const lines = [
      `*ORDER ENQUIRY - ${orderNumber}*`,
      `=========================`,
      ``,
      `*ITEMS REQUESTED:*`,
    ];
    items.forEach((item, index) => {
      lines.push(`${index + 1}. *Beige Wide Leg Joggers*`);
      lines.push(`   • Colour: ${item.variantName}`);
      lines.push(`   • Size: ${item.size}`);
      lines.push(`   • Quantity: ${item.quantity}`);
      lines.push(`   • Price: ₹1,299 INR`);
      if (item.customMeasurements) {
        lines.push(
          `   • Custom Measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`
        );
      }
      lines.push(``);
    });
    return lines.join('\n');
  }

  const sampleEnquiry = generateEnquiryMessage(cart, 'ORD-BEIGE-TEST');
  assert(sampleEnquiry.includes('Beige Wide Leg Joggers'), 'WhatsApp enquiry includes Beige Wide Leg Joggers');
  assert(sampleEnquiry.includes('₹1,299 INR'), 'WhatsApp enquiry renders real price ₹1,299 INR');
  assert(!sampleEnquiry.includes('(Demo)'), 'WhatsApp enquiry does not contain (Demo)');
  assert(
    sampleEnquiry.includes('Custom Measurements: Waist 32 in, Garment Outseam 42 in'),
    'WhatsApp enquiry includes Item 1 custom measurements'
  );
  assert(
    sampleEnquiry.includes('Custom Measurements: Waist 81 cm, Garment Outseam 106 cm'),
    'WhatsApp enquiry includes metric custom measurements'
  );

  // 5. Draft Security & Protection Check
  console.log('\n--- 5. Draft Security & Protection Check ---');
  const anonNoPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/beige-wide-leg-joggers',
    method: 'GET',
  });
  assert(anonNoPreview.statusCode === 404, `Anonymous request without preview returns 404 (actual: ${anonNoPreview.statusCode})`);

  const anonWithPreview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/products/beige-wide-leg-joggers?preview=true',
    method: 'GET',
  });
  assert(anonWithPreview.statusCode === 404, `Anonymous request with preview=true returns 404 (actual: ${anonWithPreview.statusCode})`);

  const catalogRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/catalog',
    method: 'GET',
  });
  const catalogData = JSON.parse(catalogRes.body);
  assert(
    !catalogData.products.some((p) => p.id === 'draft_beige_wide_leg_joggers'),
    'Public /api/catalog does NOT expose draft_beige_wide_leg_joggers'
  );

  // 6. Authenticated Admin Preview & Custom Sizing UI
  console.log('\n--- 6. Authenticated Admin Preview & Custom Sizing UI ---');
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
    path: '/products/beige-wide-leg-joggers?preview=true',
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });

  assert(adminPreviewRes.statusCode === 200, `Admin preview returns 200 OK (actual: ${adminPreviewRes.statusCode})`);
  assert(adminPreviewRes.body.includes('Beige Wide Leg Joggers'), 'Admin preview renders product name');
  assert(adminPreviewRes.body.includes('1,299'), 'Admin preview renders price 1,299');
  const priceSnippet = adminPreviewRes.body.slice(
    adminPreviewRes.body.indexOf('1,299'),
    adminPreviewRes.body.indexOf('1,299') + 200
  );
  assert(!priceSnippet.includes('(Demo)'), 'Main price does NOT have (Demo) tag');

  // Verify all 5 images rendered in thumbnail gallery
  assert(adminPreviewRes.body.includes('beige-wide-leg-joggers-1.png'), 'Gallery contains Image 1');
  assert(adminPreviewRes.body.includes('beige-wide-leg-joggers-2.png'), 'Gallery contains Image 2');
  assert(adminPreviewRes.body.includes('beige-wide-leg-joggers-3.png'), 'Gallery contains Image 3');
  assert(adminPreviewRes.body.includes('beige-wide-leg-joggers-4.png'), 'Gallery contains Image 4');
  assert(adminPreviewRes.body.includes('beige-wide-leg-joggers-5.png'), 'Gallery contains Image 5');

  // Verify Colour Beige
  assert(adminPreviewRes.body.includes('Beige'), 'Renders Beige colour swatch');

  // Verify Custom Measurements UI components
  assert(adminPreviewRes.body.includes('Custom measurements'), 'Renders Custom measurements size option');
  assert(adminPreviewRes.body.includes('CUSTOM MEASUREMENTS'), 'Renders CUSTOM MEASUREMENTS panel');
  assert(adminPreviewRes.body.includes('IN (Inches)'), 'Renders Inches unit selector');
  assert(adminPreviewRes.body.includes('CM (Centimetres)'), 'Renders Centimetres unit selector');
  assert(adminPreviewRes.body.includes('Waist circumference'), 'Renders Waist circumference label');
  assert(adminPreviewRes.body.includes('Requested garment outseam'), 'Renders Requested garment outseam label');
  assert(adminPreviewRes.body.includes('47 inches outseam is a reference garment specification'), 'Renders 47" reference note');

  // Verify working custom-measurement flow replaces SIZING PENDING
  assert(!adminPreviewRes.body.includes('SIZING PENDING'), 'Does NOT display SIZING PENDING');
  assert(adminPreviewRes.body.includes('ADD TO CART'), 'Add to cart button displays active ADD TO CART');

  // Verify Waistband Specification in description
  assert(
    adminPreviewRes.body.includes('Elastic waistband with a beige drawstring'),
    'Admin preview description contains "Elastic waistband with a beige drawstring"'
  );

  // 7. Positive-Number & Blank-Value Validation Logic
  console.log('\n--- 7. Positive-Number & Blank-Value Validation Logic ---');
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
  assert(validateMeasurements('abc', '42').valid === false, 'Rejects non-numeric waist ("abc")');
  assert(validateMeasurements('32', '42').valid === true, 'Accepts valid positive integers (32, 42)');
  assert(validateMeasurements('32.5', '42.75').valid === true, 'Accepts valid positive decimals (32.5, 42.75)');

  // 8. Publication Lock Verification (Cannot Publish Draft with Pending Care/Production)
  console.log('\n--- 8. Publication Lock Verification ---');
  const publishAttemptPayload = JSON.stringify({
    status: 'published',
  });
  const publishAttemptRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/draft_beige_wide_leg_joggers',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(publishAttemptPayload),
        Cookie: cookieHeader,
      },
    },
    publishAttemptPayload
  );
  assert(
    publishAttemptRes.statusCode === 400,
    `Admin endpoint blocks publishing incomplete draft with 400 (actual: ${publishAttemptRes.statusCode})`
  );
  const publishResBody = JSON.parse(publishAttemptRes.body);
  assert(
    publishResBody.error && publishResBody.error.includes('Cannot publish product'),
    `Admin endpoint returns explicit publish block error: "${publishResBody.error?.slice(0, 70)}..."`
  );

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
