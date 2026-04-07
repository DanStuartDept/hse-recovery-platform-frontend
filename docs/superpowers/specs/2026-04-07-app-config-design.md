# App Config Package Design

## Overview

A shared, source-only configuration package (`@repo/app-config`) that centralises environment variable reading, Zod validation, and typed access for all apps in the monorepo.

**Motivation:** Environment variables are currently unmanaged — the template app has no `.env.example`, no validation, and no typed config. As apps multiply, each would independently read `process.env` with different var names, no validation, and duplicated logic. This package enforces consistency, validates at startup, and provides a single typed config object.

**Constraint:** `NEXT_PUBLIC_*` variables are inlined at build time by Next.js. Each reference must be a literal `process.env.NEXT_PUBLIC_FOO` string — dynamic access doesn't work. The package handles this by explicitly referencing each env var as a literal.

## Architecture

### Package structure

```
packages/app-config/
├── src/
│   ├── client.ts        # Reads NEXT_PUBLIC_* vars, validates, exports config
│   ├── server.ts        # Reads server-only secrets, validates, exports serverConfig
│   ├── schemas.ts       # Zod schemas for all env var groups
│   └── index.ts         # Re-exports client config + derived helpers
├── package.json
├── tsconfig.json
├── biome.json
└── vitest.config.ts
```

### Entry points

| Import path | File | Contains | Safe for client? |
|-------------|------|----------|-----------------|
| `@repo/app-config` | `src/index.ts` | `config` object + derived helpers | Yes |
| `@repo/app-config/server` | `src/server.ts` | `serverConfig` object | No — server only |

The split prevents server secrets from leaking into client bundles. Importing `@repo/app-config/server` in a `"use client"` component will cause a Next.js build error.

### Data flow

```
App starts
  → import "@repo/app-config"
    → client.ts reads process.env.NEXT_PUBLIC_* literals
    → Zod validates required vars (throws if missing)
    → Zod safe-parses optional vars (returns undefined if missing)
    → Computes derived helpers (isLocalhost, isProduction, analyticsEnabled)
    → Exports frozen config object

  → import "@repo/app-config/server" (in API routes only)
    → server.ts reads process.env.PREVIEW_TOKEN, REVALIDATE_TOKEN
    → Zod validates (throws if missing)
    → Exports frozen serverConfig object
```

## Type definitions

### `AppConfig`

```typescript
/** Client-safe configuration from NEXT_PUBLIC_* env vars. */
type AppConfig = {
  /** CMS connection settings — shape compatible with {@link ClientOptions} from `@repo/wagtail-api-client`. */
  cms: {
    /** Wagtail CMS base URL (e.g., `"https://cms.hse.ie"`). */
    baseURL: string;
    /** API version path (e.g., `"/api/v2"`). */
    apiPath: string;
  };
  /** Current deployment environment. */
  environment: "localhost" | "dev" | "pre-prod" | "prod";
  /** Public site URL for canonical links, sitemap, and OG tags (e.g., `"https://www.hse.ie"`). */
  siteUrl: string;
  /** Google Tag Manager container ID. `undefined` if not configured. */
  gtmId?: string;
  /** OneTrust cookie consent domain ID. `undefined` if not configured. */
  oneTrustDomainId?: string;
  /** Piwik Pro analytics settings. `undefined` if not configured. Both fields required if present. */
  piwik?: {
    /** Piwik Pro container ID. */
    containerId: string;
    /** Piwik Pro instance URL (e.g., `"https://hse.piwik.pro"`). */
    containerUrl: string;
  };
  /** `true` when environment is `"localhost"`. */
  isLocalhost: boolean;
  /** `true` when environment is `"prod"`. */
  isProduction: boolean;
  /** `true` when not localhost and at least one analytics integration is configured. */
  analyticsEnabled: boolean;
};
```

### `ServerConfig`

```typescript
/** Server-only secrets — never import in client components. */
type ServerConfig = {
  /** Shared secret for CMS preview API route authentication. */
  previewToken: string;
  /** Shared secret for CMS revalidation webhook authentication. */
  revalidateToken: string;
};
```

### Key design decisions

