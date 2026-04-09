---
sidebar_position: 3
---

# Running Locally

## Environment variables

The Next.js app validates all configuration at startup via `@repo/app-config`. Missing required variables cause a hard error — the app will not start.

Copy the example file to create your local env file:

```bash
cp apps/hse-multisite-template/.env.example apps/hse-multisite-template/.env.local
```

`.env.local` is gitignored. Below is a description of every variable.

### Required variables

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_CMS_API_ENDPOINT` | `https://dev.cms.hse.ie` | Base URL of the Wagtail CMS instance |
| `NEXT_PUBLIC_API_PATH` | `/api/v2` | Path prefix for the Wagtail REST API |
| `NEXT_PUBLIC_ENVIRONMENT_NAME` | `localhost` | Deployment environment. One of: `localhost`, `dev`, `pre-prod`, `prod` |
| `NEXT_PUBLIC_SITEURL` | `https://dev.hse.ie` | Public site URL used for canonical links, the sitemap, and OG tags |
| `PREVIEW_TOKEN` | `your-preview-token` | Shared secret authenticating the CMS preview API route. Server-only — never use `NEXT_PUBLIC_` prefix. |
| `REVALIDATE_TOKEN` | `your-revalidate-token` | Shared secret authenticating the CMS revalidation webhook. Server-only. |

### Optional variables

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` | Google Tag Manager container ID. Analytics are disabled on `localhost`. |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | OneTrust cookie consent domain ID. Disabled on `localhost`. |
| `NEXT_PUBLIC_PIWIK_CONTAINER_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Piwik Pro container ID. Both Piwik vars must be set together. |
| `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | `https://yourorg.piwik.pro` | Piwik Pro instance URL. |
| `NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS` | `assets.hse.ie` | Comma-separated hostnames for Next.js image optimisation (`images.remotePatterns`). |

> **Client vs server variables.** Variables prefixed `NEXT_PUBLIC_` are inlined by the Next.js compiler and are safe to use in both Server and Client Components. Variables without the prefix (`PREVIEW_TOKEN`, `REVALIDATE_TOKEN`) are server-only secrets — import them via `serverConfig` from `@repo/app-config/server`, never read `process.env` directly.

> **Analytics on localhost.** When `NEXT_PUBLIC_ENVIRONMENT_NAME=localhost`, all analytics integrations (GTM, OneTrust, Piwik) are automatically disabled regardless of whether their env vars are set. CSP headers are also relaxed on localhost to aid debugging.

## Starting all dev servers

From the repo root:

```bash
pnpm dev
```

Turborepo runs the `dev` task across all workspaces concurrently. The task is marked `persistent: true` and `cache: false` in `turbo.json`, so it runs indefinitely and is never served from cache.

What starts:

- **`hse-multisite-template`** — Next.js dev server, typically at `http://localhost:3000`
- **`apps/docs`** — Docusaurus dev server (this site), typically at `http://localhost:3001`

Turborepo's TUI (`"ui": "tui"` in `turbo.json`) shows interleaved output from all running processes in a single terminal session.

## Filtering to a single workspace

If you only need to run one app or package, use Turborepo's `--filter` flag:

```bash
# Run only the Next.js app
turbo run dev --filter=hse-multisite-template

# Run only the docs site
turbo run dev --filter=docs
```

Filtering is useful when you want a faster startup or need to keep terminal output clean.

## Hot reload behaviour

### Next.js app (`hse-multisite-template`)

Next.js Fast Refresh handles changes to files inside `apps/hse-multisite-template/src/`. Changes are reflected in the browser without a full page reload.

### Source-only packages

The following packages are **source-only** — they have no build step and their TypeScript is transpiled directly by the consuming app:

- `@repo/app-config`
- `@repo/wagtail-cms-types`
- `@repo/wagtail-cms-mapping`
- `@repo/i18n`

Changes to files in these packages are picked up automatically by the Next.js dev server's module graph. No rebuild is required.

### Built packages (require rebuild)

Two packages produce compiled `dist/` output via bunchee:

- `@repo/wagtail-api-client` (`packages/wagtail-cms-client`)
- `@repo/logger` (`packages/logger`)

The dev server does **not** watch these packages. If you modify source in either package, you must rebuild it before your changes take effect in the app:

```bash
# Rebuild a single built package
turbo run build --filter=@repo/wagtail-api-client

# Or rebuild everything
pnpm build
```

After rebuilding, the Next.js dev server will pick up the updated `dist/` output on the next module load.

## Fetch logging

In the `localhost` environment, `next.config.ts` enables `logging.fetches.fullUrl: true`. This prints the full URL of every `fetch()` call (including cache status) to the terminal, which is useful for debugging CMS requests and cache behaviour.
