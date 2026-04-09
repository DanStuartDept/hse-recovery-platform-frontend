---
sidebar_position: 2
---

# Routing

The app uses a single catch-all route to serve every CMS page. There are no hand-coded routes for individual content pages — everything goes through `[lang]/[[...slug]]`.

## Route structure

```
src/app/
└── [lang]/
    └── [[...slug]]/
        └── page.tsx
```

The `[lang]` segment captures the active locale (`en`, `ga`). The `[[...slug]]` is an **optional catch-all** — it matches zero or more path segments, so both `/en/` and `/en/about/contact/` are handled by the same file.

### How a URL maps to segments

| URL | `lang` | `slug` |
|---|---|---|
| `/en/` | `"en"` | `undefined` |
| `/en/about/` | `"en"` | `["about"]` |
| `/en/conditions/flu/symptoms/` | `"en"` | `["conditions", "flu", "symptoms"]` |
| `/ga/faoi/` | `"ga"` | `["faoi"]` |

The default locale (`en`) is always present in the URL segment at this level. The i18n middleware (if configured) handles hiding it from the visible URL — the app itself always receives a `lang` param.

### Slug to CMS path

`slugToPath` (from `@repo/wagtail-api-client`) converts the slug array back to a path string:

```ts
const path = slugToPath(slug);
// slug = ["about", "contact"] → path = "/about/contact/"
// slug = undefined           → path = "/"
```

This path is passed directly to `cmsClient.findPageByPath(path)` to look up the Wagtail page.

## `generateStaticParams`

```ts
export async function generateStaticParams(): Promise<
  Array<{ lang: string; slug?: string[] }>
>
```

Called at build time. Iterates over every configured locale and paginates through the Wagtail pages API (`cmsClient.fetchPages`) in batches of 20. For each page it extracts the path from `page.meta.html_url`, splits it into segments, and pushes a `{ lang, slug }` entry.

The result pre-renders all published CMS pages as static HTML at build time. If the CMS fetch fails for a locale, the error is logged and the loop continues — a partial build is better than a failed build.

## `dynamicParams = true`

```ts
export const dynamicParams = true;
```

This allows pages that were **not** returned by `generateStaticParams` to be rendered on demand. When a visitor hits a URL for a page published after the last build, Next.js server-renders it, then caches it — subsequent requests are served from cache until the ISR interval expires or a webhook invalidates it.

## ISR revalidation

```ts
const REVALIDATE_SECONDS = 3600;
```

The `cmsClient.findPageByPath` call passes `{ next: { revalidate: REVALIDATE_SECONDS } }` as fetch options. Cached responses are considered stale after one hour. For real-time updates, the `/api/revalidate/` webhook endpoint calls `revalidatePath` when content is published in Wagtail — see `src/app/api/revalidate/route.ts`.

## `generateStaticParams` in the layout

The `[lang]/layout.tsx` also exports `generateStaticParams`:

```ts
export async function generateStaticParams() {
  return i18nConfig.locales.map((lang) => ({ lang }));
}
```

This pre-renders the layout shell for each locale at build time. It is separate from the page-level `generateStaticParams` and only produces `{ lang }` entries — not slug entries.
