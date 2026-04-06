---
name: CMS Content Fetching
description: Teaches the full CMS data flow from Wagtail API through typed client to React rendering
---

# CMS Content Fetching

This skill teaches how content flows from the Wagtail CMS backend to rendered React components in this monorepo.

## Data Flow Overview

```
Wagtail CMS Backend (REST API v2)
        ↓
@repo/wagtail-api-client (CMSClient — fetch + ISR cache)
        ↓
@repo/wagtail-cms-types (Zod validation + TypeScript types)
        ↓
@repo/wagtail-cms-mapping (block → component, page → layout)
        ↓
Next.js App (Server Components → React rendering)
```

## Layer 1: Types (`@repo/wagtail-cms-types`)

Source-only package — no build step. Exports raw `.ts` files via sub-path exports:

| Import path | Contents |
|---|---|
| `@repo/wagtail-cms-types/core` | `ClientOptions`, `CMSPageType`, `CMSQueries`, `CMSContent`, `CMSPageContent`, `CMSContents` |
| `@repo/wagtail-cms-types/blocks` | `CMSBlockComponentsKeys` (18 block types), `BaseCMSBlockType`, `BlockValuesProps` |
| `@repo/wagtail-cms-types/fields` | `FieldTypeCta`, `FieldTypeImage`, `FieldTypeVideo`, `FieldTypeHeadingLevel`, `NavItem` |
| `@repo/wagtail-cms-types/page-models` | `CMSPageWithBlocks`, `CMSPageProps` (union of all 5 page types) |
| `@repo/wagtail-cms-types/settings` | `CMSSiteSettingsItem` (header, footer, social, alerts, search, SEO) |
| `@repo/wagtail-cms-types/snippets` | `SnippetContentBlock` (reusable content blocks) |

### Page Types

Five page models defined in `CMSPageType` (under the `hsebase` app label):
- `hsebase.ContentPage`, `hsebase.LandingPage`, `hsebase.CuratedHubPage`
- `hsebase.OrganisationListingPage`, `hsebase.OrganisationLandingPage`

All extend `CMSPageWithBlocks` which provides `header: Block[]` and `body: Block[]`.

### Block Types

18 block types in `CMSBlockComponentsKeys`:
`text`, `rich_text_block`, `richtext`, `image`, `inset_text`, `quote`, `top_tasks`, `top_task`, `links_list_group_v2`, `action_link`, `expander`, `expander_group`, `details`, `button_list`, `content_block_chooser`, `brightcove_video`, `related_information`, `teaser_links`

Each block has: `{ id, type, value, settings?, client? }` where `type` is the discriminant.

### Zod Schema Pattern

All types use Zod for runtime validation and TypeScript inference:

```typescript
import { z } from "zod";

// Define schema
export const MyPageSchema = CMSPageWithBlocksSchema.extend({
  custom_field: z.string().optional(),
});

// Infer type
export type MyPage = z.infer<typeof MyPageSchema>;
```

## Layer 2: Client (`@repo/wagtail-api-client`)

`CMSClient` class — instantiate with connection options, call methods to fetch content.

### Configuration

```typescript
import { CMSClient } from "@repo/wagtail-api-client";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL,    // e.g. "https://cms.example.com"
  apiPath: "/api/cms/v2",                // Wagtail API path
  mediaBaseURL: process.env.MEDIA_URL,   // Optional separate media domain
});
```

### Key Methods

| Method | Purpose |
|---|---|
| `fetchPage(idOrSlug, queries?, init?)` | Fetch single page by ID or slug |
| `fetchPages(queries?, init?)` | Fetch page listing with filters |
| `findPageByPath<T>(path, init?)` | Resolve URL path to page (uses Wagtail's `find/?html_path=`) |
| `fetchPagePreview<T>(contentType, token, id, init?)` | Fetch draft preview |
| `fetchImage(id, queries?, init?)` | Fetch image by ID |
| `fetchDocument(id, queries?, init?)` | Fetch document by ID |
| `getMediaSrc(media)` | Construct full media URL from `CMSMediaMeta` |

### ISR Caching

All fetch requests include `next: { revalidate: 360 }` by default (6-minute ISR).

## Wagtail API v2 Reference

### Endpoints

- Pages: `GET /api/v2/pages/`
- Images: `GET /api/v2/images/`
- Documents: `GET /api/v2/documents/`
- Find by path: `GET /api/v2/pages/find/?html_path=/about/` (returns 302 redirect to detail view)

### Query Parameters

| Parameter | Example | Purpose |
|---|---|---|
| `type` | `?type=news.NewsContentPage` | Filter by page model |
| `fields` | `?fields=title,body,lead_text` | Select specific fields (`*` for all) |
| `child_of` | `?child_of=5` | Direct children of page ID |
| `descendant_of` | `?descendant_of=5` | All descendants |
| `ancestor_of` | `?ancestor_of=10` | All ancestors |
| `slug` | `?slug=about` | Exact match on slug |
| `search` | `?search=mental+health` | Full-text search |
| `order` | `?order=-first_published_at` | Sort (prefix `-` for descending) |
| `locale` | `?locale=en` | Filter by locale |
| `limit` | `?limit=10` | Items per page (default 20) |
| `offset` | `?offset=20` | Skip N items |

### Pagination

Responses include `meta.total_count` for total results. Combine `limit` + `offset` for pagination.

## Layer 3: Mapping (`@repo/wagtail-cms-mapping`)

Maps CMS page types to layout templates and block types to React components via a registry-based factory. Sub-path exports: `.`, `./blocks`, `./pages`, `./types`.

### Factory Pattern

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const { renderBlocks, renderPage } = createCMSRenderer();
// Pass optional overrides to swap components for a specific route:
// createCMSRenderer({ blocks: { text: MyCustomText } })
```

- `renderPage(page)` — looks up the page type in `defaultPageRegistry` and renders the registered layout
- `renderBlocks(blocks)` — maps each block through `defaultBlockRegistry` to the registered component

## Layer 4: Rendering (Next.js App)

Fetch in Server Components, then delegate rendering to the mapping layer.

### Common Pattern: Fetch and Render a Page

```typescript
// app/[...slug]/page.tsx (Server Component)
import { CMSClient } from "@repo/wagtail-api-client";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const client = new CMSClient({ baseURL: "...", apiPath: "/api/cms/v2" });
const { renderPage } = createCMSRenderer();

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const page = await client.findPageByPath<CMSPageProps>(path);

  if ("error" in page) return notFound();

  return renderPage(page);
}
```

### Common Pattern: Render Blocks Only

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const { renderBlocks } = createCMSRenderer();

// Render just the body blocks within a custom layout
export default async function CustomLayout({ page }) {
  return (
    <main>
      <h1>{page.title}</h1>
      {renderBlocks(page.body)}
    </main>
  );
}
```
