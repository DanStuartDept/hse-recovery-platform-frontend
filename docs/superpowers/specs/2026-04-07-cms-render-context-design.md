# CMS Render Context Design

## Overview

Enhance `@repo/wagtail-cms-mapping` to thread a rich context object through every block and page component. The context provides access to the full page data, block position metadata, and the CMS API client — all via props, no React Context.

**Motivation:** Block components currently receive only their own `value` and an optional `renderBlocks`. They can't access the broader page they belong to, know their position in the block array, or make secondary API calls. Page layouts can't fetch supplementary data from the CMS.

**Constraint:** The mapping package must remain Server Component-compatible. All data flows via props from the factory — no `createContext`, no `useContext`, no `"use client"` requirement imposed on consumers.

## Architecture

### Data flow

```
App creates CMSClient
  → App calls createCMSRenderer({ apiClient })
    → App calls renderPage(page)
      → Factory builds context { page, apiClient }
        → Factory passes context to page layout as prop
        → Factory's renderBlocks loop adds position metadata per-block
          → Each block receives { ...block, context, renderBlocks }
```

### Key decisions

- **Props, not React Context** — every component receives `context` as a regular typed prop. No hooks needed to consume it, fully compatible with Server Components.
- **`CMSClient` required** — `createCMSRenderer()` with zero args no longer works. The app must pass an API client instance.
- **`renderBlocks` required** — currently optional on `BlockComponentProps`. The factory always passes it, so making it required removes null checks in components like `BlockDetails`.
- **Page data on context** — every block can access the full `CMSPageProps` of the page it belongs to.
- **Position metadata computed by factory** — the `renderBlocks` loop computes `index`, `isFirst`, `isLast`, `previous`, `next` per-block automatically.
- **No framework-specific data on context** — `searchParams`, `cookies`, `headers` are not on the context. Client components use Next.js hooks (`useSearchParams`, `useRouter`, `useParams`, `usePathname`) directly when needed. `next` is already a dependency.
- **No React provider / NextDataProvider** — not needed. Next.js hooks cover client-side runtime data. The mapping package stays CMS-domain-focused.

## Type definitions

### New types

```typescript
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import type { CMSClient } from "@repo/wagtail-api-client";

type BlockPosition = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  previous: CMSBlockType | null;
  next: CMSBlockType | null;
};

type CMSRenderContext = {
  page: CMSPageProps;
  apiClient: CMSClient;
  position: BlockPosition;
};
```

### Updated `BlockComponentProps`

```typescript
type BlockComponentProps<TValue = unknown> = {
  id: string;
  type: CMSBlockComponentsKeys;
  value: TValue;
  settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
  context: CMSRenderContext;
  renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};
```

Changes from current:
- `context` added (required)
- `renderBlocks` changed from optional to required

### Updated `PageLayoutProps`

```typescript
type PageLayoutProps = {
  page: CMSPageProps;
  context: Omit<CMSRenderContext, "position">;
  renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};
```

Changes from current:
- `context` added (required, without `position`)
- `page` remains as a direct prop for ergonomics (`page.title` reads better than `context.page.title` in page layouts). It is intentionally duplicated on context for consistency with blocks.

### Updated `CMSRendererOptions`

```typescript
type CMSRendererOptions = {
  apiClient: CMSClient;
  blocks?: BlockRegistry;
  pages?: PageRegistry;
  fallbackBlock?: ComponentType<BlockComponentProps>;
  fallbackPage?: ComponentType<PageLayoutProps>;
};
```

Changes from current:
- `apiClient` added (required)
- All other fields unchanged

### `CMSRenderer` return type

No changes — still returns `{ renderBlock, renderBlocks, renderPage }`.

## Factory implementation

### `createCMSRenderer`

