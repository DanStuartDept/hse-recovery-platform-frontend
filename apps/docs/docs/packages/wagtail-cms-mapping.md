---
sidebar_position: 4
---

# `@repo/wagtail-cms-mapping`

Maps Wagtail CMS data to React components. Provides the `createCMSRenderer` factory, a default block registry, a default page layout registry, and `generatePageMetadata` for Next.js SEO metadata.

**npm name:** `@repo/wagtail-cms-mapping`  
**Path:** `packages/wagtail-cms-mapping`  
**Type:** Source-only (no build step — `exports` map points directly at `.ts`/`.tsx` files)

---

## `createCMSRenderer`

The primary export. Call once per request to get `renderBlock`, `renderBlocks`, and `renderPage`.

```ts
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const { renderPage, renderBlocks } = createCMSRenderer({
  apiClient: client,
});
```

> **Important:** Create a new renderer per request. Do not cache a renderer instance at module scope — the internal `currentPage` state is set by `renderPage` and must not be shared across concurrent requests.

### `CMSRendererOptions`

| Option | Type | Required | Description |
|---|---|---|---|
| `apiClient` | `CMSClient` | Yes | CMS API client instance. Passed through to every block and page component via context. |
| `blocks` | `BlockRegistry` | No | Block component overrides merged on top of the default registry. |
| `pages` | `PageRegistry` | No | Page layout overrides merged on top of the default registry. |
| `fallbackBlock` | `ComponentType<BlockComponentProps>` | No | Component rendered for unmapped block types. Defaults to `BlockFallback`. |
| `fallbackPage` | `ComponentType<PageLayoutProps>` | No | Component rendered for unmapped page types. Defaults to a minimal title display. |
| `debug` | `boolean` | No | When `true`, renders a collapsible panel with raw CMS page data below the page. Useful for development. |

### `CMSRenderer`

The object returned by `createCMSRenderer`:

| Method | Signature | Description |
|---|---|---|
| `renderPage` | `(page: CMSPageProps) => ReactNode` | Renders a full page. Sets the internal page context, wraps the layout in `<main>`, and prepends breadcrumbs if present. **Call this first.** |
| `renderBlocks` | `(blocks: CMSBlockType[]) => ReactNode[]` | Renders an array of blocks with position metadata. Requires `renderPage` to have been called first. |
| `renderBlock` | `(block: CMSBlockType) => ReactNode` | Renders a single block. Requires `renderPage` to have been called first. |

---

## Block registry

The default block registry maps every `CMSBlockComponentsKeys` value to a React component. Multiple block type keys can map to the same component.

| Block type key(s) | Component | Description |
|---|---|---|
| `text`, `rich_text_block`, `richtext` | `BlockText` | Rich text / HTML content. |
| `image` | `BlockImage` | CMS-managed image with responsive variants. |
| `inset_text` | `BlockInsetText` | Indented/highlighted text block. |
| `quote` | `BlockQuote` | Pull-quote block. |
| `top_tasks`, `top_task` | `BlockPromo` | Promoted links / top tasks. |
| `links_list_group_v2` | `BlockLinksList` | Group of navigation links. |
| `action_link` | `BlockActionLink` | Single prominent call-to-action link. |
| `expander`, `details` | `BlockDetails` | Expandable/collapsible detail section. |
| `expander_group` | `BlockDetailsGroup` | Group of expandable sections. |
| `button_list` | `BlockButton` | List of button links. |
| `content_block_chooser` | `BlockContentBlock` | Embeds a reusable content snippet from the CMS. |
| `brightcove_video` | `BlockBrightcove` | Brightcove video player embed. |
| `related_information` | `BlockRelatedInfo` | Related information panel. |
| `section` | `BlockSection` | Section wrapper for grouped content. |
| `teaser_links` | `BlockTeaserLinks` | Teaser card / link group. |

Any block type not in the registry renders `BlockFallback` (or your custom `fallbackBlock`).

---

## Page registry

The default page registry maps Wagtail page type strings (`app_label.ModelName` format) to layout components.

| Page type | Component | Description |
|---|---|---|
| `hsebase.ContentPage` | `ContentPage` | Standard content page with header blocks, body blocks, and optional side navigation. |
| `hsebase.LandingPage` | `LandingPage` | Landing page with `top_content`, `content`, and `bottom_content` block areas. |
| `hsebase.CuratedHubPage` | `CuratedHubPage` | Hub page with `content` and `bottom_content` block areas. |
| `hsebase.OrganisationListingPage` | `OrganisationListingPage` | Organisation listing with `organisation_links` block area. |
| `hsebase.OrganisationLandingPage` | `OrganisationLandingPage` | Organisation landing page with `content` and `bottom_content` block areas. |

Any page type not in the registry renders the `fallbackPage` component.

---

## Override pattern

Pass `blocks` and/or `pages` to `createCMSRenderer` to merge your overrides on top of the defaults. Your entries take precedence — any key not in your overrides falls through to the default registry.

