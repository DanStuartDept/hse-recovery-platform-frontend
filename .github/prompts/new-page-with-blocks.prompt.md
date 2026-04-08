---
name: "New Page With Blocks"
description: "Add a new Wagtail page model that includes new StreamField block types"
mode: "agent"
---

# New Page Model With New Block Types

Combines the New StreamField Block and New Page Model workflows — creates new block types first, then a page model that uses them.

## Variables

- `PAGE_TYPE_NAME`: The page type name (e.g., `ServicePage`)
- `APP_LABEL`: The Wagtail app label (e.g., `services`)
- `CUSTOM_FIELDS`: Page-level fields beyond `CMSPageWithBlocks`
- `NEW_BLOCKS`: List of new block types to create, each with `BLOCK_KEY` and `BLOCK_FIELDS`

## Phase 1: Create Block Types

For each block in `NEW_BLOCKS`, follow the **New StreamField Block** workflow:

1. Add block key to `CMSBlockComponentsKeysSchema` in `packages/wagtail-cms-types/src/types/blocks/base.ts`
2. Create Zod schema in `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`
3. Add to `BlockValuesProps` union in `packages/wagtail-cms-types/src/types/blocks/index.ts`

## Phase 2: Create Page Model

Follow the **New Page Model** workflow:

1. Add page type to `CMSPageTypeSchema` in `packages/wagtail-cms-types/src/types/core/index.ts`
2. Create page schema in `packages/wagtail-cms-types/src/types/page-models/{app_label}.ts`
3. Add to `CMSPageProps` union in `packages/wagtail-cms-types/src/types/page-models/index.ts`
4. Create Next.js route in `apps/hse-multisite-template/src/app/`

## Phase 3: Wire Up Blocks to Page Rendering

Block-to-component and page-to-template mapping is handled by `@repo/wagtail-cms-mapping`. After completing Phase 1 and Phase 2, register the new block components and page layout in the mapping package using the factory pattern:

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const { renderBlocks, renderPage } = createCMSRenderer();

// In the route component — renders the full page with the registered layout
export default async function Page({ params }) {
  const page = await client.findPageByPath<CMSPageProps>(path);
  if ("error" in page) return notFound();
  return renderPage(page);
}
```

For each new block in `NEW_BLOCKS`:
1. Create the block component in `packages/wagtail-cms-mapping/src/blocks/block-{block_key}.tsx`
2. Add to `defaultBlockRegistry` in `packages/wagtail-cms-mapping/src/blocks/index.ts`
3. Export from the blocks index

For the new page type:
1. Create the layout in `packages/wagtail-cms-mapping/src/pages/{name}.tsx`
2. Add to `defaultPageRegistry` in `packages/wagtail-cms-mapping/src/pages/index.ts`
3. Add a type guard in `packages/wagtail-cms-mapping/src/types/index.ts`