```typescript
export function createCMSRenderer(options: CMSRendererOptions): CMSRenderer {
  const { apiClient } = options;
  const blockRegistry = { ...defaultBlockRegistry, ...options.blocks };
  const pageRegistry = { ...defaultPageRegistry, ...options.pages };
  const FallbackBlock = options.fallbackBlock ?? DefaultFallbackBlock;
  const FallbackPage = options.fallbackPage ?? DefaultFallbackPage;

  let currentPage: CMSPageProps;

  function renderBlock(block: CMSBlockType): React.ReactNode {
    // Single-block render without position context (no array to reference)
    const Component = blockRegistry[block.type] ?? FallbackBlock;
    return (
      <Component
        key={block.id}
        {...block}
        context={{
          page: currentPage,
          apiClient,
          position: { index: 0, isFirst: true, isLast: true, previous: null, next: null },
        }}
        renderBlocks={renderBlocks}
      />
    );
  }

  function renderBlocks(blocks: CMSBlockType[] = []): React.ReactNode[] {
    if (!blocks) return [];
    return blocks.map((block, index) => {
      const Component = blockRegistry[block.type] ?? FallbackBlock;
      return (
        <Component
          key={block.id}
          {...block}
          context={{
            page: currentPage,
            apiClient,
            position: {
              index,
              isFirst: index === 0,
              isLast: index === blocks.length - 1,
              previous: blocks[index - 1] ?? null,
              next: blocks[index + 1] ?? null,
            },
          }}
          renderBlocks={renderBlocks}
        />
      );
    });
  }

  function renderPage(page: CMSPageProps): React.ReactNode {
    currentPage = page;
    const Layout = pageRegistry[page.meta.type] ?? FallbackPage;
    return (
      <Layout
        key={page.id}
        page={page}
        context={{ page, apiClient }}
        renderBlocks={renderBlocks}
      />
    );
  }

  return { renderBlock, renderBlocks, renderPage };
}
```

Key details:
- `currentPage` is set by `renderPage` and captured by `renderBlocks` via closure. Calling `renderBlock` or `renderBlocks` before `renderPage` will throw — this is intentional, as blocks always belong to a page. The entry point is always `renderPage`.
- `renderBlock` (single block) gives a default position of `{ index: 0, isFirst: true, isLast: true, previous: null, next: null }` since there's no array context
- `renderBlocks` computes real position metadata per iteration
- Page layouts receive `context` without `position`

## Component changes

### Block components (14 files)

Every block component signature gains `context` and `renderBlocks` as destructured props. Most blocks don't use `context` yet — this is additive.

```tsx
// Before
export function BlockText({ value }: BlockComponentProps<TextValue>) {

// After
export function BlockText({ value, context, renderBlocks }: BlockComponentProps<TextValue>) {
```

Components that benefit immediately:
- `BlockDetails` — drop `renderBlocks ?` null check (now required)
- `BlockDetailsGroup` — same
- `BlockContentBlock` — same
- `BlockFallback` — could include `context.page.meta.type` in dev output

### Page layout components (5 files)

Every page layout gains `context` in its signature:

```tsx
// Before
export function ContentPage({ page, renderBlocks }: PageLayoutProps) {

// After
export function ContentPage({ page, renderBlocks, context }: PageLayoutProps) {
```

No behaviour changes. Context is available for future use (e.g., `context.apiClient` for fetching related pages).

### Fallback components

`DefaultFallbackBlock` and `DefaultFallbackPage` in `src/index.tsx` also need the updated signatures. The fallback block could show `context.page.meta.type` in its dev output.

## New dependency

```json
// packages/wagtail-cms-mapping/package.json
{
  "dependencies": {
    "@repo/wagtail-api-client": "workspace:*"
  }
}
```

Type-only import — `import type { CMSClient } from "@repo/wagtail-api-client"`. The mapping package doesn't instantiate the client; it just receives an instance from the app.

## Cookie access (deferred)

For client components that need cookie access, `js-cookie` is the recommended library. This lives in the **app's dependencies**, not the mapping package. Add to `pnpm-workspace.yaml` catalog when a component needs it. No action in this spec.

## Client-side Next.js hooks

Block components in the mapping package can use Next.js hooks (`useSearchParams`, `useRouter`, `useParams`, `usePathname`) in `"use client"` components when needed. `next` is already a dependency. Default blocks won't need these — they render CMS data. But the door is open for specific blocks that require client-side routing or URL data.

## Testing strategy

### Factory tests

Update existing factory tests to pass a mock API client:

```typescript
const mockApiClient = {
  fetchContent: vi.fn(),
} as unknown as CMSClient;

const { renderPage } = createCMSRenderer({ apiClient: mockApiClient });
```

### New tests

- `context.position` is correctly computed: `isFirst`, `isLast`, `previous`, `next` for a block array
- `context.page` matches the page passed to `renderPage`
- `context.apiClient` is the same instance passed to factory
- Single `renderBlock` gets default position (`index: 0, isFirst: true, isLast: true`)
- `renderBlocks([])` still returns empty array
- Page layout receives context without `position`

### Existing tests

- All existing factory tests updated to pass `apiClient`
- Block component tests updated to pass `context` prop
- Registry completeness tests unchanged
- Type guard tests unchanged

## Out of scope

- No React Context or providers
- No `searchParams`, `cookies`, `headers` on the render context
- No cookie library in the mapping package
- No behaviour changes to existing block/page components
- No changes to the factory's public return type signature
- No changes to `@repo/wagtail-cms-types` or `@repo/wagtail-api-client`
