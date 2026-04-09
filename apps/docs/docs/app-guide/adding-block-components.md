---
sidebar_position: 5
---

# Adding Block Components

Block components render individual CMS content blocks — things like rich text, images, quotes, expandable details, and video embeds. This guide walks through adding a new block type end-to-end.

## How blocks work

The CMS sends each page with a `body` array (and sometimes `top_content`, `bottom_content`, etc.). Each item in the array looks like:

```json
{ "id": "abc123", "type": "quote", "value": { "title": "...", "body": "...", "author": "..." } }
```

`createCMSRenderer` looks up the `type` key in the block registry and renders the matching component. If no component is registered for a type, `BlockFallback` is used — in the `local` environment it renders a visible debug message; elsewhere it renders nothing.

## Existing block pattern

Every block component follows the same pattern. Here is `BlockQuote` as an example:

**Type definition** — `packages/wagtail-cms-types/src/types/blocks/`
```ts
// The block value shape is a plain TypeScript type — no separate Zod schema
// is required unless you need runtime validation of the value itself.
type BlockQuoteValue = { title: string; body: string; author: string };
```

**Component** — `packages/wagtail-cms-mapping/src/blocks/block-quote.tsx`
```tsx
export function BlockQuote({ value }: BlockComponentProps<BlockQuoteValue>) {
  return (
    <DSBlockQuote>
      {value.title && <BlockQuoteHeading>{value.title}</BlockQuoteHeading>}
      {value.body && <BlockQuoteText>{value.body}</BlockQuoteText>}
      {value.author && <BlockQuoteCaption>{value.author}</BlockQuoteCaption>}
    </DSBlockQuote>
  );
}
```

**Registry entry** — `packages/wagtail-cms-mapping/src/blocks/index.ts`
```ts
export const defaultBlockRegistry: BlockRegistry = {
  // ...
  quote: BlockQuote,
};
```

## Step-by-step guide

### 1. Add the block type key to `CMSBlockComponentsKeysSchema`

Open `packages/wagtail-cms-types/src/types/blocks/base.ts` and add the new type string to the enum:

```ts
export const CMSBlockComponentsKeysSchema = z.enum([
  // ... existing types ...
  "my_new_block",
]);
```

This is the string value that Wagtail sends in the `type` field of each block. It must match exactly.

### 2. Define the value schema (optional but recommended)

If the block value has a known shape, create a Zod schema in `packages/wagtail-cms-types/src/types/blocks/`. You can add it to an existing file or create a new one.

```ts
// packages/wagtail-cms-types/src/types/blocks/my-new-block.ts
import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "./base";

export const MyNewBlockValuesSchema = z.object({
  heading: z.string(),
  body: z.string(),
  link_url: z.string().optional(),
});

export type MyNewBlockValues = z.infer<typeof MyNewBlockValuesSchema>;

export const MyNewBlockPropsSchema = BaseCMSBlockTypeSchema.extend({
  type: z.literal("my_new_block"),
  value: MyNewBlockValuesSchema,
});
```

If the value shape is simple, a plain TypeScript type in the component file is sufficient — see `BlockText` and `BlockQuote` for examples.

Export the new schema from `packages/wagtail-cms-types/src/types/blocks/index.ts` if other packages need to import it.

### 3. Create the React component

Create a new file in `packages/wagtail-cms-mapping/src/blocks/`. Use kebab-case for the filename.

```tsx
// packages/wagtail-cms-mapping/src/blocks/block-my-new-block.tsx
import type { MyNewBlockValues } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

export function BlockMyNewBlock({ value }: BlockComponentProps<MyNewBlockValues>) {
  return (
    <div className="hse-my-new-block">
      <h2>{value.heading}</h2>
      <p>{value.body}</p>
      {value.link_url && <a href={value.link_url}>Read more</a>}
    </div>
  );
}
```

Key points:
- Use `BlockComponentProps<YourValueType>` for the props type — it provides `id`, `type`, `value`, `settings`, `context`, and `renderBlocks`.
- Access `context.page` for page-level data, `context.apiClient` for secondary fetches, and `context.position` for positional metadata (first, last, index, previous, next block).
- Call `renderBlocks(childBlocks)` for blocks with nested children (see `BlockSection` for an example).
- Use HSE design system components from `@hseireland/hse-frontend-react` where available.

### 4. Register the component

Open `packages/wagtail-cms-mapping/src/blocks/index.ts` and add two things:

```ts
import { BlockMyNewBlock } from "./block-my-new-block";

export const defaultBlockRegistry: BlockRegistry = {
  // ... existing entries ...
  my_new_block: BlockMyNewBlock,
};

export {
  // ... existing exports ...
  BlockMyNewBlock,
};
```

### 5. Write tests

Add tests in `packages/wagtail-cms-mapping/src/blocks/blocks.test.tsx` or create a dedicated test file alongside your component.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlockMyNewBlock } from "./block-my-new-block";
import { mockBlockContext } from "../vitest.setup";

describe("BlockMyNewBlock", () => {
  it("renders the heading", () => {
    render(
      <BlockMyNewBlock
        id="1"
        type="my_new_block"
        value={{ heading: "Test heading", body: "Test body" }}
        context={mockBlockContext}
        renderBlocks={() => []}
      />,
    );
    expect(screen.getByText("Test heading")).toBeInTheDocument();
  });
});
```

Run the tests from the package directory:

```bash
cd packages/wagtail-cms-mapping && pnpm vitest run
```

## Multiple type aliases

Some block types share a component. The registry supports this by assigning the same component to multiple keys:

```ts
export const defaultBlockRegistry: BlockRegistry = {
  text: BlockText,
  rich_text_block: BlockText,
  richtext: BlockText,
};
```

Each key must still be listed in `CMSBlockComponentsKeysSchema`.
