---
sidebar_position: 6
---

# Caching Strategy

The app uses a three-layer caching strategy to balance performance, freshness, and resilience. Each layer serves a different purpose and they work together to ensure pages load fast while staying up to date with CMS content changes.

---

## Layer 1 — Static generation at build time

`generateStaticParams` in `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx` pre-renders every published CMS page at build time:

```ts
export async function generateStaticParams() {
  const params = [];

  for (const locale of i18nConfig.locales) {
    let offset = 0;
    const PAGE_SIZE = 20;

    for (;;) {
      const batch = await cmsClient.fetchPages<CMSPageContents>({
        locale,
        limit: PAGE_SIZE,
        offset,
      });

      for (const page of batch.items) {
        const path = extractPath(page.meta.html_url);
        const segments = path.split("/").filter(Boolean);
        params.push({
          lang: locale,
          slug: segments.length > 0 ? segments : undefined,
        });
      }

      if (batch.items.length === 0 || offset + batch.items.length >= batch.meta.total_count) {
        break;
      }
      offset += batch.items.length;
    }
  }

  return params;
}
```

Pages are fetched in batches of 20 for every configured locale. The result is an array of `{ lang, slug }` parameter objects that Next.js uses to pre-render static HTML at build time.

**What this means in practice:**
- Every page a visitor is likely to request is served as pre-rendered static HTML from the CDN edge — zero server compute per request.
- The build time increases linearly with the number of CMS pages. For very large sites, consider paginating or filtering `fetchPages` to exclude draft/private content.
- If the build fails to connect to the CMS, `generateStaticParams` logs a warning and returns an empty array rather than failing the entire build. Pages not covered by `generateStaticParams` fall through to Layer 2.

---

## Layer 2 — Incremental Static Regeneration (ISR)

Every page fetch in the catch-all route passes a revalidation interval:

```ts
const REVALIDATE_SECONDS = 3600; // 1 hour

const response = await cmsClient.findPageByPath(path, {
  next: { revalidate: REVALIDATE_SECONDS },
});
```

The same interval is set for the layout's header and footer fetches, and for `generateMetadata`.

ISR works at the Next.js Data Cache level:

1. On the first request after the interval expires, Next.js serves the stale cached page to the visitor immediately (no latency hit) and revalidates in the background.
2. The next request after revalidation completes receives the freshened content.
3. If revalidation fails, the stale content continues to be served — the page does not go down.

The 1-hour interval acts as a safety net. If the Wagtail webhook (Layer 3) fires reliably, most updates are reflected within seconds rather than up to an hour.

The low-level `fetchRequest` helper in `@repo/wagtail-api-client` also defaults to `next: { revalidate: 3600 }` when no `init` is provided, so any fetch call that does not explicitly set a revalidation interval inherits the 1-hour default:

```ts
const defaultInit = {
  next: { revalidate: 3600 },
} as RequestInit & { next?: { revalidate?: number } };

const response = await fetch(url, { ...defaultInit, ...init });
```

---

## Layer 3 — On-demand revalidation via webhook

When a page is published in Wagtail, the CMS sends a GET request to the app's revalidation endpoint:

```
GET /api/revalidate/?path=/about/&token=<REVALIDATE_TOKEN>
```

The route handler at `apps/hse-multisite-template/src/app/api/revalidate/route.ts`:

```ts
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const token = searchParams.get("token");

  if (token !== serverConfig.revalidateToken) {
    warn("[Revalidate] Invalid token attempt");
    return new Response("Invalid revalidation token", { status: 401 });
  }

  if (!path) {
    return Response.json({ revalidated: false, message: "Missing path" }, { status: 400 });
  }

  revalidatePath(path);
  log("[Revalidate] Revalidated:", path);

  return Response.json({ revalidated: true, now: Date.now() });
}
```

**Security:** The `token` query parameter is compared against `serverConfig.revalidateToken`, which reads the `REVALIDATE_TOKEN` environment variable via `@repo/app-config/server`. A request with a missing or incorrect token receives a `401` response. The token is a server-only secret — it is never included in `NEXT_PUBLIC_*` vars and never sent to the browser.

**What `revalidatePath` does:** It purges the Next.js Data Cache and the Full Route Cache for the specified path, forcing the next request to that path to fetch fresh data from Wagtail and regenerate the HTML. The webhook caller receives a `200` response with `{ revalidated: true, now: <timestamp> }`.

**All responses include `Cache-Control: no-cache`** to prevent the revalidation endpoint response itself from being cached by intermediary proxies.

---

## `dynamicParams = true`

```ts
export const dynamicParams = true;
```

This flag (set at the top of `page.tsx`) allows Next.js to render pages that were **not** included in `generateStaticParams`. In practice this means:

- Pages published after the last build are automatically rendered on the first request.
- The rendered output is then cached (subject to the ISR interval) so subsequent requests are fast.
- Without this flag, any path not returned by `generateStaticParams` would return a 404.

---

## Debugging cache behaviour

On localhost, `next.config.ts` enables full fetch URL logging:

```ts
...(config.isLocalhost && {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}),
```

This writes every fetch request to the terminal with its full URL, cache status (`HIT`, `MISS`, `SKIP`, `REVALIDATED`), and response time. It is only active when `NEXT_PUBLIC_ENVIRONMENT_NAME=localhost` — it is never enabled in deployed environments.

---

## Summary

| Layer | Mechanism | Freshness | When it applies |
|---|---|---|---|
| Static generation | `generateStaticParams` at build time | Build-time snapshot | All published pages at build |
| ISR | `next: { revalidate: 3600 }` | Up to 1 hour stale | All pages after build |
| On-demand | `/api/revalidate/` webhook | Near-real-time | Pages published in Wagtail |

The combination means:
- First load is always fast (static HTML served from edge)
- Content changes are reflected quickly when the webhook fires
- Even if the webhook never fires, content is at most 1 hour stale
- New pages published after the build are served without requiring a rebuild
