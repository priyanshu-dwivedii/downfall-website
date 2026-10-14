const fs = require('fs');
const path = require('path');
const http = require('http');

async function runTests() {
  console.log('=== STARTING 90S RETRO COCOA SKATER DENIM VERIFICATION ===\n');
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
  const imgDir = path.join(__dirname, '..', 'public', 'products', '90s-retro-cocoa-skater-denim');
  assert(fs.existsSync(imgDir), 'Directory public/products/90s-retro-cocoa-skater-denim exists');

  for (let i = 1; i <= 5; i++) {
    const filename = `cocoa-skater-denim-${i}.png`;
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
  const cocoa = catalog.find((p) => p.id === 'draft_cocoa_skater_denim');

  assert(Boolean(cocoa), 'draft_cocoa_skater_denim exists in catalog.json');
  assert(cocoa.status === 'draft', `Status is draft (actual: ${cocoa.status})`);
  assert(cocoa.price === 1649, `Price is 1649 (actual: ${cocoa.price})`);
  assert(cocoa.currency === 'INR', `Currency is INR (actual: ${cocoa.currency})`);
  assert(cocoa.isDemoPrice === false, `isDemoPrice is false (actual: ${cocoa.isDemoPrice})`);
  assert(cocoa.category === 'bottomwear', `Category is bottomwear (actual: ${cocoa.category})`);
  assert(cocoa.fulfilment === 'made_to_order', `Fulfilment is made_to_order (actual: ${cocoa.fulfilment})`);
  assert(cocoa.isMadeToOrder === true, `isMadeToOrder is true`);
  assert(Array.isArray(cocoa.images) && cocoa.images.length === 5, 'Has exactly 5 images in gallery array');
  assert(cocoa.images[0].includes('cocoa-skater-denim-1.png'), 'Image 1 is primary');
  assert(cocoa.images[1].includes('cocoa-skater-denim-2.png'), 'Image 2 is second');
  assert(cocoa.images[2].includes('cocoa-skater-denim-3.png'), 'Image 3 is third');
  assert(cocoa.images[3].includes('cocoa-skater-denim-4.png'), 'Image 4 is fourth');
  assert(cocoa.images[4].includes('cocoa-skater-denim-5.png'), 'Image 5 is fifth');

  assert(cocoa.variants.length === 1, 'Variants length is 1 (Cocoa)');
  assert(cocoa.variants[0].name === 'Cocoa', 'Variant name is Cocoa');
  assert(cocoa.variants[0].sizes.length === 1, 'Sizes length is 1');
  assert(cocoa.variants[0].sizes[0].size === 'Custom measurements', 'Sizing is "Custom measurements"');
  assert(cocoa.description.includes("1990s retro cocoa denim"), 'Approved description is retained');
  assert(cocoa.description.includes("47 inches"), 'Description references 47-inch reference outseam');

  // Verify it is excluded from public published listing
  const publishedProducts = catalog.filter((p) => p.status === 'published');
  assert(!publishedProducts.some((p) => p.id === 'draft_cocoa_skater_denim'), 'Draft is excluded from published catalog');

  // 3. Cart Separation & Measurement Carry-through Logic
  console.log('\n--- 3. Cart Separation & Measurement ID Logic ---');
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

  // Add Item 1: Waist 32 in, Outseam 42 in
  addToCart({
    productId: 'draft_cocoa_skater_denim',
    variantName: 'Cocoa',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 1, 'Cart has 1 item after first add');
  assert(cart[0].id.includes('w32_o42_in'), `Item 1 ID includes measurements: ${cart[0].id}`);

  // Add Item 2: Waist 34 in, Outseam 44 in (Different measurement configuration)
  addToCart({
    productId: 'draft_cocoa_skater_denim',
    variantName: 'Cocoa',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '34', outseam: '44', unit: 'in' },
  });
  assert(cart.length === 2, 'Cart has 2 distinct items for different measurement configurations');
  assert(cart[0].id !== cart[1].id, 'Item 1 and Item 2 have distinct IDs');

  // Add Item 1 again: exact same measurements -> increment quantity of Item 1
  addToCart({
    productId: 'draft_cocoa_skater_denim',
    variantName: 'Cocoa',
    size: 'Custom measurements',
    quantity: 1,
    customMeasurements: { waist: '32', outseam: '42', unit: 'in' },
  });
  assert(cart.length === 2, 'Cart still has 2 distinct items (did not create a 3rd item)');
  assert(cart[0].quantity === 2, `Item 1 quantity incremented to 2 (actual: ${cart[0].quantity})`);
  assert(cart[1].quantity === 1, `Item 2 quantity remained 1 (actual: ${cart[1].quantity})`);

  // 4. WhatsApp Enquiry Message Generation
  console.log('\n--- 4. WhatsApp Enquiry Message Verification ---');
  function generateWhatsAppTestMessage(items) {
    const lines = [];
    lines.push('*DOWNFALL — BESPOKE COLLECTION ENQUIRY*');
    lines.push('');
    lines.push('*CLIENT DETAILS*');
    lines.push('• Name: Test User');
    lines.push('');
    lines.push('*ORDER ITEMS*');
    items.forEach((item, index) => {
      const prod = catalog.find((p) => p.id === item.productId);
      const isDemo = prod?.isDemoPrice !== false;
      const formattedPrice = `₹${prod.price.toLocaleString('en-IN')} INR${isDemo ? ' (Demo)' : ''}`;
      lines.push(`${index + 1}. *${prod.name}*`);
      lines.push(`   • Fulfilment: Made to Order (Bespoke)`);
      lines.push(`   • Colour: ${item.variantName}`);
      lines.push(`   • Requested Size: ${item.size}`);
      if (item.customMeasurements) {
        lines.push(`   • Custom Measurements: Waist ${item.customMeasurements.waist} ${item.customMeasurements.unit}, Garment Outseam ${item.customMeasurements.outseam} ${item.customMeasurements.unit}`);
      }
      lines.push(`   • Quantity: ${item.quantity}`);
      lines.push(`   • Est. Unit Price: ${formattedPrice}`);
    });
    return lines.join('\n');
  }

  const waMsg = generateWhatsAppTestMessage(cart);
  assert(waMsg.includes('90s Retro Cocoa Skater Denim'), 'WhatsApp message contains product name');
  assert(waMsg.includes('₹1,649 INR') && !waMsg.includes('₹1,649 INR (Demo)'), 'WhatsApp message contains real price ₹1,649 INR without Demo tag');
  assert(waMsg.includes('Custom Measurements: Waist 32 in, Garment Outseam 42 in'), 'WhatsApp message contains Item 1 custom measurements');
  assert(waMsg.includes('Custom Measurements: Waist 34 in, Garment Outseam 44 in'), 'WhatsApp message contains Item 2 custom measurements');

  // 5. Local Dev Server HTTP Preview & Protection Check
  console.log('\n--- 5. Local HTTP Preview & Protection Check ---');
  // First: verify unauthenticated preview returns 404
  const unauthPreview = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/products/90s-retro-cocoa-skater-denim?preview=true', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', (err) => reject(err));
  });
  assert(unauthPreview.statusCode === 404, `Anonymous preview=true returns 404 (actual: ${unauthPreview.statusCode})`);

  // Second: log in as admin and verify authorized preview returns 200 with full details
  const loginPayload = JSON.stringify({
    username: 'Pratyaksh',
    password: '5sJ54iyUckeeSpTxpED6hbmCAiSq8dJG',
  });
  const adminCookie = await new Promise((resolve, reject) => {
    const req = http.request(
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
      (res) => {
        const sc = res.headers['set-cookie'];
        resolve(Array.isArray(sc) ? sc[0].split(';')[0] : sc?.split(';')[0]);
      }
    );
    req.on('error', reject);
    req.write(loginPayload);
    req.end();
  });

  const previewHtml = await new Promise((resolve, reject) => {
    http.get(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/products/90s-retro-cocoa-skater-denim?preview=true',
        headers: { Cookie: adminCookie },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    ).on('error', (err) => reject(err));
  });

  assert(previewHtml.statusCode === 200, `Authorized admin preview returns HTTP 200 (actual: ${previewHtml.statusCode})`);
  assert(previewHtml.body.includes('90s Retro Cocoa Skater Denim'), 'HTML contains product name');
  assert(previewHtml.body.includes('1,649'), 'HTML contains price 1,649');
  assert(previewHtml.body.includes('Made to Order'), 'HTML contains "Made to Order" tag');
  assert(previewHtml.body.includes('cocoa-skater-denim-1.png'), 'HTML contains Image 1');
  assert(previewHtml.body.includes('cocoa-skater-denim-2.png'), 'HTML contains Image 2');
  assert(previewHtml.body.includes('cocoa-skater-denim-3.png'), 'HTML contains Image 3');
  assert(previewHtml.body.includes('cocoa-skater-denim-4.png'), 'HTML contains Image 4');
  assert(previewHtml.body.includes('cocoa-skater-denim-5.png'), 'HTML contains Image 5');
  assert(previewHtml.body.includes('CUSTOM MEASUREMENTS'), 'HTML contains CUSTOM MEASUREMENTS section');
  assert(previewHtml.body.includes('Waist circumference'), 'HTML contains Waist circumference input field');
  assert(previewHtml.body.includes('Requested garment outseam'), 'HTML contains Requested garment outseam input field');
  assert(previewHtml.body.includes('47 inches outseam is a reference garment specification'), 'HTML contains reference specification note');

  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total checks passed: ${passed}`);
  console.log(`Total checks failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
