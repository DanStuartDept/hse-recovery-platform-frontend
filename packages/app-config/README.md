# @repo/app-config

Centralised environment variable validation and typed configuration for all apps in the monorepo.

Reads `process.env` at import time, validates with Zod, and exports frozen, typed config objects. Apps get a single source of truth for configuration instead of scattered `process.env` reads.

## Usage

### Client config (safe for server and client components)

```typescript
import { config } from "@repo/app-config";

// CMS client setup
const client = new CMSClient(config.cms);

// Conditional analytics
if (config.gtmId) {
  // render GTM script
}

// Environment checks
if (config.isProduction) {
  // production-only logic
}
```

### Server config (API routes only)

```typescript
import { serverConfig } from "@repo/app-config/server";

// Preview API route authentication
if (token !== serverConfig.previewToken) {
  return new Response("Unauthorized", { status: 401 });
}
```

> Importing `@repo/app-config/server` in a client component will expose secrets. Use only in API routes and server-only code.

### In tests

No env vars needed. When `NODE_ENV=test`, validation is skipped and a stub config with safe defaults is exported.

```typescript
import { config } from "@repo/app-config";
// config.cms = { baseURL: "", apiPath: "" }
// config.environment = "localhost"
// config.analyticsEnabled = false

// To test with specific values:
vi.mock("@repo/app-config", () => ({
  config: {
    cms: { baseURL: "https://test.hse.ie", apiPath: "/api/v2" },
    environment: "dev",
    siteUrl: "https://test.hse.ie",
    isLocalhost: false,
    isProduction: false,
    analyticsEnabled: false,
  },
}));
```

## Config shape

### `AppConfig` (from `@repo/app-config`)

| Field | Type | Description |
|-------|------|-------------|
| `cms.baseURL` | `string` | Wagtail CMS base URL |
| `cms.apiPath` | `string` | API version path (e.g. `"/api/v2"`) |
| `environment` | `"localhost" \| "dev" \| "pre-prod" \| "prod"` | Deployment environment |
| `siteUrl` | `string` | Public site URL for canonical links and OG tags |
| `gtmId` | `string \| undefined` | Google Tag Manager container ID |
| `oneTrustDomainId` | `string \| undefined` | OneTrust cookie consent domain ID |
| `piwik` | `{ containerId, containerUrl } \| undefined` | Piwik Pro settings (all-or-nothing) |
| `isLocalhost` | `boolean` | `true` when environment is `"localhost"` |
| `isProduction` | `boolean` | `true` when environment is `"prod"` |
| `analyticsEnabled` | `boolean` | `true` when not localhost and at least one analytics integration is configured |

### `ServerConfig` (from `@repo/app-config/server`)

| Field | Type | Description |
|-------|------|-------------|
| `previewToken` | `string` | CMS preview API route authentication secret |
| `revalidateToken` | `string` | CMS revalidation webhook authentication secret |

## Environment variables

| Env var | Required | Maps to |
|---------|----------|---------|
| `NEXT_PUBLIC_CMS_API_ENDPOINT` | Yes | `config.cms.baseURL` |
| `NEXT_PUBLIC_API_PATH` | Yes | `config.cms.apiPath` |
| `NEXT_PUBLIC_ENVIRONMENT_NAME` | Yes | `config.environment` |
| `NEXT_PUBLIC_SITEURL` | Yes | `config.siteUrl` |
| `PREVIEW_TOKEN` | Yes | `serverConfig.previewToken` |
| `REVALIDATE_TOKEN` | Yes | `serverConfig.revalidateToken` |
| `NEXT_PUBLIC_GTM_ID` | No | `config.gtmId` |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | No | `config.oneTrustDomainId` |
| `NEXT_PUBLIC_PIWIK_CONTAINER_ID` | No | `config.piwik?.containerId` |
| `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | No | `config.piwik?.containerUrl` |

Copy `apps/hse-app-template/.env.example` to `.env` and fill in the values.

## Validation behaviour

- **Required variables** are validated with `schema.parse()` at import time. Missing or invalid values throw immediately with a descriptive Zod error. The app will not start.
- **Optional variables** are validated with `schema.safeParse()`. Missing or invalid values result in `undefined`. Never throws.
- **Piwik is all-or-nothing**: both `PIWIK_CONTAINER_ID` and `PIWIK_CONTAINER_URL` must be set, or neither. Setting only one results in `config.piwik` being `undefined`.
- **`NODE_ENV=test`** skips all validation and returns stub defaults.

## Architecture

This is a **source-only package** (no build step). The `exports` map points directly at `.ts` files:

- `@repo/app-config` -> `src/index.ts` -> re-exports from `src/client.ts`
- `@repo/app-config/server` -> `src/server.ts`

The `cms` config shape is compatible with `ClientOptions` from `@repo/wagtail-api-client` by convention (no import dependency).