```ts
import { createCMSRenderer, BlockText } from "@repo/wagtail-cms-mapping";
import type { BlockComponentProps } from "@repo/wagtail-cms-mapping";

// Override a single block type
function MyCustomText(props: BlockComponentProps<{ text: string }>) {
  return <div className="custom-text">{props.value.text}</div>;
}

const { renderPage } = createCMSRenderer({
  apiClient: client,
  blocks: {
    text: MyCustomText,       // replaces BlockText for "text" blocks
    richtext: MyCustomText,   // also replaces for "richtext" alias
  },
});
```

To add a new page layout:

```ts
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import type { PageLayoutProps } from "@repo/wagtail-cms-mapping";

function MyNewsPage({ page, renderBlocks }: PageLayoutProps) {
  return (
    <article>
      <h1>{page.title}</h1>
      {renderBlocks(page.body)}
    </article>
  );
}

const { renderPage } = createCMSRenderer({
  apiClient: client,
  pages: {
    "hsebase.NewsPage": MyNewsPage,
  },
});
```

---

## Block component props

Every block component receives `BlockComponentProps`:

```ts
type BlockComponentProps<TValue = unknown> = {
  id: string;                  // Unique block ID from the CMS
  type: CMSBlockComponentsKeys;
  value: TValue;               // Block content — shape varies by type
  settings?: {
    fluid?: boolean;
    fullWidth?: boolean;
    inRow?: boolean;
  };
  context: CMSRenderContext;
  renderBlocks: (blocks: CMSBlockType[]) => ReactNode[];
};
```

`CMSRenderContext` provides:

```ts
type CMSRenderContext = {
  page: CMSPageProps;      // The full page being rendered
  apiClient: CMSClient;    // For secondary data fetching
  position: BlockPosition; // Index, isFirst, isLast, previous, next
};
```

---

## Page layout props

Every page layout component receives `PageLayoutProps`:

```ts
type PageLayoutProps = {
  page: CMSPageProps;
  context: Omit<CMSRenderContext, "position">; // No position — not in a block array
  renderBlocks: (blocks: CMSBlockType[]) => ReactNode[];
};
```

---

## `generatePageMetadata`

Translates CMS page fields to a Next.js `Metadata` object. Use inside `generateMetadata` in a catch-all route.

```ts
import { generatePageMetadata } from "@repo/wagtail-cms-mapping";
import type { PageMetadataOptions } from "@repo/wagtail-cms-mapping";
```

### Signature

```ts
function generatePageMetadata(
  page: CMSPageProps,
  options: PageMetadataOptions,
): Metadata
```

### `PageMetadataOptions`

| Option | Type | Required | Description |
|---|---|---|---|
| `siteUrl` | `string` | Yes | Public site URL for canonical links. No trailing slash. |
| `path` | `string` | Yes | Request path including leading slash, e.g. `"/about/"`. |
| `defaultDescription` | `string` | No | Fallback description when the CMS page has no `search_description`. |

### What it returns

- `title`: `page.meta.seo_title` if set, otherwise `page.title`.
- `description`: `page.meta.search_description` if set, otherwise `defaultDescription`.
- `alternates.canonical`: `${siteUrl}${path}`.

These are per-page overrides — Next.js merges them with the layout-level defaults (title template, `metadataBase`).

### Example

```ts
// app/[locale]/[[...slug]]/page.tsx
import { generatePageMetadata } from "@repo/wagtail-cms-mapping";
import { config } from "@repo/app-config";

export async function generateMetadata({ params }) {
  const path = slugToPath(params.slug);
  const page = await client.findPageByPath(path);

  if (isNotFound(page)) return {};

  return generatePageMetadata(page, {
    siteUrl: config.siteUrl,
    path,
    defaultDescription: dictionary.meta.defaultDescription,
  });
}
```

---

## Page type narrowing

The package exports type guard functions for narrowing `CMSPageProps` to a specific page type:

```ts
import {
  isContentPage,
  isLandingPage,
  isCuratedHubPage,
  isOrganisationListingPage,
  isOrganisationLandingPage,
} from "@repo/wagtail-cms-mapping";
```

Each function checks `page.meta.type` and narrows the type accordingly. Use these in page layout components or anywhere a specific page shape is expected.

---

## Additional components

The package also exports standalone React components that `renderPage` uses internally:

- **`Breadcrumb`** — Renders the `page.breadcrumb` array using HSE design system components. Automatically rendered by `renderPage` when breadcrumbs are present.
- **`CmsDebugPanel`** — Collapsible panel that displays raw page JSON. Rendered by `renderPage` when `debug: true`.
- **`PageTitle`** — Utility component for rendering page title with appropriate heading level.

---

## Full usage example

```tsx
// app/[locale]/[[...slug]]/page.tsx (Server Component)
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import { CMSClient, isNotFound, slugToPath } from "@repo/wagtail-api-client";
import { config } from "@repo/app-config";
import { notFound } from "next/navigation";

const client = new CMSClient({
  baseURL: config.cms.baseURL,
  apiPath: config.cms.apiPath,
});

export default async function Page({ params }) {
  const path = slugToPath(params.slug);
  const page = await client.findPageByPath(path);

  if (isNotFound(page)) {
    notFound();
  }

  // Create a new renderer per request
  const { renderPage } = createCMSRenderer({
    apiClient: client,
    debug: config.isLocalhost,
  });

  return renderPage(page);
}
```
