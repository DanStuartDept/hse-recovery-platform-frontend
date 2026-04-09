---
sidebar_position: 3
---

# `@repo/wagtail-cms-types`

Zod-based type definitions for all Wagtail CMS API shapes. Every schema is defined with Zod first — TypeScript types are inferred with `z.infer<>`. This means types and runtime validation are always in sync.

**npm name:** `@repo/wagtail-cms-types`  
**Path:** `packages/wagtail-cms-types`  
**Type:** Source-only (no build step — `exports` map points directly at `.ts` files)

---

## Design principle: Zod-first

Types are never hand-written. Every type in this package is derived from a Zod schema:

```ts
export const CMSPageTypeSchema = z.enum([...]);
export type CMSPageType = z.infer<typeof CMSPageTypeSchema>;
```

This ensures:

- **Runtime validation** — Use `.parse()` or `.safeParse()` to validate data from the CMS API before using it.
- **Type safety** — TypeScript types are automatically kept in sync with schema changes.
- **No drift** — There is no separate type definition that can become inconsistent with validation logic.

When you receive data from the CMS API, validate it with `safeParse()` before using it. A schema mismatch should be logged as a warning, not thrown as an error:

```ts
import { CMSContentPagePropsSchema } from "@repo/wagtail-cms-types/page-models";

const result = CMSContentPagePropsSchema.safeParse(rawData);
if (!result.success) {
  warn("[CMS] Schema mismatch:", result.error);
  return; // or fallback
}
const page = result.data; // typed as CMSContentPageProps
```

---

## Sub-path exports

The package exposes five sub-paths. Import from the specific path that contains what you need — do not import from the package root.

### `@repo/wagtail-cms-types/core`

Core API primitives shared across all content types.

**Key types:**

| Export | Description |
|---|---|
| `CMSPageType` | Union of all registered Wagtail page type strings (e.g. `"hsebase.ContentPage"`). |
| `CMSPageContent` | Base page shape: `id`, `title`, `meta` (including `slug`, `type`, `html_url`, `seo_title`, `search_description`, `parent`). |
| `CMSPageMeta` | Metadata attached to every page: `slug`, `type`, `locale`, `html_url`, `detail_url`, `seo_title`, `first_published_at`, `last_published_at`, `search_description`, `parent`. |
| `CMSContent` | Generic content item: `id`, `title`, `meta` (page or media). |
| `CMSContents<T>` | Paginated collection: `{ meta: { total_count }, items: T[] }`. |
| `CMSPageContents<T>` | Paginated page collection. |
| `CMSMediaContents<T>` | Paginated media (images/documents) collection. |
| `CMSMediaMeta` | Media item metadata: `type`, `detail_url`, `tags`, `download_url`. |
| `CMSQueries` | Query parameter shape for API requests. |
| `CMSContentPath` | Union of valid endpoint paths: `"pages"`, `"pages/${number}"`, `"images"`, etc. |
| `CMSPageBreadcrumb` | Breadcrumb item: `id`, `title`, `slug`, `url`. |
| `ClientOptions` | Constructor options for `CMSClient`: `baseURL`, `apiPath`, `mediaBaseURL?`, `init?`. |
| `NotFoundContents` | Error wrapper returned by `CMSClient`: `{ message: string; data: unknown }`. |

**`CMSPageType` values:**

```ts
"hsebase.ContentPage"
"hsebase.LandingPage"
"hsebase.CuratedHubPage"
"hsebase.OrganisationListingPage"
"hsebase.OrganisationLandingPage"
```

---

### `@repo/wagtail-cms-types/blocks`

Block type definitions for Wagtail StreamField blocks.

**Key types:**

| Export | Description |
|---|---|
| `CMSBlockType<TClient>` | Generic block: `id`, `type`, `value`, `settings?`, `client?`. |
| `CMSBlockComponentsKeys` | Union of all registered block type strings (see below). |
| `BlockDisplaySettingsType` | Optional display hints: `fluid?`, `fullWidth?`, `inRow?`. |
| `BlockTextContentProps` | Block with `type: "text"` and `value: { title?, text }`. |
| `BlockContentBlockProps` | Block with `type: "content_block_chooser"` and `value: { content_block: number }`. |

**`CMSBlockComponentsKeys` values:**

