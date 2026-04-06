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

## `@repo/wagtail-cms-mapping`

Maps CMS page types to layout templates and block types to React components. Depends on both `@repo/wagtail-cms-types` and `@repo/wagtail-api-client`.

- Sub-path exports: `.` (main), `./blocks`, `./pages`, `./types`.
- Entry point exports `createCMSRenderer(overrides?)` which returns `{ renderBlocks, renderPage }`.
- `defaultBlockRegistry` maps all `CMSBlockComponentsKeys` values to `@hseireland/hse-frontend-react` components.
- `defaultPageRegistry` maps all `CMSPageType` values to layout components.

### Adding a new block type

1. Add the key to `CMSBlockComponentsKeysSchema` in `packages/wagtail-cms-types/src/types/blocks/base.ts`.
2. Create the block component in `packages/wagtail-cms-mapping/src/blocks/block-{name}.tsx`.
3. Register it in `defaultBlockRegistry` in `packages/wagtail-cms-mapping/src/blocks/index.ts`.
4. Export the component from the blocks index file.

### Adding a new page type

1. Add the key to `CMSPageTypeSchema` in `packages/wagtail-cms-types/src/types/core/index.ts`.
2. Create the Zod schema in `packages/wagtail-cms-types/src/types/page-models/hsebase.ts`.
3. Create the layout component in `packages/wagtail-cms-mapping/src/pages/{name}.tsx`.
4. Register it in `defaultPageRegistry` in `packages/wagtail-cms-mapping/src/pages/index.ts`.
5. Add a type guard in `packages/wagtail-cms-mapping/src/types/index.ts`.

### Block and page type enums

Current block types (`CMSBlockComponentsKeys`, 18 values):
`text`, `rich_text_block`, `richtext`, `image`, `inset_text`, `quote`, `top_tasks`, `top_task`, `links_list_group_v2`, `action_link`, `expander`, `expander_group`, `details`, `button_list`, `content_block_chooser`, `brightcove_video`, `related_information`, `teaser_links`

Current page types (`CMSPageType`, 5 values):
`hsebase.ContentPage`, `hsebase.LandingPage`, `hsebase.CuratedHubPage`, `hsebase.OrganisationListingPage`, `hsebase.OrganisationLandingPage`

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
