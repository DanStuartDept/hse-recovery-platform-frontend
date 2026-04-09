---
sidebar_position: 9
---

# Security Headers

Security headers are defined in `apps/hse-multisite-template/security-headers.ts` and applied to every route via the `headers()` hook in `next.config.ts`.

## How headers are applied

`next.config.ts` imports `securityHeaders` and attaches them to all routes:

```ts
import { securityHeaders } from "./security-headers";

async headers() {
  return [{ source: "/:path*", headers: securityHeaders }];
}
```

## Static headers

The following headers are unconditional — they are always set regardless of which integrations are configured:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS for 1 year across all subdomains |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Blocks the site from being embedded in iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information sent to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables browser feature access |

## Content Security Policy

The CSP is the most complex header. It is built dynamically by `buildCSP()` at module evaluation time (i.e., at Next.js startup / build time). The policy only includes domains for integrations that are actually configured.

### Integration detection

```ts
const hasGtm = !!process.env.NEXT_PUBLIC_GTM_ID;
const hasOneTrust = !!process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID;
const hasPiwik = !!process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID;
```

Each flag is read from the same env vars used by the script components. If an env var is not set, the integration's domains are omitted from every CSP directive.

### Domain sets per integration

**GTM domains** (added when `NEXT_PUBLIC_GTM_ID` is set):
- `script-src`: `*.googletagmanager.com`
- `img-src`: `*.googletagmanager.com`, `*.google-analytics.com`
- `connect-src`: `*.google-analytics.com`

**OneTrust domains** (added when `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` is set):
- `script-src`: `*.cookielaw.org`, `*.onetrust.com`
- `img-src`: `*.cookielaw.org`, `*.onetrust.com`
- `style-src`: `*.cookielaw.org`
- `connect-src`: `*.cookielaw.org`, `*.onetrust.com`

**Piwik Pro domains** (added when `NEXT_PUBLIC_PIWIK_CONTAINER_ID` is set):
- `script-src`: `*.containers.piwik.pro`, `*.piwik.pro`, and optionally the specific `NEXT_PUBLIC_PIWIK_CONTAINER_URL` origin if it is not already covered by the wildcard domains.
- `connect-src`: same domains as `script-src`

The `getPiwikDomains()` function handles the custom container URL case:

```ts
function getPiwikDomains(): { script: string[]; connect: string[] } {
  const defaults = ["*.containers.piwik.pro", "*.piwik.pro"];
  const containerUrl = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL;

  if (!containerUrl) return { script: defaults, connect: defaults };

  try {
    const { origin } = new URL(containerUrl);
    const domains = defaults.includes(origin)
      ? defaults
      : [...defaults, origin];
    return { script: domains, connect: domains };
  } catch {
    return { script: defaults, connect: defaults };
  }
}
```

### Base CSP directives

The following directives are always present, with integration domains added on top:

```
default-src  'self'
script-src   'self' 'unsafe-inline' [dev: 'unsafe-eval'] [integration domains]
style-src    'self' 'unsafe-inline' [onetrust style domains]
img-src      'self' data: *.hse.ie [integration domains]
connect-src  'self' *.hse.ie [integration domains]
frame-src    'self' *.youtube-nocookie.com *.google.com
font-src     'self' data:
base-uri     'self'
form-action  'self'
frame-ancestors 'none'
```

Notes on specific directives:
- `'unsafe-inline'` in `script-src` is required for GTM and OneTrust inline script snippets. It is present unconditionally.
- `'unsafe-eval'` is added to `script-src` only in development (`NODE_ENV === "development"`) — React 19 requires `eval()` for enhanced stack traces in dev mode.
- `frame-ancestors: 'none'` reinforces `X-Frame-Options: DENY`.
- `*.hse.ie` in `img-src` and `connect-src` allows the app to fetch images and data from other HSE domains (e.g., the CMS API, media CDN).

## Development vs production

In development (`NODE_ENV === "development"`), `'unsafe-eval'` is added to `script-src`. This is the only CSP difference between environments. The `config.isLocalhost` flag in the script components suppresses all analytics scripts in local development — so analytics domains may appear in the CSP policy but the scripts that use them will not load.

## Testing the CSP

The CSP is tested in `security-headers.test.ts`. Run from the app directory:

```bash
cd apps/hse-multisite-template && pnpm vitest run security-headers.test.ts
```

The tests validate that `buildCSP()` produces well-formed output and that integration domains appear (or do not appear) based on the env vars set during the test run.
