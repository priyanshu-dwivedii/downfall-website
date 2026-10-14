# DOWNFALL Atelier - Targeted Draft Import & Catalog Review

**Document Status:** Pending Client Review & Sign-Off  
**Target Catalog Phase:** Bottomwear Catalog Preparation (8 Drafts)  
**Security & Release Rule:** Strict Draft Status (`status: "draft"`). No cloud migrations, no deployments, no public visibility.

---

## 1. Targeted Draft Overview

A total of **8 bottomwear drafts** are prepared in the local catalog (`src/data/catalog.json`) and configured for targeted Supabase import via `scripts/import-new-drafts.js`.

All drafts adhere to:
- **Authoritative Fulfilment:** `fulfilment: "made_to_order"`, `isMadeToOrder: true`
- **Pricing:** Real commercial INR pricing with `isDemoPrice: false` (no Demo labels)
- **Status:** Unpublished (`status: "draft"`)
- **Protection:** Protected from anonymous visitors (returns 404 even with `?preview=true`); protected from public cart validation and enquiry APIs.
- **Demo Product Preservation:** Live demo products (`c1`, `f1`, `x1`, `p1`, `p2`, `p3`, `p4`) remain protected and untouched.

---

## 2. Master Table of 8 Targeted Drafts

| # | Product ID | Slug | Name | Price | Category | Fulfilment | Colour | Primary Image | Gallery Count | Sizing & Specifications Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `draft_cocoa_skater_denim` | `90s-retro-cocoa-skater-denim` | 90s Retro Cocoa Skater Denim | ₹1,649 INR | Bottomwear | Made to order | Cocoa (`#5c4033`) | `cocoa-skater-denim-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam) |
| 2 | `draft_indigo_drape_jeans` | `classic-indigo-drape-jeans` | Classic Indigo Drape Jeans | ₹1,799 INR | Bottomwear | Made to order | Indigo (`#264E86`) | `classic-indigo-drape-jeans-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam); specs confirmed |
| 3 | `draft_beige_wide_leg_joggers` | `beige-wide-leg-joggers` | Beige Wide Leg Joggers | ₹1,299 INR | Bottomwear | Made to order | Beige (`#D4C5B9`) | `beige-wide-leg-joggers-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam); specs confirmed |
| 4 | `draft_black_wide_leg_joggers` | `black-wide-leg-joggers` | Black Wide Leg Joggers | ₹1,199 INR | Bottomwear | Made to order | Black | Pending assets | 0 | Specifications pending |
| 5 | `draft_white_pinstripe_flared_pants` | `white-pinstripe-flared-pants` | White Pinstripe Flared Pants | ₹1,549 INR | Bottomwear | Made to order | White (`#FFFFFF`) | `white-pinstripe-flared-pants-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam); specs pending |
| 6 | `draft_brown_pinstripe_flared_pants` | `brown-pinstripe-flared-pants` | Brown Pinstripe Flared Pants | ₹1,549 INR | Bottomwear | Made to order | Brown (`#5c4033`) | `brown-pinstripe-flared-pants-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam); specs pending |
| 7 | `draft_grey_pinstripe_flared_pants` | `grey-pinstripe-flared-pants` | Grey Pinstripe Flared Pants | ₹1,549 INR | Bottomwear | Made to order | Grey (`#808080`) | `grey-pinstripe-flared-pants-1.png` | 5 PNGs | Custom measurements (Waist circumference, Outseam); specs pending |
| 8 | `draft_grey_wide_leg_joggers` | `grey-wide-leg-joggers` | Grey Wide Leg Joggers | ₹1,299 INR | Bottomwear | Made to order | Grey (`#808080`) | `grey-wide-leg-joggers-1.png` | 5 PNGs (Flagged) | Custom measurements (Waist circumference, Outseam); images flagged: black tips; specs pending |

---

## 2.5 Draft 2 Focus: Classic Indigo Drape Jeans

### 2.5.1 Metadata & Pricing
- **Draft ID:** `draft_indigo_drape_jeans`
- **Slug:** `classic-indigo-drape-jeans`
- **Name:** Classic Indigo Drape Jeans
- **Price:** INR 1799 (`price: 1799`, `currency: "INR"`, `isDemoPrice: false`, no Demo label)
- **Category:** `bottomwear`
- **Fulfilment:** `made_to_order` (`isMadeToOrder: true`)
- **Colour:** Indigo (`#264E86`)
- **Publication Status:** `draft` (Unpublished)

