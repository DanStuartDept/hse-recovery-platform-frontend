---
sidebar_position: 2
---

# `@repo/wagtail-api-client`

The HTTP client for the Wagtail CMS REST API. Provides `CMSClient`, a class that wraps `fetch` with structured error handling, ISR revalidation defaults, and typed responses.

**npm name:** `@repo/wagtail-api-client`  
**Path:** `packages/wagtail-cms-client`  
**Build:** bunchee — dual ESM (`dist/es/`) + CJS (`dist/cjs/`)

---

## Installation

The package is already available as a workspace dependency. Reference it with the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@repo/wagtail-api-client": "workspace:*"
  }
}
```

---

## `CMSClient`

The main class. Create one instance per request — do not cache an instance at module scope.

### Constructor

```ts
import { CMSClient } from "@repo/wagtail-api-client";

const client = new CMSClient(options: ClientOptions);
```

#### `ClientOptions`

| Option | Type | Required | Description |
|---|---|---|---|
| `baseURL` | `string` | Yes | CMS base URL, e.g. `"https://cms.hse.ie"`. Must not end with `/`. |
| `apiPath` | `string` | Yes | API version path, e.g. `"/api/v2"`. Must not end with `/`. |
| `mediaBaseURL` | `string` | No | Optional separate base URL for media files. Must not end with `/`. |
| `init` | `RequestInit` | No | Default fetch options applied to all requests (e.g., cache headers). |

The constructor throws if `baseURL`, `apiPath`, or `mediaBaseURL` end with a trailing slash.

### Typical setup

```ts
import { CMSClient } from "@repo/wagtail-api-client";
import { config } from "@repo/app-config";

const client = new CMSClient({
  baseURL: config.cms.baseURL,
  apiPath: config.cms.apiPath,
});
```

---

## Public methods

All methods that can fail (page not found, network error, 5xx) return `T | NotFoundContents` rather than throwing. Use the `isNotFound()` type guard to narrow the result.

### `findPageByPath`

Fetches a page by its HTML path using Wagtail's `find` endpoint.

```ts
findPageByPath<T = CMSPageContent>(
  path: string,
  init?: RequestInit,
): Promise<T | NotFoundContents>
```

- `path` — The trailing-slash path, e.g. `"/about/"`. Throws synchronously if empty.
- Calls `GET {baseURL}{apiPath}/pages/find/?html_path={path}`.
- Returns `NotFoundContents` on any fetch error.

**This is the primary method for the catch-all route.** Pass the result of `slugToPath()` as the path.

### `fetchPage`

Fetches a single page by numeric ID or slug string.

```ts
fetchPage(
  idOrSlug: number | string,
  queries?: CMSQueries,
  init?: RequestInit,
): Promise<CMSContent | NotFoundContents>
```

- When `idOrSlug` is a `string`, fetches by `?slug=` query and returns the first item (or `NotFoundContents` if empty).
- When `idOrSlug` is a `number`, fetches by ID via `GET {apiPath}/pages/{id}/`.

### `fetchPages`

Fetches a paginated list of pages.

```ts
fetchPages<T = CMSPageContents>(
  queries?: CMSQueries,
  init?: RequestInit,
): Promise<T>
```

Use this for `generateStaticParams` to enumerate all published pages.

### `fetchPagePreview`

Fetches a draft page preview from Wagtail's preview API.

```ts
fetchPagePreview<T = CMSPageContent>(
  contentType: string,
  token: string,
  id: string,
  init?: RequestInit,
): Promise<T | NotFoundContents>
```

- All three of `contentType`, `token`, and `id` are required — throws synchronously if any are empty.
- Calls `GET {baseURL}{apiPath}/page-preview/?content_type={contentType}&token={token}&id={id}`.

### `fetchContent`

Low-level method for fetching any CMS content collection.

```ts
fetchContent<T>(
  content: CMSContentPath,
  queries?: CMSQueries,
  init?: RequestInit,
): Promise<CMSContents | CMSContent | T>
```

`CMSContentPath` is a union: `"pages"`, `"pages/${number}"`, `"images"`, `"images/${number}"`, `"documents"`, or `"documents/${number}"`.

### `fetchImage` / `fetchImages`

Fetch a single image by ID, or a paginated list of images.

```ts
fetchImage(id: number, queries?: CMSQueries, init?: RequestInit): Promise<CMSContent | NotFoundContents>
fetchImages<T = CMSMediaContents>(queries?: CMSQueries, init?: RequestInit): Promise<T>
```

### `fetchDocument` / `fetchDocuments`

Fetch a single document by ID, or a paginated list of documents.

```ts
fetchDocument(id: number, queries?: CMSQueries, init?: RequestInit): Promise<CMSContent | NotFoundContents>
fetchDocuments<T = CMSContents>(queries?: CMSQueries, init?: RequestInit): Promise<T>
```

### `fetchHeader`

Fetches the site header configuration from `/api/headers/` and returns the first item.

```ts
fetchHeader(init?: RequestInit): Promise<CMSHeaderResponse | NotFoundContents>
```

### `fetchFooter`

Fetches the site footer configuration from `/api/footers/` and returns the first item.

```ts
fetchFooter(init?: RequestInit): Promise<CMSFooterResponse | NotFoundContents>
```

### `fetchEndpoint`

Fetches an arbitrary endpoint under `{baseURL}{apiPath}/{path}`. Use for custom Wagtail API endpoints.

```ts
fetchEndpoint<T>(path: string, init?: RequestInit): Promise<T | NotFoundContents>
```

Throws synchronously if `path` is empty.

### `getMediaSrc`

Constructs the correct URL for a media item (image or document), accounting for the difference between relative image download URLs and absolute document download URLs.

```ts
getMediaSrc(media: CMSMediaMeta): string
```

Uses `mediaBaseURL` if set, otherwise falls back to `baseURL`.

---

## `CMSQueries`

Optional query parameters accepted by most fetch methods:

| Parameter | Type | Description |
|---|---|---|
| `type` | `string` | Filter by Wagtail page model type, e.g. `"hsebase.ContentPage"`. |
| `slug` | `string` | Filter by slug. |
| `offset` | `number` | Pagination offset. |
| `limit` | `number` | Maximum items to return. |
| `order` | `string` | Sort field. Use `"random"` for random order (incompatible with `offset`). |
| `child_of` | `number` | Filter to children of page ID (pages only). |
| `ancestor_of` | `number` | Filter to ancestors of page ID (pages only). |
| `descendant_of` | `number` | Filter to descendants of page ID (pages only). |
| `locale` | `string` | Filter by locale, e.g. `"en"`. |
| `translation_of` | `number` | Filter to translations of page ID. |
| `fields` | `string[]` | List of additional fields to include in the response. |
| `show_in_menus` | `boolean` | Filter to pages marked for menu display. |
| `search` | `string` | Full-text search query. |
| `search_operator` | `string` | Search operator (`"and"` or `"or"`). |
| `site` | `string` | Filter by Wagtail site. |

The schema uses `.passthrough()` — additional undocumented parameters are forwarded as-is.

---

## `NotFoundContents` and `isNotFound()`

Methods that may fail return `T | NotFoundContents` instead of throwing. `NotFoundContents` has the shape:

```ts
type NotFoundContents = {
  message: string;
  data: unknown; // the underlying FetchError, or the raw response
};
```

Use the `isNotFound()` type guard to narrow:

```ts
import { isNotFound } from "@repo/wagtail-api-client";

