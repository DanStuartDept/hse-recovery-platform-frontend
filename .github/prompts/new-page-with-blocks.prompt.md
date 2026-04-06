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
4. Create Next.js route in `apps/hse-app-template/src/app/`

## Phase 3: Wire Up Blocks to Page Rendering

In the page's route component, add the new block types to the block renderer:

```typescript
function BlockRenderer({ block }: { block: CMSBlockType }) {
  switch (block.type) {
    // ... existing cases
    case "{BLOCK_KEY}":
      return <{BlockComponent} value={block.value} />;
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}
```

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, block-to-component mapping and page-to-template mapping will be handled in that package instead of inline in the route component -->