### 2.5.2 Image Assets & Gallery Order
Copied from `D:\Downfall Products\Downfall Products\90s Retro Cocoa Skater Denim`:
1. **Primary Photo (Image 1):** `/products/classic-indigo-drape-jeans/classic-indigo-drape-jeans-1.png` (1.92 MB, from `ChatGPT Image Oct 14, 2026, 02_45_04 PM-1.png`)
2. **Gallery Photo (Image 2):** `/products/classic-indigo-drape-jeans/classic-indigo-drape-jeans-2.png` (1.90 MB, from `ChatGPT Image Oct 14, 2026, 02_45_43 PM-2.png`)
3. **Gallery Photo (Image 3):** `/products/classic-indigo-drape-jeans/classic-indigo-drape-jeans-3.png` (1.78 MB, from `ChatGPT Image Oct 14, 2026, 02_45_48 PM-3.png`)
4. **Gallery Photo (Image 4):** `/products/classic-indigo-drape-jeans/classic-indigo-drape-jeans-4.png` (1.87 MB, from `ChatGPT Image Oct 14, 2026, 02_45_54 PM-4.png`)
5. **Gallery Photo (Image 5):** `/products/classic-indigo-drape-jeans/classic-indigo-drape-jeans-5.png` (2.25 MB, from `ChatGPT Image Oct 14, 2026, 02_45_59 PM-5.png`)

*All 5 images are preserved in their original PNG format and byte-level resolution without recolouring, stretching, or garment alterations.*

### 2.5.3 Specifications & Construction
- **Overview:** Upgrade your daily rotation with a classic indigo finish and a relaxed, wide-leg silhouette. Inspired by the easy proportions of retro denim, these jeans bring a flowing drape and understated character to everyday dressing.
- **Key Features:**
  - Classic Indigo Colour: A versatile blue shade that pairs effortlessly with everyday essentials.
  - Relaxed Wide-Leg Silhouette: A generous cut for an easy, laid-back look.
  - High-Rise Cut: A defined waist balanced by a loose leg profile.
  - Bespoke Fit: Made to order with custom waist and garment-length measurements.
- **Size & Fit Information:**
  - Fit: Relaxed, wide-leg fit
  - Rise: High rise
  - Colour: Indigo
  - Sizing: Custom waist circumference and garment outseam
  - Fulfilment: Made to order
- **Custom Sizing Configuration:**
  - Sizing option: `Custom measurements` (`available: true`).
  - Required measurements: `Waist circumference` and `Requested garment outseam`.
  - Unit toggle: Inches / CM supported.
  - Initial input states: Inputs remain blank by default.
  - Reference Note: `"Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."`

---

## 3. Draft 8 Focus: Grey Wide Leg Joggers

### 3.1 Metadata & Pricing
- **Draft ID:** `draft_grey_wide_leg_joggers`
- **Slug:** `grey-wide-leg-joggers`
- **Price:** INR 1299 (`price: 1299`, `currency: "INR"`, `isDemoPrice: false`)
- **Category:** `bottomwear`
- **Fulfilment:** `made_to_order` (`isMadeToOrder: true`)
- **Colour:** Grey (`#808080`)
- **Publication Status:** `draft` (Unpublished)
- **Image Correction Flag:** `imageCorrectionRequired: true` (Flagged for correction — do not publish mismatched images)

### 3.2 Image Assets & Gallery Order
Copied from `D:\Downfall Products\Downfall Products\Wide leg joggers`:
1. **Primary Photo (Image 1):** `/products/grey-wide-leg-joggers/grey-wide-leg-joggers-1.png` (1.80 MB)
2. **Gallery Photo (Image 2):** `/products/grey-wide-leg-joggers/grey-wide-leg-joggers-2.png` (1.77 MB)
3. **Gallery Photo (Image 3):** `/products/grey-wide-leg-joggers/grey-wide-leg-joggers-3.png` (1.69 MB)
4. **Gallery Photo (Image 4):** `/products/grey-wide-leg-joggers/grey-wide-leg-joggers-4.png` (1.75 MB)
5. **Gallery Photo (Image 5):** `/products/grey-wide-leg-joggers/grey-wide-leg-joggers-5.png` (2.03 MB)

*All images are preserved in their original PNG format and resolution without recolouring, stretching, or garment alterations.*

