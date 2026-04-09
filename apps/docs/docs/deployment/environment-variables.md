---
sidebar_position: 1
---

# Environment Variables

All environment variables are validated at startup by `@repo/app-config` using Zod schemas. Missing or invalid required variables cause the application to throw at import time — configuration errors surface immediately rather than causing silent failures at runtime.

The package exposes two entry points:

- `@repo/app-config` — client-safe config, safe to import anywhere
- `@repo/app-config/server` — server-only secrets, never import in Client Components

## Required variables

These must be present or the application will not start.

| Variable | Build-time | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_CMS_API_ENDPOINT` | Yes | — | Wagtail CMS base URL, e.g. `https://cms.hse.ie` |
| `NEXT_PUBLIC_API_PATH` | Yes | — | Wagtail REST API version path, e.g. `/api/v2` |
| `NEXT_PUBLIC_ENVIRONMENT_NAME` | Yes | — | Deployment environment: `localhost`, `dev`, `pre-prod`, or `prod` |
| `NEXT_PUBLIC_SITEURL` | Yes | — | Public site URL for canonical links, sitemaps, and OG tags, e.g. `https://www.hse.ie` |
| `PREVIEW_TOKEN` | No | — | Shared secret for CMS preview API route authentication |
| `REVALIDATE_TOKEN` | No | — | Shared secret for the on-demand revalidation webhook (`/api/revalidate/`) |

## Optional variables

If omitted, the corresponding feature is disabled. Invalid values are silently ignored (the feature is treated as unconfigured rather than crashing the app).

| Variable | Build-time | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | Yes | — | Google Tag Manager container ID. Analytics are only activated when `NEXT_PUBLIC_ENVIRONMENT_NAME` is not `localhost`. |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | Yes | — | OneTrust cookie consent domain ID. CSP headers add the OneTrust domains automatically when this is set. |
| `NEXT_PUBLIC_PIWIK_CONTAINER_ID` | Yes | — | Piwik Pro container ID. Both Piwik variables must be set together or neither is used. |
| `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | Yes | — | Piwik Pro instance URL. Both Piwik variables must be set together or neither is used. |
| `NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS` | Yes | — | Comma-separated list of hostnames for Next.js `images.remotePatterns`, e.g. `assets.hse.ie,cdn.example.com`. |

## Build-time vs runtime

`NEXT_PUBLIC_*` variables are **inlined by Next.js at build time**. This means:

- They must be provided as `--build-arg` values when building the Docker image.
- Changing them requires a new build — you cannot override them at `docker run` time.
- They are visible in the compiled JavaScript bundle (do not use them for secrets).

Variables without the `NEXT_PUBLIC_` prefix (`PREVIEW_TOKEN`, `REVALIDATE_TOKEN`) are **runtime environment variables**. Pass them via `-e` or `--env-file` when running the container. They are only accessible in Server Components, Route Handlers, and API routes.

## Sample `.env.local`

For local development, create a `.env.local` file in `apps/hse-multisite-template/`. This file is gitignored.

```bash
# Required — client-safe (inlined at build time by Next.js)
NEXT_PUBLIC_CMS_API_ENDPOINT=https://cms-dev.hse.ie
NEXT_PUBLIC_API_PATH=/api/v2
NEXT_PUBLIC_ENVIRONMENT_NAME=localhost
NEXT_PUBLIC_SITEURL=http://localhost:3000

# Required — server-only secrets (never prefix with NEXT_PUBLIC_)
PREVIEW_TOKEN=replace-with-a-strong-secret
REVALIDATE_TOKEN=replace-with-a-strong-secret

# Optional — analytics (disabled automatically on localhost)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_ONETRUST_DOMAIN_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional — Piwik Pro (both or neither)
NEXT_PUBLIC_PIWIK_CONTAINER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PIWIK_CONTAINER_URL=https://yourorg.piwik.pro

# Optional — remote images
NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS=assets.hse.ie,cdn.example.com
```

> **Note:** Never commit `.env.local` or any file containing real secrets. The `.gitignore` already excludes `.env*.local` files.

## Derived config properties

`@repo/app-config` computes several derived properties from the raw variables so application code does not need to repeat the same conditional logic:

| Property | Type | Description |
|---|---|---|
| `config.isLocalhost` | `boolean` | `true` when `NEXT_PUBLIC_ENVIRONMENT_NAME` is `"localhost"` |
| `config.isProduction` | `boolean` | `true` when `NEXT_PUBLIC_ENVIRONMENT_NAME` is `"prod"` |
| `config.analyticsEnabled` | `boolean` | `true` when not localhost and at least one analytics integration (GTM, OneTrust, or Piwik) is configured |

## Reading config in app code

```ts
// Client-safe — import anywhere
import { config } from "@repo/app-config";

const apiUrl = `${config.cms.baseURL}${config.cms.apiPath}`;

// Server-only — only in Server Components, Route Handlers, server actions
import { serverConfig } from "@repo/app-config/server";

const isValidToken = token === serverConfig.revalidateToken;
```

Never read `process.env` directly in application code. All access should go through `@repo/app-config`.
