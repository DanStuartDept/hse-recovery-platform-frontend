---
name: "New Page Model"
description: "Add a new Wagtail page type: Zod schema in types, Next.js route in the app"
mode: "agent"
---

# New Page Model

Add a new Wagtail CMS page type to the monorepo.

## Variables

- `PAGE_TYPE_NAME`: The page type name as it appears in Wagtail (e.g., `ServicePage`)
- `APP_LABEL`: The Wagtail app label (e.g., `services`)
- `CUSTOM_FIELDS`: Any fields beyond the base `CMSPageWithBlocks` (e.g., `lead_text`, `featured_image`)

## Step 1: Add to CMSPageType enum

**File:** `packages/wagtail-cms-types/src/types/core/index.ts`

Add the new page type string to `CMSPageTypeSchema`:

```typescript
export const CMSPageTypeSchema = z.enum([
  // ... existing types
  "{APP_LABEL}.{PAGE_TYPE_NAME}",
]);
```

## Step 2: Create Zod schema

**File:** `packages/wagtail-cms-types/src/types/page-models/{app_label}.ts`

Create or update the file for this app label:

```typescript
import { z } from "zod";
import { CMSPageWithBlocksSchema } from "./index";
// Import field types as needed from "../fields"

export const CMS{AppLabel}{PageTypeName}PropsSchema = CMSPageWithBlocksSchema.extend({
  // Add custom fields here based on CUSTOM_FIELDS
});

export type CMS{AppLabel}{PageTypeName}Props = z.infer<
  typeof CMS{AppLabel}{PageTypeName}PropsSchema
>;
```

## Step 3: Add to CMSPageProps union

**File:** `packages/wagtail-cms-types/src/types/page-models/index.ts`

Import the new type and add to the union:

```typescript
export type CMSPageProps =
  | /* existing types */
  | import("./{app_label}").CMS{AppLabel}{PageTypeName}Props;
```

## Step 4: Create Next.js route

**File:** `apps/hse-app-template/src/app/{route-path}/page.tsx`

Create a Server Component that fetches and renders the page:

```typescript
import { CMSClient } from "@repo/wagtail-api-client";
import type { CMS{AppLabel}{PageTypeName}Props } from "@repo/wagtail-cms-types/page-models";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL!,
  apiPath: process.env.CMS_API_PATH!,
});

export default async function {PageTypeName}Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await client.findPageByPath<CMS{AppLabel}{PageTypeName}Props>(`/{route-path}/${slug}`);

  if ("error" in page) return notFound();

  return (
    // Render page content using design system components
    // Render page.body blocks using a BlockRenderer
  );
}
```

## Step 5: Create page layout in the mapping package

**File:** `packages/wagtail-cms-mapping/src/pages/{name}.tsx`

Create a layout component that accepts the typed page props and renders the page structure using design system components. Use `createCMSRenderer()` internally to render `page.body` blocks.

## Step 6: Register in defaultPageRegistry

**File:** `packages/wagtail-cms-mapping/src/pages/index.ts`

Add the new page type and layout to `defaultPageRegistry`:

```typescript
import { {PageTypeName}Layout } from "./{name}";

export const defaultPageRegistry: CMSPageRegistry = {
  // ... existing entries
  "{APP_LABEL}.{PAGE_TYPE_NAME}": {PageTypeName}Layout,
};
```

## Step 7: Add type guard

**File:** `packages/wagtail-cms-mapping/src/types/index.ts`

Add a type guard so the mapping layer can narrow the page union:

```typescript
export function is{PageTypeName}(page: CMSPageProps): page is CMS{AppLabel}{PageTypeName}Props {
  return page.meta.type === "{APP_LABEL}.{PAGE_TYPE_NAME}";
}
```