- **`cms` shape matches `ClientOptions`** — apps can do `new CMSClient(config.cms)` or `new CMSClient({ ...config.cms, init: { ... } })`. The config package does not import `@repo/wagtail-api-client` — compatibility is by convention, not by type dependency.
- **`piwik` is all-or-nothing** — the Zod schema requires both `containerId` and `containerUrl` if either is set. No half-configured Piwik.
- **Derived helpers are read-only** — `isLocalhost`, `isProduction`, `analyticsEnabled` are computed once at module level from the validated config.

## Zod schemas

```typescript
/** Schema for required client-side environment variables. */
const clientSchema = z.object({
  cms: z.object({
    baseURL: z.string().min(1),
    apiPath: z.string().min(1),
  }),
  environment: z.enum(["localhost", "dev", "pre-prod", "prod"]),
  siteUrl: z.string().url(),
});

/** Schema for optional GTM ID. */
const gtmSchema = z.string().min(1).optional();

/** Schema for optional OneTrust domain ID. */
const oneTrustSchema = z.string().min(1).optional();

/** Schema for optional Piwik Pro settings — both fields required if either is set. */
const piwikSchema = z
  .object({
    containerId: z.string().min(1),
    containerUrl: z.string().url(),
  })
  .optional();

// Piwik parsing logic: only validate if at least one Piwik env var is set.
// If one is set but not the other, the schema rejects it (both are required within the object).
// If neither is set, piwik is undefined.

/** Schema for required server-only secrets. */
const serverSchema = z.object({
  previewToken: z.string().min(1),
  revalidateToken: z.string().min(1),
});
```

## Validation behaviour

### Required variables

Validated via `schema.parse()` at module import time. If any required variable is missing or invalid, the module throws immediately with a descriptive Zod error. The app will not start.

**Required client vars:** `NEXT_PUBLIC_CMS_API_ENDPOINT`, `NEXT_PUBLIC_API_PATH`, `NEXT_PUBLIC_ENVIRONMENT_NAME`, `NEXT_PUBLIC_SITEURL`.

**Required server vars:** `PREVIEW_TOKEN`, `REVALIDATE_TOKEN`.

### Optional variables

Validated via `schema.safeParse()`. If not set or invalid, the config field is `undefined`. Never throws.

**Optional client vars:** `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_ONETRUST_DOMAIN_ID`, `NEXT_PUBLIC_PIWIK_CONTAINER_ID` + `NEXT_PUBLIC_PIWIK_CONTAINER_URL`.

### Test escape hatch

When `process.env.NODE_ENV === "test"`, validation is skipped entirely. The module exports a stub config with empty/default values:

```typescript
const TEST_CONFIG: AppConfig = {
  cms: { baseURL: "", apiPath: "" },
  environment: "localhost",
  siteUrl: "http://localhost:3000",
  isLocalhost: true,
  isProduction: false,
  analyticsEnabled: false,
};
```

Tests that need specific config values mock the module via `vi.mock("@repo/app-config", ...)`.

## Consumer usage

### CMS client setup (server component)

```typescript
import { config } from "@repo/app-config";
import { CMSClient } from "@repo/wagtail-api-client";

const client = new CMSClient(config.cms);
```

### Analytics in root layout

```typescript
import { GoogleTagManager } from "@next/third-parties/google";
import { config } from "@repo/app-config";

// In the layout JSX:
{config.gtmId && <GoogleTagManager gtmId={config.gtmId} />}
{config.piwik && (
  <PiwikProProvider
    containerId={config.piwik.containerId}
    containerUrl={config.piwik.containerUrl}
  >
    ...
  </PiwikProProvider>
)}
{config.oneTrustDomainId && <OneTrustScript domainId={config.oneTrustDomainId} />}
```

**OneTrust implementation note:** The OneTrust SDK loads via `next/script` with a `data-domain-script` attribute. The reference project's pattern:

```typescript
import Script from "next/script";

function OneTrust({ domainId }: { domainId: string }) {
  return (
    <>
      <Script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        data-document-language="true"
        type="text/javascript"
        data-domain-script={domainId}
      />
      <Script id="oneTrust" type="text/javascript">
        {`function OptanonWrapper() { }`}
      </Script>
    </>
  );
}
```

This component should live in a shared package (`@repo/hse-custom-ui` or a dedicated analytics package) to avoid duplication across apps. Check for well-maintained community packages before writing a custom wrapper.

### Preview API route (server-only)

```typescript
import { serverConfig } from "@repo/app-config/server";

export async function GET(request: Request) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== serverConfig.previewToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ...
}
```

