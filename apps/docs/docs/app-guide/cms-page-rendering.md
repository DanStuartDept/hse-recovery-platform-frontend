---
sidebar_position: 4
---

# CMS Page Rendering

Every CMS page follows the same rendering path: URL → path → CMS fetch → Zod validation → renderer → React output. This page traces each step using the actual code in `src/app/[lang]/[[...slug]]/page.tsx`.

## Step 1: Resolve the path

```ts
const { slug } = await props.params;
const path = slugToPath(slug);
```

`slugToPath` converts the optional slug array to a path string. A missing slug (home page) becomes `"/"`, and `["about", "team"]` becomes `"/about/team/"`.

## Step 2: Fetch the CMS page

```ts
const response = await cmsClient.findPageByPath(path, {
  next: { revalidate: REVALIDATE_SECONDS },
});
```

`cmsClient` is the singleton `CMSClient` instance configured from `@repo/app-config` (see `src/lib/cms/client.ts`). `findPageByPath` queries the Wagtail pages API by the given path and returns the full page object, or a not-found error shape.

The `{ next: { revalidate: 3600 } }` option is passed through to the underlying `fetch` call, enabling Next.js ISR — the response is cached for one hour.

## Step 3: Handle not-found

```ts
if (isNotFound(response)) {
  logCmsError(path, response);
  notFound();
}
```

`isNotFound` (from `@repo/wagtail-api-client`) checks whether the response is an error object rather than a page. If it is, the error is logged at the appropriate level and `notFound()` is called — this triggers Next.js to render `[lang]/not-found.tsx`.

## Step 4: Validate the response

```ts
const result = CMSPageContentSchema.safeParse(response);
if (!result.success) {
  warn("[CMS] Validation issues for", path, result.error.issues);
}
```

`CMSPageContentSchema` is the base Zod schema for any CMS page (from `@repo/wagtail-cms-types/core`). `safeParse` is used rather than `parse` so that validation failures are non-fatal — they are logged as warnings and the page continues to render with the raw response. This prevents a partial CMS schema mismatch from crashing a production page.

## Step 5: Create the renderer

```ts
const renderer = createCMSRenderer({
  apiClient: cmsClient,
  debug: config.isLocalhost,
});
```

`createCMSRenderer` (from `@repo/wagtail-cms-mapping`) returns a `{ renderBlock, renderBlocks, renderPage }` object. It merges the default block and page registries with any overrides provided in the options object. The `debug` flag, when true, appends a collapsible raw-data panel below the rendered page — useful for local development.

A new renderer is created per request. Do not cache a renderer at module scope; the instance holds mutable page state set by `renderPage`.

## Step 6: Render the page

```ts
return renderer.renderPage(response as CMSPageProps);
```

`renderPage` looks up `page.meta.type` in the page registry to find the appropriate layout component (e.g., `ContentPage`, `LandingPage`). It then:

1. Renders a `<Breadcrumb>` if `page.breadcrumb` is present
2. Wraps the layout in `<main className="hse-main-wrapper">`
3. Passes `renderBlocks` to the layout component — layouts call `renderBlocks(page.body)` to turn block arrays into React nodes
4. Optionally appends `<CmsDebugPanel>` in localhost mode

Each block in an array is resolved through the block registry by its `type` key. Unmapped types fall back to `BlockFallback`, which renders a visible debug message in the `local` environment and nothing in other environments.

## Full flow summary

```
URL: /en/about/our-work/

  ↓  slugToPath(["about", "our-work"])
  →  path = "/about/our-work/"

  ↓  cmsClient.findPageByPath("/about/our-work/", { next: { revalidate: 3600 } })
  →  CMSPageProps (e.g., hsebase.ContentPage)

  ↓  CMSPageContentSchema.safeParse(response)
  →  Warns if schema mismatch, continues either way

  ↓  createCMSRenderer({ apiClient: cmsClient, debug: false })
  →  { renderPage, renderBlocks, renderBlock }

  ↓  renderer.renderPage(response)
  →  <Breadcrumb> + <main><ContentPage page={...} renderBlocks={...} /></main>

  ↓  ContentPage calls renderBlocks(page.body)
  →  [<BlockText />, <BlockImage />, <BlockQuote />, ...]
```

## Metadata generation

`generateMetadata` follows the same path (fetch → not-found check) and then calls `generatePageMetadata` from `@repo/wagtail-cms-mapping` to produce a Next.js `Metadata` object. See [SEO and Metadata](./seo-and-metadata.md) for details.