### 3.3 Garment Specification & Waistband Confirmation
- **Fabric:** Breathable 220 GSM fabric retained.
- **Fit:** Relaxed wide-leg fit retained.
- **Rise:** High rise retained.
- **Waistband Specification:** Confirmed and updated to **“Elastic waistband with a grey drawstring.”** The client confirms the drawstring has no black tips or sections. All references to black, metal, or dipped aglets have been removed:  
- **Sizing Configuration:** Configured for custom sizing reusing the cocoa denim measurement flow (`sizes: [{ size: "Custom measurements", available: true }]`, `measurements: ["Waist circumference", "Requested garment outseam"]`). No standard sizes or stock quantities invented.
- **Reference Notes:** Reference notes are configured product-specifically. Grey Wide Leg Joggers displays the supplied 47" reference outseam modeled at 6'4", whereas White Pinstripe Flared Pants omits all model measurements and displays clean bespoke measurement guidance.
- **Care & Production:** Production time (`""`) and care instructions (`""`) remain pending client confirmation.

### 3.4 Image Correction Flagging & Publication Lock
- **Flagged for Correction:** The supplied photos show black drawstring ends, which contradicts the confirmed garment detail (grey drawstring with no black tips or sections).
- **Originals Preserved Intact:** The 5 original PNG files remain unmodified on disk and in the draft gallery for reference and reshoot comparison.
- **Publication Lock:** The draft is strictly unpublished (`status: "draft"`). In addition, `validateProductPublishability()` and `scripts/import-new-drafts.js` enforce that products with `imageCorrectionRequired: true` cannot be published or deployed with mismatched imagery.

### 3.5 Image Isolation Verification
- `draft_beige_wide_leg_joggers`: isolated with its 5 Beige images (`/products/beige-wide-leg-joggers/beige-wide-leg-joggers-1..5.png`)
- `draft_black_wide_leg_joggers`: `images: []` (no images assigned)
- The 5 grey jogger PNGs are strictly isolated to `draft_grey_wide_leg_joggers`.

---

## 4. Draft 7 Focus: Grey Pinstripe Flared Pants

### 4.1 Metadata & Pricing
- **Draft ID:** `draft_grey_pinstripe_flared_pants`
- **Slug:** `grey-pinstripe-flared-pants`
- **Name:** Grey Pinstripe Flared Pants
- **Price:** INR 1549 (`price: 1549`, `currency: "INR"`, `isDemoPrice: false`, no Demo label)
- **Category:** `bottomwear`
- **Fulfilment:** `made_to_order` (`isMadeToOrder: true`)
- **Colour:** Grey (`#808080`)
- **Publication Status:** `draft` (Unpublished)

### 4.2 Image Assets & Gallery Order
Copied from `D:\Downfall Products\Downfall Products\Pinstripe Flared Pants`:
1. **Primary Photo (Image 1):** `/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-1.png` (1.78 MB, from `ChatGPT Image Oct 13, 2026, 09_51_56 PM-1.png`)
2. **Gallery Photo (Image 2):** `/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-2.png` (1.75 MB, from `ChatGPT Image Oct 13, 2026, 09_52_08 PM-2.png`)
3. **Gallery Photo (Image 3):** `/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-3.png` (1.68 MB, from `ChatGPT Image Oct 13, 2026, 09_52_11 PM-3.png`)
4. **Gallery Photo (Image 4):** `/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-4.png` (1.75 MB, from `ChatGPT Image Oct 13, 2026, 09_52_15 PM-4.png`)
5. **Gallery Photo (Image 5):** `/products/grey-pinstripe-flared-pants/grey-pinstripe-flared-pants-5.png` (1.80 MB, from `ChatGPT Image Oct 13, 2026, 09_52_18 PM-5.png`)

*All 5 images are preserved without recolouring, stretching, or altering garment details.*

### 4.3 Specifications & Custom Measurements Configuration
- **Description:** Approved pinstripe description retained (100% High-Grade Viscose, knee-down flare, two-button closure).
- **Custom Sizing Flow:**
  - Sizing option: `Custom measurements` (`available: true`).
  - Required measurements: `Waist circumference` and `Requested garment outseam`.
  - Reuses White Pinstripe Pants flow: Inches/cm unit toggle, blank initial inputs, positive-number validation.
  - Cart separation: Different measurement configurations remain separate cart items; identical merge quantities.
  - Measurement carry-through: Custom measurements displayed in cart drawer, cart page, checkout review, and formatted into WhatsApp enquiry message.
  - Reference Note: Product-specific note (`"Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."`); zero copied model height (`6'4"`) or outseam (`47"`) claims.
