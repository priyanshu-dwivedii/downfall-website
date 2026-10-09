<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DOWNFALL Typography System
Follow these strict typography rules across all components:
- **Headings**: Playfair Display Bold Italic (font-weight: 700, font-style: italic).
- **Subheadings and supporting subtitles**: Playfair Display Regular (font-weight: 400, font-style: normal).
- **All other text**: Playfair Display Bold (font-weight: 700, font-style: normal). This includes paragraphs, navigation, buttons, prices, labels, breadcrumbs, disclaimers, and form controls.
- **NEVER** use Montserrat, system-ui, Arial, Helvetica, or sans-serif. Always rely on the global Playfair Display setup in globals.css.
