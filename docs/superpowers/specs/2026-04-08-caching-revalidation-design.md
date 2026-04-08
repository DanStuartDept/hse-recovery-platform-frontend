# Caching and Revalidation Strategy Design

**Date:** 2026-04-08
**Backlog item:** #8 — Caching and Revalidation Strategy
**Status:** Approved

---

## Goal

Complete the caching strategy for the `hse-multisite-template` app by adding webhook-triggered on-demand revalidation and static pre-rendering of CMS pages. The site serves brochure-style content that changes infrequently, so pages should be statically generated at build time with ISR as a safety net and a Wagtail webhook for immediate cache invalidation on publish.

## Scope

- New revalidation API route in the template app
- `generateStaticParams` in the catch-all route for static pre-rendering
- ISR interval increased from 360s (6 min) to 3600s (1 hour)

### Out of scope

- Per-environment cache configuration (not needed — same config everywhere)
- Tag-based revalidation (`revalidateTag`) — path-based is sufficient for now
- Cache invalidation for non-page content (images, documents) — ISR TTL covers these
- CDN-level caching configuration (infrastructure concern, not app-level)

---

## Architecture

### Three-layer caching strategy

1. **Static generation at build time** — `generateStaticParams` pre-renders all published CMS pages across all locales. Pages are served as static HTML from the Full Route Cache with `Cache-Control: s-maxage=3600, stale-while-revalidate`.

2. **ISR fallback (1 hour)** — Pages revalidate in the background at most once per hour. This is a safety net for missed webhooks or edge cases. New pages published after build are rendered on-demand on first visit (via `dynamicParams = true`), then cached identically.

3. **On-demand revalidation via webhook** — When content is published, edited, or deleted in Wagtail, a webhook calls the revalidation endpoint with the page path. `revalidatePath()` immediately invalidates the cached page, and the next request triggers a fresh render.

### 1. Revalidation API route

**New file:** `apps/hse-multisite-template/src/app/api/revalidate/route.ts`

GET route handler invoked by Wagtail's webhook system.

**Request:** `GET /api/revalidate/?path=/about/&token=<secret>`

**Query parameters:**
- `path` (required) — the page path to invalidate (e.g. `/about/`, `/services/mental-health/`)
- `token` (required) — must match `serverConfig.revalidateToken` from `@repo/app-config/server`

**Behaviour:**
1. Read `path` and `token` from `request.nextUrl.searchParams`
2. Validate `token` against `serverConfig.revalidateToken` — return 401 if invalid or missing
3. Validate `path` is present — return 400 if missing
4. Call `revalidatePath(path)` from `next/cache`
5. Log the revalidation via `@repo/logger`
6. Return JSON response with `Cache-Control: no-cache`

**Response codes:**
- `200` — `{ revalidated: true, now: <timestamp> }`
- `400` — `{ revalidated: false, now: <timestamp>, message: "Missing path to revalidate" }`
- `401` — `"Invalid revalidation token"` (plain text)

**Dependencies:**
- `@repo/app-config/server` — `serverConfig.revalidateToken` (env var `REVALIDATE_TOKEN`, already defined)
- `@repo/logger` — `log()` for successful revalidations, `warn()` for auth failures
- `next/cache` — `revalidatePath()`

### 2. `generateStaticParams` in catch-all route

**Modified file:** `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`

**Changes:**
- Add `generateStaticParams()` export that fetches all published pages from Wagtail and returns `{ lang, slug }` pairs for every page × every configured locale
- Add `export const dynamicParams = true` so pages published after the last build are still rendered on-demand
- Change `REVALIDATE_SECONDS` from `360` to `3600` (1 hour)

**`generateStaticParams` implementation:**
1. Call `cmsClient.fetchPages()` to get all published pages
2. Extract the path/slug from each page
3. Cross-product with all configured locales from `i18nConfig`
4. Return array of `{ lang: string, slug: string[] }` params

**Example output:**
```ts
[
  { lang: "en", slug: undefined },      // homepage
  { lang: "ga", slug: undefined },      // homepage (Irish)
  { lang: "en", slug: ["about"] },      // /about/
  { lang: "ga", slug: ["about"] },      // /ga/about/
  { lang: "en", slug: ["services", "mental-health"] }, // /services/mental-health/
  // ...
]
```

### ISR interval change

`REVALIDATE_SECONDS` changes from `360` to `3600` in the catch-all route. This value is also used in the fetch-level `next.revalidate` option passed to `cmsClient.findPageByPath()`.

The base fetch default in `packages/wagtail-cms-client/src/lib/fetch.ts` (currently `360`) should also be updated to `3600` for consistency — this is the fallback used when no per-call override is provided.

---

## Files changed

| File | Action | Description |
|------|--------|-------------|
| `apps/hse-multisite-template/src/app/api/revalidate/route.ts` | Create | Revalidation webhook endpoint |
| `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx` | Modify | Add `generateStaticParams`, `dynamicParams = true`, update `REVALIDATE_SECONDS` to 3600 |
| `packages/wagtail-cms-client/src/lib/fetch.ts` | Modify | Update default `next.revalidate` from 360 to 3600 |

---

## Testing

- Unit test for the revalidation route: valid token + path returns 200, invalid token returns 401, missing path returns 400
- Verify `generateStaticParams` returns correct params structure (may require mocking `cmsClient.fetchPages()`)
- Manual verification: publish a page in Wagtail, confirm the webhook triggers revalidation and the page updates
