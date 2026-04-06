---
name: "Integrate Component"
description: "Wire up an existing @hseireland/hse-frontend-react component to a CMS block type"
mode: "agent"
---

# Integrate Design System Component

Wire up an existing `@hseireland/hse-frontend-react` component to a Wagtail CMS block type.

## Variables

- `COMPONENT_NAME`: The design system component to wire up (e.g., `Hero`, `Callout`, `Notification`)
- `BLOCK_KEY`: The CMS block key that maps to this component (e.g., `hero_image_banner`)

## Step 1: Explore the component

Use the **Storybook MCP** at `http://localhost:6006/mcp` to examine the component's props, variants, and usage examples.

Alternatively, read the component source:
`apps/hse-app-template/node_modules/@hseireland/hse-frontend-react/src/components/`

## Step 2: Check if block key exists

**File:** `packages/wagtail-cms-types/src/types/blocks/base.ts`

Check if `BLOCK_KEY` already exists in `CMSBlockComponentsKeysSchema`. If not, add it:

```typescript
export const CMSBlockComponentsKeysSchema = z.enum([
  // ... existing keys
  "{BLOCK_KEY}",
]);
```

## Step 3: Create or update Zod block schema

**File:** `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`

Create a Zod schema whose `value` fields match the CMS API response AND can be mapped to the component's props:

```typescript
import { z } from "zod";

export const Block{BlockName}ValuesPropsSchema = z.object({
  // Map CMS fields to match component props
  // Check Storybook for required vs optional props
});

export type Block{BlockName}ValuesProps = z.infer<
  typeof Block{BlockName}ValuesPropsSchema
>;
```

## Step 4: Add to BlockValuesProps union (if new)

**File:** `packages/wagtail-cms-types/src/types/blocks/index.ts`

If this is a new block type, add to the union:

```typescript
export type BlockValuesProps =
  | /* existing types */
  | import("./{block_key}").Block{BlockName}ValuesProps;
```

## Step 5: Register the mapping in the mapping package

**File:** `packages/wagtail-cms-mapping/src/blocks/block-{block_key}.tsx`

Create a wrapper component that maps the CMS block value to the design system component's props:

```typescript
import { {COMPONENT_NAME} } from "@hseireland/hse-frontend-react";
import type { Block{BlockName}ValuesProps } from "@repo/wagtail-cms-types/blocks";

export function Block{BlockName}({ value }: { value: Block{BlockName}ValuesProps }) {
  return <{COMPONENT_NAME} {...mapValueToProps(value)} />;
}
```

**File:** `packages/wagtail-cms-mapping/src/blocks/index.ts`

Add `{BLOCK_KEY}: Block{BlockName}` to `defaultBlockRegistry`.