### In tests

```typescript
// No env vars needed — validation skipped in NODE_ENV=test
import { config } from "@repo/app-config";
// config is a stub with defaults

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

## Environment variables reference

| Env var | Required | Type | Maps to |
|---------|----------|------|---------|
| `NEXT_PUBLIC_CMS_API_ENDPOINT` | Yes | `string` | `config.cms.baseURL` |
| `NEXT_PUBLIC_API_PATH` | Yes | `string` | `config.cms.apiPath` |
| `NEXT_PUBLIC_ENVIRONMENT_NAME` | Yes | `"localhost" \| "dev" \| "pre-prod" \| "prod"` | `config.environment` |
| `NEXT_PUBLIC_SITEURL` | Yes | `string` (URL) | `config.siteUrl` |
| `PREVIEW_TOKEN` | Yes | `string` | `serverConfig.previewToken` |
| `REVALIDATE_TOKEN` | Yes | `string` | `serverConfig.revalidateToken` |
| `NEXT_PUBLIC_GTM_ID` | No | `string` | `config.gtmId` |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | No | `string` | `config.oneTrustDomainId` |
| `NEXT_PUBLIC_PIWIK_CONTAINER_ID` | No | `string` | `config.piwik?.containerId` |
| `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | No | `string` (URL) | `config.piwik?.containerUrl` |

## `.env.example` for the template app

```
# Required — CMS
NEXT_PUBLIC_CMS_API_ENDPOINT=https://dev.cms.hse.ie
NEXT_PUBLIC_API_PATH=/api/v2
NEXT_PUBLIC_ENVIRONMENT_NAME=localhost
NEXT_PUBLIC_SITEURL=https://dev.hse.ie

# Required — server secrets
PREVIEW_TOKEN=your-preview-token
REVALIDATE_TOKEN=your-revalidate-token

# Optional — analytics/consent (not loaded in localhost)
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_ID=
NEXT_PUBLIC_PIWIK_CONTAINER_ID=
NEXT_PUBLIC_PIWIK_CONTAINER_URL=
```

## Dependencies

```json
{
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*"
  }
}
```

No dependency on `@repo/wagtail-api-client`. The `config.cms` shape is compatible by convention.

## Testing strategy

### Validation tests

- Required client vars present → returns typed `AppConfig` with correct values
- Missing `NEXT_PUBLIC_CMS_API_ENDPOINT` → throws with descriptive error
- Missing `NEXT_PUBLIC_API_PATH` → throws
- Missing `NEXT_PUBLIC_ENVIRONMENT_NAME` → throws
- Invalid `NEXT_PUBLIC_ENVIRONMENT_NAME` (e.g., `"staging"`) → throws
- Missing `NEXT_PUBLIC_SITEURL` → throws
- Invalid `NEXT_PUBLIC_SITEURL` (not a URL) → throws

### Optional variable tests

- `NEXT_PUBLIC_GTM_ID` not set → `config.gtmId` is `undefined`
- `NEXT_PUBLIC_GTM_ID` set → `config.gtmId` is the value
- Only `NEXT_PUBLIC_PIWIK_CONTAINER_ID` set (missing URL) → `config.piwik` is `undefined`
- Both Piwik vars set → `config.piwik` is `{ containerId, containerUrl }`
- `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` not set → `config.oneTrustDomainId` is `undefined`

### Derived helpers tests

- Environment `"localhost"` → `isLocalhost: true`, `isProduction: false`
- Environment `"prod"` → `isLocalhost: false`, `isProduction: true`
- Environment `"dev"` with GTM configured → `analyticsEnabled: true`
- Environment `"localhost"` with GTM configured → `analyticsEnabled: false`
- Environment `"dev"` with no analytics vars → `analyticsEnabled: false`

### Server config tests

- Both tokens present → returns typed `ServerConfig`
- Missing `PREVIEW_TOKEN` → throws
- Missing `REVALIDATE_TOKEN` → throws

### Test escape hatch

- When `NODE_ENV=test`, module exports stub config without throwing

## Out of scope

- No `CMSClient` instantiation — the package exports config values, not service instances
- No analytics/consent React components — those belong in a shared UI package or the app layer
- No `React.createContext` or providers — config is a plain module import
- No runtime config reloading — values are read once at import time
- No Google Maps API key or reCAPTCHA site key — will be added when needed (YAGNI)
