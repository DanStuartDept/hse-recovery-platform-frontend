# @repo/wagtail-api-client

Wagtail REST API client for fetching CMS content in Next.js apps.

## Usage

```typescript
import { CMSClient, isNotFound } from "@repo/wagtail-api-client";
import { config } from "@repo/app-config";

const client = new CMSClient(config.cms);
// config.cms = { baseURL: "https://cms.example.com", apiPath: "/api/v2" }
```

### Fetch a page by path

```typescript
const page = await client.findPageByPath("/about/");

if (isNotFound(page)) {
  notFound(); // Next.js 404
}

// page is typed as CMSPageContent
console.log(page.title);
```

### Fetch a page by ID or slug

```typescript
const page = await client.fetchPage(42);           // by ID
const page = await client.fetchPage("about-us");   // by slug
```

### Fetch a list of pages

```typescript
const { items } = await client.fetchPages({ type: "news.NewsPage", limit: 10 });
```

### Fetch media

```typescript
const image = await client.fetchImage(5);
const doc = await client.fetchDocument(12);

// Resolve a download URL to a full src
const src = client.getMediaSrc(image.meta);
```

### Fetch arbitrary endpoints

```typescript
const data = await client.fetchEndpoint<MyType>("settings/site-settings/");
```

### CMS preview

```typescript
const preview = await client.fetchPagePreview(contentType, token, id);
```

## Not-found handling

All fetch methods return `T | NotFoundContents`. Use the `isNotFound()` type guard to narrow the type:

```typescript
import { isNotFound } from "@repo/wagtail-api-client";

const result = await client.fetchPage("missing-slug");
if (isNotFound(result)) {
  // result.message — human-readable reason
  // result.data    — the FetchError or raw response
}
```

## Error handling

Low-level fetch failures throw `FetchError`:

| Field    | Type                                      | Description                              |
| -------- | ----------------------------------------- | ---------------------------------------- |
| `code`   | `"REQUEST_FAILED" \| "UNEXPECTED_ERROR"` | Error category                           |
| `status` | `number`                                  | HTTP status code; `0` for network errors |

`CMSClient` methods catch `FetchError` internally and return `NotFoundContents` instead of throwing. Use `fetchRequest` directly if you want uncaught errors.

## Architecture

Built with **bunchee** to dual ESM + CJS output. TypeScript imports use `.js` extensions.
