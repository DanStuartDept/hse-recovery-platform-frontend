---
name: "New StreamField Block"
description: "Add a new Wagtail StreamField block type: Zod schema and enum registration"
mode: "agent"
---

# New StreamField Block

Add a new Wagtail StreamField block type to the CMS types package.

## Variables

- `BLOCK_KEY`: The block type key as it appears in the Wagtail API (e.g., `info_card`)
- `BLOCK_FIELDS`: The fields in the block's `value` object

## Step 1: Add to CMSBlockComponentsKeys enum

**File:** `packages/wagtail-cms-types/src/types/blocks/base.ts`

Add the new block key to `CMSBlockComponentsKeysSchema`:

```typescript
export const CMSBlockComponentsKeysSchema = z.enum([
  // ... existing keys
  "{BLOCK_KEY}",
]);
```

## Step 2: Create Zod schema for block value

**File:** `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`

```typescript
import { z } from "zod";
// Import field types as needed from "../fields"

export const Block{BlockName}ValuesPropsSchema = z.object({
  // Define the block's value fields based on BLOCK_FIELDS
});

export type Block{BlockName}ValuesProps = z.infer<
  typeof Block{BlockName}ValuesPropsSchema
>;
```

## Step 3: Add to BlockValuesProps union

**File:** `packages/wagtail-cms-types/src/types/blocks/index.ts`

Import the new type and add to the union:

```typescript
export type BlockValuesProps =
  | /* existing types */
  | import("./{block_key}").Block{BlockName}ValuesProps;
```

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, add a step here to map this block key to an @hseireland/hse-frontend-react component -->