- **Gallery Isolation:** White Pinstripe Flared Pants (5 white images) and Brown Pinstripe Flared Pants (5 brown images) remain mutually isolated and untouched.

---

## 5. Draft 6 Focus: Brown Pinstripe Flared Pants

### 5.1 Metadata & Pricing
- **Draft ID:** `draft_brown_pinstripe_flared_pants`
- **Slug:** `brown-pinstripe-flared-pants`
- **Name:** Brown Pinstripe Flared Pants
- **Price:** INR 1549 (`price: 1549`, `currency: "INR"`, `isDemoPrice: false`, no Demo label)
- **Category:** `bottomwear`
- **Fulfilment:** `made_to_order` (`isMadeToOrder: true`)
- **Colour:** Brown (`#5c4033`)
- **Publication Status:** `draft` (Unpublished)

### 5.2 Image Assets & Gallery Order
Copied from `D:\Downfall Products\Downfall Products\Pinstripe Flared Pants`:
1. **Primary Photo (Image 1):** `/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-1.png` (1.83 MB, from `ChatGPT Image Oct 13, 2026, 10_38_31 PM-1.png`)
2. **Gallery Photo (Image 2):** `/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-2.png` (1.74 MB, from `ChatGPT Image Oct 13, 2026, 10_38_43 PM-2.png`)
3. **Gallery Photo (Image 3):** `/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-3.png` (1.78 MB, from `ChatGPT Image Oct 13, 2026, 10_38_45 PM-3.png`)
4. **Gallery Photo (Image 4):** `/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-4.png` (1.74 MB, from `ChatGPT Image Oct 13, 2026, 10_38_47 PM-4.png`)
5. **Gallery Photo (Image 5):** `/products/brown-pinstripe-flared-pants/brown-pinstripe-flared-pants-5.png` (1.82 MB, from `ChatGPT Image Oct 13, 2026, 10_38_50 PM-5.png`)

*All 5 images are preserved without recolouring, stretching, or altering garment details.*

### 5.3 Specifications & Custom Measurements Configuration
- **Description:** Approved pinstripe description retained (100% High-Grade Viscose, knee-down flare, broad waistline, two-button closure).
- **Custom Sizing Flow:**
  - Sizing option: `Custom measurements` (`available: true`).
  - Required measurements: `Waist circumference` and `Requested garment outseam`.
  - Reuses White/Grey Pinstripe Pants flow: Inches/cm unit toggle, blank initial inputs, positive-number validation.
  - Cart separation: Different measurement configurations remain separate cart items; identical merge quantities.
  - Measurement carry-through: Custom measurements displayed in cart drawer, cart page, checkout review, and formatted into WhatsApp enquiry message.
  - Reference Note: Product-specific note (`"Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."`); zero copied model height (`6'4"`) or outseam (`47"`) claims.
  - No invented stock counts: Made-to-order garment without artificial inventory limits.
- **Production Time & Care:** Production time (`""`) and care instructions (`""`) remain pending confirmation.
- **Gallery Isolation:** White Pinstripe Flared Pants (5 white images) and Grey Pinstripe Flared Pants (5 grey images) remain completely unchanged.

---

## 5.6 Draft 3 Focus: Beige Wide Leg Joggers

### 5.6.1 Metadata & Pricing
- **Draft ID:** `draft_beige_wide_leg_joggers`
- **Slug:** `beige-wide-leg-joggers`
- **Name:** Beige Wide Leg Joggers
- **Price:** INR 1299 (`price: 1299`, `currency: "INR"`, `isDemoPrice: false`, no Demo label)
- **Category:** `bottomwear`
- **Fulfilment:** `made_to_order` (`isMadeToOrder: true`)
- **Colour:** Beige (`#D4C5B9`)
- **Publication Status:** `draft` (Unpublished)

### 5.6.2 Image Assets & Gallery Order
Copied from `D:\Downfall Products\Downfall Products\Wide leg joggers`:
1. **Primary Photo (Image 1):** `/products/beige-wide-leg-joggers/beige-wide-leg-joggers-1.png` (1.80 MB, from `ChatGPT Image Oct 13, 2026, 11_10_42 PM-1.png`)
2. **Gallery Photo (Image 2):** `/products/beige-wide-leg-joggers/beige-wide-leg-joggers-2.png` (1.81 MB, from `ChatGPT Image Oct 13, 2026, 11_10_45 PM-2.png`)
3. **Gallery Photo (Image 3):** `/products/beige-wide-leg-joggers/beige-wide-leg-joggers-3.png` (1.70 MB, from `ChatGPT Image Oct 13, 2026, 11_10_47 PM-3.png`)
4. **Gallery Photo (Image 4):** `/products/beige-wide-leg-joggers/beige-wide-leg-joggers-4.png` (1.76 MB, from `ChatGPT Image Oct 13, 2026, 11_10_49 PM-4.png`)
5. **Gallery Photo (Image 5):** `/products/beige-wide-leg-joggers/beige-wide-leg-joggers-5.png` (1.93 MB, from `ChatGPT Image Oct 13, 2026, 11_10_51 PM-5.png`)

