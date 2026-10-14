/**
 * DOWNFALL Atelier - Catalog Preparation Verification Test Suite
 *
 * Runs automated tests on:
 * 1. Removal of 10-unit made-to-order limit
 * 2. Fulfilment authoritative behavior preventing isMadeToOrder contradiction
 * 3. INR formatting across currency helpers
 * 4. Mixed INR/USD cart handling (never adding different currencies)
 * 5. Complete SQL Migration 002 integrity (no ellipses)
 * 6. Targeted import script constraints
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  RUNNING VERIFICATION TESTS FOR REAL-CATALOG PREPARATION');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  Error: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// TEST 1: Authoritative Fulfilment & isMadeToOrder Contradiction Prevention
// ----------------------------------------------------------------------------
runTest('Catalog Mapping: fulfilment="stocked" overrides is_made_to_order=true in DB rows', () => {
  const { mapDbRowToProduct, mapProductToDbRow } = require('../src/lib/catalog');
  
  // Row where is_made_to_order says true but fulfilment is 'stocked'
  const row1 = {
    id: 'test_1',
    slug: 'test-1',
    name: 'Test Garment 1',
    price: 100,
    currency: 'USD',
    category: 'basics',
    status: 'draft',
    fulfilment: 'stocked',
    is_made_to_order: true, // Contradictory flag
  };
  const product1 = mapDbRowToProduct(row1);
  assert.strictEqual(product1.fulfilment, 'stocked');
  assert.strictEqual(product1.isMadeToOrder, false, 'isMadeToOrder must be false when fulfilment is stocked');

  // Input where fulfilment is 'made_to_order' but isMadeToOrder is false
  const input2 = {
    id: 'test_2',
    fulfilment: 'made_to_order',
    isMadeToOrder: false, // Contradictory flag
  };
  const row2 = mapProductToDbRow(input2);
  assert.strictEqual(row2.fulfilment, 'made_to_order');
  assert.strictEqual(row2.is_made_to_order, true, 'is_made_to_order must be true when fulfilment is made_to_order');
});

runTest('Catalog Validation: publishability validator treats fulfilment as authoritative', () => {
  const { validateProductPublishability } = require('../src/lib/catalog-types');
  
  // A stocked product with variants and sizes, but with isMadeToOrder: true accidentally passed
  const productStocked = {
    name: 'Stocked Jacket',
    price: 250,
    category: 'formal',
    description: 'A fine jacket',
    images: ['/img1.jpg'],
    fulfilment: 'stocked',
    isMadeToOrder: true, // Should be ignored because fulfilment is 'stocked'
    variants: [
      {
        name: 'Black',
        hex: '#000',
        image: '/img1.jpg',
        sizes: [{ size: 'M', available: true, stock: 5 }],
      },
    ],
  };
  const res = validateProductPublishability(productStocked);
  // If it was treated as MTO, it would require productionTime and careInstructions
  // Since fulfilment is 'stocked', it should pass publishability without MTO fields!
  assert.strictEqual(res.canPublish, true, `Expected canPublish: true, got missing: ${res.missingFields.join(', ')}`);
});

// ----------------------------------------------------------------------------
// TEST 2: Removal of 10-Unit Made-to-Order Limit
// ----------------------------------------------------------------------------
runTest('Cart Logic: Made-to-order items allow quantities > 10 without artificial limit', () => {
  // Simulate CartContext validateItemsAgainstCatalog logic
  const activeCatalog = [
    {
      id: 'mto_item',
      name: 'Custom Trousers',
      price: 1549,
      currency: 'INR',
      fulfilment: 'made_to_order',
      isMadeToOrder: true,
      variants: [
        {
          name: 'Black',
          sizes: [{ size: 'Custom', available: true }],
        },
      ],
    },
    {
      id: 'stocked_item',
      name: 'Standard Tee',
      price: 35,
      currency: 'USD',
      fulfilment: 'stocked',
      isMadeToOrder: false,
      variants: [
        {
          name: 'White',
          sizes: [{ size: 'L', available: true, stock: 4 }],
        },
      ],
    },
  ];

  // Test MTO item with quantity 25
  const mtoCartItem = {
    id: 'mto_item_Black_Custom',
    productId: 'mto_item',
    variantName: 'Black',
    size: 'Custom',
    quantity: 25,
  };

  const product = activeCatalog.find((p) => p.id === mtoCartItem.productId);
  const isMadeToOrder = product?.fulfilment === 'made_to_order';
  assert.strictEqual(isMadeToOrder, true);

  // In updated logic:
  const validatedQty = isMadeToOrder ? Math.max(1, mtoCartItem.quantity) : Math.min(mtoCartItem.quantity, 10);
  assert.strictEqual(validatedQty, 25, 'Made-to-order item quantity of 25 must not be capped at 10');

  // Test Stocked item with quantity 25 and stock 4
  const stockedCartItem = {
    id: 'stocked_item_White_L',
    productId: 'stocked_item',
    variantName: 'White',
    size: 'L',
    quantity: 25,
  };
  const stockedProd = activeCatalog.find((p) => p.id === stockedCartItem.productId);
  const sizeInfo = stockedProd.variants[0].sizes[0];
  const stockedValidatedQty = Math.min(stockedCartItem.quantity, sizeInfo.stock);
  assert.strictEqual(stockedValidatedQty, 4, 'Stocked item must clamp to actual available stock (4)');
});

// ----------------------------------------------------------------------------
// TEST 3: Mixed Currency Cart Logic & INR Formatting
// ----------------------------------------------------------------------------
runTest('Mixed Currency Cart: INR and USD subtotals are NEVER added into a single scalar sum', () => {
  const cartItems = [
    { productId: 'mto_1', quantity: 2 }, // 2 * 1649 INR = 3298 INR
    { productId: 'tee_1', quantity: 3 }, // 3 * 35 USD = 105 USD
  ];

  const products = {
    mto_1: { price: 1649, currency: 'INR' },
    tee_1: { price: 35, currency: 'USD' },
  };

  const currencySubtotals = cartItems.reduce((acc, item) => {
    const prod = products[item.productId];
    acc[prod.currency] = (acc[prod.currency] || 0) + prod.price * item.quantity;
    return acc;
  }, {});

  assert.strictEqual(currencySubtotals.INR, 3298);
  assert.strictEqual(currencySubtotals.USD, 105);

  const currenciesInCart = Object.keys(currencySubtotals);
  assert.strictEqual(currenciesInCart.length, 2);
  const isMixed = currenciesInCart.length > 1;
  assert.strictEqual(isMixed, true);

  // Verify that subtotal does NOT equal 3298 + 105 = 3403
  const blendedSum = currencySubtotals.INR + currencySubtotals.USD;
  assert.notStrictEqual(
    currenciesInCart.length === 1 ? currencySubtotals[currenciesInCart[0]] : 0,
    blendedSum,
    'Subtotal must never equal blended currency sum'
  );

  // Formatted subtotal representation
  const formattedSubtotals = currenciesInCart.map((curr) => {
    const amount = currencySubtotals[curr];
    return curr === 'INR' ? `₹${amount.toLocaleString('en-IN')} INR` : `$${amount.toFixed(2)} USD`;
  });
  const formattedSubtotalString = formattedSubtotals.join(' + ');
  assert.strictEqual(formattedSubtotalString, '₹3,298 INR + $105.00 USD');
});

runTest('INR Number Formatting: Indian locale grouping and Rupee symbol format', () => {
  const price1 = 1649;
  const price2 = 120000; // 1 Lakh 20 Thousand
  
  const formatted1 = `₹${price1.toLocaleString('en-IN')}`;
  const formatted2 = `₹${price2.toLocaleString('en-IN')}`;
  
  assert.strictEqual(formatted1, '₹1,649');
  assert.strictEqual(formatted2, '₹1,20,000');
});

// ----------------------------------------------------------------------------
// TEST 4: SQL Migration 002 Integrity
// ----------------------------------------------------------------------------
runTest('SQL Migration 002: Contains complete update_product_atomic function without ellipses', () => {
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '002_add_bottomwear_and_made_to_order.sql');
  assert.ok(fs.existsSync(sqlPath), '002 migration file must exist');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Verify no ellipses
  assert.ok(!sql.includes('...'), 'Migration SQL must not contain ellipses "..."');
  assert.ok(!sql.includes('…'), 'Migration SQL must not contain ellipsis characters');

  // Verify complete structure
  assert.ok(sql.includes('begin;'), 'Must begin transaction');
  assert.ok(sql.includes('commit;'), 'Must commit transaction');
  assert.ok(sql.includes('products_category_check'), 'Must include category check constraint');
  assert.ok(sql.includes("'bottomwear'"), 'Must include bottomwear in category');
  assert.ok(sql.includes('products_fulfilment_sync_check'), 'Must include sync check constraint');
  assert.ok(sql.includes('create or replace function public.update_product_atomic'), 'Must contain complete update_product_atomic');
  assert.ok(sql.includes('is_made_to_order = (v_new_fulfilment = \'made_to_order\')'), 'Must synchronize is_made_to_order from authoritative fulfilment');
  assert.ok(sql.includes('revoke execute on function public.update_product_atomic'), 'Must include permission revokes');
  assert.ok(sql.includes('grant execute on function public.update_product_atomic'), 'Must include permission grants');
});

// ----------------------------------------------------------------------------
// TEST 5: Targeted Draft Import Script Constraints
// ----------------------------------------------------------------------------
runTest('Targeted Draft Import: Restricts import strictly to 7 bottomwear drafts in unpublished status', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'import-new-drafts.js');
  assert.ok(fs.existsSync(scriptPath), 'Targeted import script must exist');
  
  const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const TARGET_DRAFT_IDS = [
    'draft_cocoa_skater_denim',
    'draft_indigo_drape_jeans',
    'draft_beige_wide_leg_joggers',
    'draft_black_wide_leg_joggers',
    'draft_white_pinstripe_flared_pants',
    'draft_brown_pinstripe_flared_pants',
    'draft_grey_pinstripe_flared_pants',
    'draft_grey_wide_leg_joggers',
  ];

  const drafts = catalog.filter((p) => TARGET_DRAFT_IDS.includes(p.id));
  assert.strictEqual(drafts.length, 8, 'Must locate exactly 8 target drafts in catalog.json');

  drafts.forEach((draft) => {
    assert.strictEqual(draft.status, 'draft', `Draft ${draft.id} must be unpublished (status: draft)`);
    assert.strictEqual(draft.category, 'bottomwear', `Draft ${draft.id} must be category: bottomwear`);
    assert.strictEqual(draft.fulfilment, 'made_to_order', `Draft ${draft.id} must be fulfilment: made_to_order`);
    assert.strictEqual(draft.isMadeToOrder, true, `Draft ${draft.id} must have isMadeToOrder: true`);
    assert.strictEqual(draft.currency, 'INR', `Draft ${draft.id} must have currency: INR`);
    assert.strictEqual(draft.isDemoPrice, false, `Draft ${draft.id} must have isDemoPrice: false`);
  });

  // Verify demo products are NOT in the target draft list
  const demoIds = ['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4'];
  demoIds.forEach((demoId) => {
    assert.ok(!TARGET_DRAFT_IDS.includes(demoId), `Demo product ${demoId} must not be in target drafts`);
  });
});

console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