```
text, rich_text_block, richtext, image, inset_text, quote, top_tasks, top_task,
links_list_group_v2, action_link, expander, expander_group, details, button_list,
content_block_chooser, brightcove_video, related_information, section, teaser_links
```

---

### `@repo/wagtail-cms-types/page-models`

Page model schemas for all registered Wagtail page types.

**Key types:**

| Export | Description |
|---|---|
| `CMSPageWithBlocks` | `CMSPageContent` extended with `header` and `body` block arrays. |
| `CMSPageProps` | Union of all concrete page props types. |
| `CMSContentPageProps` | Content page: `CMSPageWithBlocks` + `lead_text?`, `side_nav?`. |
| `CMSLandingPageProps` | Landing page: `CMSPageContent` + `lead_text?`, `top_content?`, `content?`, `bottom_content?`. |
| `CMSCuratedHubPageProps` | Curated hub: `CMSPageContent` + `lead_text?`, `content?`, `bottom_content?`. |
| `CMSOrganisationLandingPageProps` | Organisation landing: `CMSPageContent` + `lead_text?`, `content?`, `bottom_content?`. |
| `CMSOrganisationListingPageProps` | Organisation listing: `CMSPageContent` + `lead_text?`, `organisation_links`, `organisation_links_count`. |

---

### `@repo/wagtail-cms-types/fields`

Reusable field schemas used across multiple page models and blocks.

**Key types:**

| Export | Description |
|---|---|
| `FieldTypeCta` | Call-to-action: `{ title: string; url: string }`. |
| `FieldTypeImage` | Full image with responsive variants: `id`, `src`, `alt`, `width`, `height`, plus `max_screen_sm/md/lg/xl/2xl/1920` and `thumbnail_120/400`. |
| `FieldTypeImageObject` | Base image: `src`, `alt`, `width`, `height`. |
| `FieldTypeVideo` | Video: `{ url: string; title?: string }`. |
| `FieldTypeHeadingLevel` | Heading level union: `1 \| 2 \| 3 \| 4 \| 5 \| 6`. |
| `NavItem` | Navigation item: `{ title: string; url: string }`. |

---

### `@repo/wagtail-cms-types/settings`

Schema types for the header and footer configuration endpoints (`/api/headers/`, `/api/footers/`).

**Key types:**

| Export | Description |
|---|---|
| `CMSHeaderResponse` | Full header config: navigation links, secondary links, mobile links, search settings, logo config. |
| `CMSFooterResponse` | Full footer config: primary footer links, secondary footer links. |
| `CMSHeaderNavLink` | Primary nav link with `label`, `link_url`, `page` (nullable Wagtail page ID). |
| `CMSHeaderSecondaryNavLink` | Secondary/mobile nav link — same as primary without the `page` field. |
| `CMSFooterLink` | Footer link with `link_label`, `link_url`. |
| `CMSHeaderAPIResponse` | Raw API response — array of `CMSHeaderResponse`. |
| `CMSFooterAPIResponse` | Raw API response — array of `CMSFooterResponse`. |

---

### `@repo/wagtail-cms-types/snippets`

Schema types for Wagtail snippet models (reusable non-page content).

**Key types:**

| Export | Description |
|---|---|
| `SnippetContentBlock` | Reusable content block snippet: `id`, `title`, `body` (array of blocks). |

---

## Usage example

```ts
import type { CMSContentPageProps } from "@repo/wagtail-cms-types/page-models";
import { CMSContentPagePropsSchema } from "@repo/wagtail-cms-types/page-models";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";

// Validate API response
const result = CMSContentPagePropsSchema.safeParse(rawApiData);

// Use the inferred type
function renderPage(page: CMSContentPageProps) {
  const blocks: CMSBlockType[] = page.body;
  // ...
}
```

---

## Extending types

When adding a new Wagtail page model, add its schema in `packages/wagtail-cms-types/src/types/page-models/` (extending `CMSPageContentSchema` or `CMSPageWithBlocksSchema`), then add its string to `CMSPageTypeSchema` in `core/index.ts`, and add it to the `CMSPageProps` union in `page-models/index.ts`.

When adding a new block type, add its string to `CMSBlockComponentsKeysSchema` in `blocks/base.ts`, and create a typed schema file in `blocks/`.