const page = await client.findPageByPath(path);

if (isNotFound(page)) {
  // page.message — human-readable description
  // page.data    — the underlying FetchError (use instanceof FetchError to inspect)
  notFound(); // Next.js 404
}

// page is now CMSPageContent (or your generic T)
```

---

## `FetchError`

Thrown by the low-level `fetchRequest()` function and captured into `NotFoundContents.data` by `CMSClient` methods.

```ts
class FetchError extends Error {
  code: string;   // "REQUEST_FAILED" | "UNEXPECTED_ERROR"
  status: number; // HTTP status code, or 0 for network errors
}
```

| `code` | `status` | Meaning |
|---|---|---|
| `"REQUEST_FAILED"` | HTTP status (e.g. 404, 500) | Server returned a non-2xx response. |
| `"UNEXPECTED_ERROR"` | `0` | Network unreachable or non-HTTP error. |

Use `logCmsError()` from `@repo/wagtail-api-client` to log errors at the appropriate severity level based on status code.

---

## Standalone `fetchContent` function

A lower-level exported function for cases where you do not need the full `CMSClient`:

```ts
import { fetchContent } from "@repo/wagtail-api-client";

const data = await fetchContent(baseURL, apiPath, "pages", { type: "hsebase.ContentPage" });
```

This function throws `FetchError` on failure — error handling is left to the caller.

---

## Utility exports

| Function | Signature | Description |
|---|---|---|
| `slugToPath` | `(slug?: string[]) => string` | Converts a Next.js catch-all `slug` param array to a trailing-slash path for `findPageByPath`. `undefined` returns `"/"`. |
| `extractPath` | `(htmlUrl: string) => string` | Extracts the pathname from a Wagtail `html_url`. Returns `"/"` on malformed input. |
| `logCmsError` | `(path: string, response: NotFoundContents) => void` | Classifies a CMS error by HTTP status and logs at the appropriate level via `@repo/logger`. |
| `isNotFound` | `(response: unknown) => response is NotFoundContents` | Type guard for `NotFoundContents`. |

---

## ISR / caching behaviour

`fetchRequest()` sets `next: { revalidate: 3600 }` (1 hour) as the default fetch option. You can override this per-call by passing a custom `init`:

```ts
// Bypass ISR for a fresh response on every request
const page = await client.findPageByPath(path, { next: { revalidate: 0 } });

// Tag for on-demand revalidation
const page = await client.findPageByPath(path, { next: { tags: ["cms-pages"] } });
```

---

## Full usage example

```ts
// app/[...slug]/page.tsx
import { CMSClient, isNotFound, slugToPath } from "@repo/wagtail-api-client";
import { config } from "@repo/app-config";
import { notFound } from "next/navigation";

const client = new CMSClient({
  baseURL: config.cms.baseURL,
  apiPath: config.cms.apiPath,
});

export default async function CatchAllPage({ params }) {
  const path = slugToPath(params.slug);
  const page = await client.findPageByPath(path);

  if (isNotFound(page)) {
    notFound();
  }

  return <div>{page.title}</div>;
}
```
