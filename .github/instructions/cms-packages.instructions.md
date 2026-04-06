---
description: "Conventions for Wagtail CMS packages — Zod schemas, sub-path exports, bunchee builds, CMSClient API."
applyTo: "packages/wagtail-*/**"
---

# CMS Package Conventions

## `@repo/wagtail-cms-types` (source-only)

- **No build step** — `exports` map points directly at `.ts` files.
- Sub-path exports: `/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
- All types use **Zod schemas** for runtime validation. Define schema first, infer type with `z.infer<>`.
- Block types use discriminated union on `type` field.
- `CMSBlockComponentsKeys` enum lists all valid block types.
- Page models extend `CMSPageWithBlocks` which provides `header: Block[]` and `body: Block[]`.

### Adding a new type

1. Create Zod schema in the appropriate sub-path directory.
2. Export schema and inferred type.
3. Add to the relevant union type (e.g., `CMSPageProps`, `BlockValuesProps`).
4. Update `CMSBlockComponentsKeys` or `CMSPageType` enum if adding a new block/page type.

## `@repo/wagtail-api-client` (built with bunchee)

- Dual output: ESM (`dist/es/`) + CJS (`dist/cjs/`).
- TypeScript imports **must use `.js` extensions**.
- `CMSClient` takes `ClientOptions: { baseURL, mediaBaseURL?, apiPath, init? }`.
- All fetches include ISR caching (`next: { revalidate: 360 }` default).

### CMSClient Methods

| Method | Returns |
|---|---|
| `fetchPage(idOrSlug, queries?, init?)` | Single page |
| `fetchPages(queries?, init?)` | Page listing |
| `findPageByPath<T>(path, init?)` | Page by URL path |
| `fetchPagePreview<T>(contentType, token, id, init?)` | Draft preview |
| `fetchImage(id, queries?, init?)` | Single image |
| `fetchDocument(id, queries?, init?)` | Single document |
| `getMediaSrc(media)` | Full media URL string |
