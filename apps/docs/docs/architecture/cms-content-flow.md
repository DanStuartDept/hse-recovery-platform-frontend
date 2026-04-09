---
sidebar_position: 4
---

# CMS Content Flow

This page traces the complete path a request takes from the browser URL to the rendered HTML page, including every CMS API call, Zod validation step, component lookup, and error-handling branch.

The entry point is the catch-all route at `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`.

---

## Overview

```
Browser URL
  └─ Next.js App Router
       └─ [lang]/[[...slug]] route
            ├─ generateStaticParams()     → pre-renders all CMS pages at build time
            ├─ generateMetadata()         → per-page title, description, canonical URL
            └─ CatchAllPage()             → renders page content
                 ├─ CMSClient.findPageByPath()
                 ├─ isNotFound() guard    → triggers next/navigation notFound()
                 ├─ CMSPageContentSchema.safeParse()  → Zod validation
                 └─ createCMSRenderer().renderPage()
                      ├─ pageRegistry lookup → page layout component
                      ├─ renderBlocks()   → block registry lookup per block
                      └─ HSE design-system components
```

---

## Step 1 — URL to route parameters

Next.js matches any request under `/[lang]/` to this catch-all route. The `lang` segment holds the locale (`en`, `ga`), and the optional `[[...slug]]` captures the rest of the path as a string array.

The `slugToPath` utility (from `@repo/wagtail-api-client`) converts the slug array back to a URL path string with a leading slash. An empty or missing slug means the home page (`"/"`).

```ts
const path = slugToPath(slug); // e.g. ["about", "team"] → "/about/team/"
```

---

## Step 2 — Fetching the page from Wagtail

`CMSClient.findPageByPath` calls the Wagtail `pages/find/` endpoint with the path as a query parameter:

```
GET {CMS_BASE_URL}/api/v2/pages/find/?html_path=/about/team/
```

The client is instantiated once per app from `@/lib/cms/client` using `config.cms` values from `@repo/app-config`. The `init` option passes `next: { revalidate: 3600 }` to opt this fetch into ISR (see [Caching Strategy](./caching-strategy.md)).

Internally, `fetchRequest` (the low-level fetch wrapper) also defaults to `next: { revalidate: 3600 }` if no `init` is provided, so the ISR safety net applies even if a call site forgets to pass it.

---

## Step 3 — Not-found guard

The `isNotFound` type guard checks whether the response has the `{ message: string, data: unknown }` shape that `CMSClient` returns on any fetch failure:

```ts
if (isNotFound(response)) {
  logCmsError(path, response);
  notFound(); // triggers Next.js 404 page
}
```

`logCmsError` classifies the error by the underlying `FetchError.status` before logging:

| Status | Log level | Reason |
|---|---|---|
| 404 or no `FetchError` | `log` | Expected — page does not exist in CMS |
| 5xx | `error` | CMS server is broken |
| 0 | `error` | Network unreachable |
| Other 4xx | `warn` | Unexpected client error |

---

## Step 4 — Zod schema validation

After confirming a page was found, the response is parsed against the `CMSPageContentSchema` Zod schema from `@repo/wagtail-cms-types/core`:

```ts
const result = CMSPageContentSchema.safeParse(response);
if (!result.success) {
  warn("[CMS] Validation issues for", path, result.error.issues);
}
```

`safeParse` is used intentionally — a schema mismatch logs a warning but does **not** crash the page. This means a CMS API change that adds unexpected fields or renames an optional field degrades gracefully (the page still renders with the data it received) while surfacing the discrepancy in the server logs for investigation.

---

## Step 5 — Creating the renderer

A new `CMSRenderer` is created for each request:

```ts
const renderer = createCMSRenderer({
  apiClient: cmsClient,
  debug: config.isLocalhost,
});
```

`createCMSRenderer` (from `@repo/wagtail-cms-mapping`) merges the default block and page registries with any overrides passed in `options.blocks` and `options.pages`. When `debug: true` (localhost only), it appends a `CmsDebugPanel` to the page that displays the raw CMS response data for inspection.

**Important:** A renderer instance holds mutable internal state (`currentPage`) that is set by `renderPage`. Create a new renderer per request — never cache a renderer at module scope.

---

## Step 6 — Page layout lookup

`renderer.renderPage(page)` looks up the page's Wagtail type in the page registry:

```ts
const Layout = pageRegistry[page.meta.type] ?? FallbackPage;
```

Default page layouts registered out of the box:

| CMS page type | Component |
|---|---|
| `hse.ContentPage` | `content-page.tsx` |
| `hse.LandingPage` | `landing-page.tsx` |
| `hse.CuratedHubPage` | `curated-hub-page.tsx` |
| `hse.OrganisationLandingPage` | `organisation-landing-page.tsx` |
| `hse.OrganisationListingPage` | `organisation-listing-page.tsx` |
| _(unknown type)_ | `DefaultFallbackPage` — renders the title and an explanatory message |

The rendered output wraps the page layout in a `<main class="hse-main-wrapper">` element and prepends a `<Breadcrumb>` component if the CMS page includes breadcrumb data.

---

## Step 7 — Block rendering

Page layouts call `renderBlocks(page.body)` to render the array of content blocks on that page. For each block, `renderBlocks` looks up the block type in the block registry:

```ts
const Component = blockRegistry[block.type] ?? FallbackBlock;
```

Every block component receives:

- All CMS block data spread as props (`id`, `type`, and type-specific fields)
- A `context` object containing `{ page, apiClient, position }` — `position` describes the block's index within the array, plus `isFirst`, `isLast`, `previous`, and `next` references
- A `renderBlocks` function for nested block rendering (e.g., section blocks that contain other blocks)

Default block components include: `block-text`, `block-image`, `block-button`, `block-quote`, `block-inset-text`, `block-section`, `block-content-block`, `block-details`, `block-details-group`, `block-promo`, `block-links-list`, `block-teaser-links`, `block-related-info`, `block-action-link`, `block-brightcove`.

Unrecognised block types render `BlockFallback` — a visible placeholder in development that shows the block type string.

---

## Step 8 — HSE design system

Block and page layout components use `@hseireland/hse-frontend-react` React components (buttons, cards, headings, etc.) and the `@hseireland/hse-frontend` CSS token library for styling. These are the canonical HSE Ireland design system packages. Custom components should only be written when the design system does not provide a suitable equivalent.

---

## Metadata generation

`generateMetadata` runs in parallel with the page render. It calls `findPageByPath` with the same ISR options, then calls `generatePageMetadata` (from `@repo/wagtail-cms-mapping`):

```ts
return generatePageMetadata(response as CMSPageProps, {
  siteUrl: config.siteUrl,
  path,
  defaultDescription,
});
```

`generatePageMetadata` maps CMS fields to Next.js `Metadata`:

| CMS field | Next.js `Metadata` key |
|---|---|
| `meta.seo_title` (falls back to `title`) | `title` |
| `meta.search_description` (falls back to dictionary `meta.defaultDescription`) | `description` |
| `siteUrl + path` | `alternates.canonical` |

The layout defines title template (`"%s | HSE.ie"`) and `metadataBase` — these are app-level constants merged by Next.js with the per-page overrides from `generatePageMetadata`.

---

## Error boundaries

Runtime errors during page render are caught by Next.js error boundaries:

- `apps/hse-multisite-template/src/app/[lang]/error.tsx` — locale-scoped error boundary; logs at `error` level.
- `apps/hse-multisite-template/src/app/global-error.tsx` — root-level fallback for errors that escape the locale layout.

The locale `not-found.tsx` handles `notFound()` calls and renders the HSE 404 page in the correct language.
