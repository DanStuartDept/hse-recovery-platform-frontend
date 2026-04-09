---
sidebar_position: 1
---

# `@repo/app-config`

Centralised environment variable validation and typed configuration for the monorepo. All app code reads runtime config from this package — never from `process.env` directly.

**Path:** `packages/app-config`  
**Type:** Source-only (no build step)  
**Exports:** `config` (client-safe), `serverConfig` (server-only, via sub-path)

---

## Why use this package

Accessing `process.env` directly is error-prone: typos are silent, missing values only surface at runtime, and secrets can accidentally leak into client bundles. `@repo/app-config` solves all three problems:

- **Validation at startup** — Zod parses required variables when the module is first imported. A missing or invalid value throws immediately with a clear message before any request is served.
- **Type safety** — Every config field has an explicit TypeScript type derived from the Zod schema.
- **Bundle safety** — Client config is imported from the default export. Server secrets live in a separate sub-path (`@repo/app-config/server`) that must never be imported in client components.

---

## Client configuration

### Import

```ts
import { config } from "@repo/app-config";
```

### `AppConfig` shape

| Field | Type | Source env var | Notes |
|---|---|---|---|
| `cms.baseURL` | `string` | `NEXT_PUBLIC_CMS_API_ENDPOINT` | Wagtail CMS base URL, e.g. `"https://cms.hse.ie"`. Required. |
| `cms.apiPath` | `string` | `NEXT_PUBLIC_API_PATH` | API version path, e.g. `"/api/v2"`. Required. |
| `environment` | `"localhost" \| "dev" \| "pre-prod" \| "prod"` | `NEXT_PUBLIC_ENVIRONMENT_NAME` | Deployment environment. Required. |
| `siteUrl` | `string` (URL) | `NEXT_PUBLIC_SITEURL` | Public site URL for canonical links, sitemap, and OG tags. Required. |
| `gtmId` | `string \| undefined` | `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID. Optional. |
| `oneTrustDomainId` | `string \| undefined` | `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | OneTrust cookie consent domain ID. Optional. |
| `piwik` | `{ containerId: string; containerUrl: string } \| undefined` | `NEXT_PUBLIC_PIWIK_CONTAINER_ID` / `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | Both fields are required if either is set. Optional. |
| `remoteImageDomains` | `readonly string[] \| undefined` | `NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS` | Comma-separated hostnames, split and trimmed at parse time. Optional. |
| `isLocalhost` | `boolean` | — | Derived. `true` when `environment === "localhost"`. |
| `isProduction` | `boolean` | — | Derived. `true` when `environment === "prod"`. |
| `analyticsEnabled` | `boolean` | — | Derived. `true` when not localhost and at least one analytics integration is configured. |

The object is deeply frozen at runtime — mutations throw in strict mode.

### Validation behaviour

- **Required fields** (`cms`, `environment`, `siteUrl`) are parsed with `clientSchema.parse()`. A missing or invalid value throws a `ZodError` on module import, aborting the server startup.
- **Optional fields** (`gtmId`, `oneTrustDomainId`, `piwik`, `remoteImageDomains`) are parsed with `safeParse()`. Validation failures are silently treated as `undefined` — the app starts normally, the integration is simply disabled.
- Piwik is only validated if at least one of its two env vars is set, so a partial configuration is detected and discarded rather than causing a schema error.

---

## Server configuration

### Import

```ts
import { serverConfig } from "@repo/app-config/server";
```

> **Warning:** Never import `@repo/app-config/server` from a Client Component, a file with `"use client"`, or any module that could be included in the client bundle. Doing so will expose `PREVIEW_TOKEN` and `REVALIDATE_TOKEN` to the browser.

### `ServerConfig` shape

| Field | Type | Source env var | Notes |
|---|---|---|---|
| `previewToken` | `string` | `PREVIEW_TOKEN` | Shared secret for CMS preview API route authentication. Required. |
| `revalidateToken` | `string` | `REVALIDATE_TOKEN` | Shared secret for CMS revalidation webhook authentication. Required. |

Both fields are required. A missing value throws a `ZodError` on module import.

The object is frozen with `Object.freeze()`.

---

## Test environment defaults

When `NODE_ENV === "test"`, both `createConfig()` and `createServerConfig()` return safe empty defaults without reading any environment variables. This means tests never need to set up environment variables to import the package:

```ts
// In test environment:
config.cms.baseURL   // ""
config.cms.apiPath   // ""
config.siteUrl       // "http://localhost:3000"
config.environment   // "localhost"
config.isLocalhost   // true
config.isProduction  // false
config.analyticsEnabled // false

serverConfig.previewToken    // ""
serverConfig.revalidateToken // ""
```

---

## Usage examples

### Reading CMS connection settings

```ts
import { config } from "@repo/app-config";

const client = new CMSClient({
  baseURL: config.cms.baseURL,
  apiPath: config.cms.apiPath,
});
```

### Gating an analytics integration

```ts
import { config } from "@repo/app-config";

// Only render GTM if configured and not on localhost
if (config.analyticsEnabled && config.gtmId) {
  // render <Script> tag
}
```

### Configuring remote image domains in next.config.ts

```ts
import { config } from "@repo/app-config";

const remotePatterns = (config.remoteImageDomains ?? []).map((hostname) => ({
  protocol: "https" as const,
  hostname,
}));
```

### Using server config in a Route Handler

```ts
// app/api/revalidate/route.ts — Server Component / Route Handler only
import { serverConfig } from "@repo/app-config/server";

export async function POST(request: Request) {
  const token = request.headers.get("x-revalidate-token");
  if (token !== serverConfig.revalidateToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ...
}
```

---

## Rule: never read `process.env` directly

All app code must import from `@repo/app-config` instead of calling `process.env` directly. This ensures:

1. Values are validated before use.
2. Config is typed — no silent `string | undefined` casts.
3. Tests work without environment setup.
4. There is a single source of truth for every env var in the app.

The only place `process.env` is read in the entire codebase is inside `packages/app-config/src/`.