*All 5 images are preserved in their original PNG format and byte-level resolution without recolouring, stretching, or alteration.*

### 5.6.3 Specifications & Construction
- **Fabric:** Breathable 220 GSM fabric retained.
- **Fit:** Relaxed wide-leg fit and high rise retained.
- **Waistband Specification:** Confirmed as **“Elastic waistband with a beige drawstring.”**
- **Sizing Configuration:** Configured for custom measurements reusing the Grey Joggers / Cocoa Denim flow (`sizes: [{ size: "Custom measurements", available: true }]`, `measurements: ["Waist circumference", "Requested garment outseam"]`).
  - Unit toggle: Inches / CM
  - Inputs: Waist circumference and Requested garment outseam (blank by default)
  - Validation: Positive number validation
  - Cart separation & merge: Distinct measurements remain separate; identical merge quantities
  - Carry-through: Displays in cart drawer, cart page, checkout, and WhatsApp enquiry
- **Reference Note:** `"47 inches outseam is a reference garment specification modeled at 6'4\", not a default. Please specify your desired garment outseam. Customer values remain blank by default."`
- **Care & Production:** Production time (`""`) and care instructions (`""`) remain pending confirmation.
- **Gallery Isolation:** Grey Wide Leg Joggers (5 grey images) and Black Wide Leg Joggers (0 images) remain completely untouched.

---

## 6. Targeted Import Preparation (`scripts/import-new-drafts.js`)

The targeted import script is configured with a strict whitelist:
```javascript
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
```

### Safety Guarantees:
- **Dry-Run by Default:** Running `node scripts/import-new-drafts.js` performs validation and outputs a detailed preview without touching Supabase.
- **Upsert Isolation:** Only imports the 8 targeted drafts; never performs a bulk wipe or affects demo products.
- **Protected Demo IDs:** `['c1', 'f1', 'x1', 'p1', 'p2', 'p3', 'p4']` are guarded and cannot be overwritten.
- **Draft Enforceability:** All rows enforce `status: "draft"`.

---

## 7. Security & Admin Preview Access

### 7.1 Public / Anonymous Access Protection
- Direct access: `GET /products/brown-pinstripe-flared-pants`, `GET /products/grey-pinstripe-flared-pants`, `GET /products/grey-wide-leg-joggers` $\rightarrow$ **404 Not Found**
- Query bypass attempt: `GET /products/brown-pinstripe-flared-pants?preview=true` (without admin session) $\rightarrow$ **404 Not Found**
- Public Catalog API: `GET /api/catalog` $\rightarrow$ Drafts are filtered out
- Public Order Enquiry API: `POST /api/enquiry/validate` $\rightarrow$ **400 Bad Request** ("Product is currently unavailable")

### 7.2 Authenticated Local Preview
- **Route:** `http://localhost:3000/products/brown-pinstripe-flared-pants?preview=true`
- **Authentication:** Requires valid admin session cookie obtained via `/api/admin/auth/login`.
- **UI State in Preview:**
  - Displays product title: **Brown Pinstripe Flared Pants**
  - Displays real price: **₹1,549** without `(Demo)` label
  - Displays badge: **Made to Order**
  - Renders 5-image thumbnail gallery (`brown-pinstripe-flared-pants-1.png` primary, `2`–`5` ordered)
  - Renders Brown colour swatch (`#5c4033`)
  - Retains approved Viscose pinstripe description without copied model/outseam references
  - Sizing selector: **Custom measurements**
  - CUSTOM MEASUREMENTS panel:
    - Unit toggle: **IN (Inches)** / **CM (Centimetres)**
    - Inputs: **Waist circumference** and **Requested garment outseam** (blank by default)
    - Reference Note: *"Please specify your desired garment outseam and waist circumference. Customer values remain blank by default."*
  - Cart CTA state: **ADD TO CART** (working button; validates positive numbers before adding to bag)




