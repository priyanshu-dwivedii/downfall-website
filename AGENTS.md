<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DOWNFALL Typography System
Follow these strict typography rules across all storefront components:
- **Headings (Global Fallback)**: Oswald Bold (font-weight: 700, font-style: normal) for all headings unless explicitly scoped to Playfair Display below.
- **Scoped Playfair Display Elements**:
  - Hero DOWNFALL title: Bold Italic 700 (`var(--font-playfair)`).
  - Hero tagline: Bold Upright 700 (`var(--font-playfair)`).
  - Menu overlay HOME, PRODUCTS, ABOUT US and CLOSE: Bold Upright 700 (`var(--font-playfair)`).
  - Section headings “The Standout Edit”, “The Downfall Collection”, “Made for Every Version of You.”, “Don’t take our word for it”, and “Downfall on Instagram”: Bold Italic 700 (`var(--font-playfair)`).
  - Homepage collection-card headings BASICS, FORMAL, LUXURY: Bold Upright 700 (`var(--font-playfair)`).
- **All normal storefront text**: Inter Regular (font-weight: 400, font-style: normal). This applies to body copy, descriptions, supporting text, navigation links, button labels, pills, prices, badges, product metadata, form labels/inputs/placeholders, review text, cloud badge text, footer links, and disclaimers.
- **Admin Dashboard**: Retains the existing system unchanged.
- Animated text spans must inherit parent font, weight, and style without overriding.
