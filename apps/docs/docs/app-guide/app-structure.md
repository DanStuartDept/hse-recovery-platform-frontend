---
sidebar_position: 1
---

# App Structure

The Next.js app lives at `apps/hse-multisite-template/`. All application source code is under `src/`.

## Directory layout

```
apps/hse-multisite-template/
├── src/
│   ├── app/                   # Next.js App Router route tree
│   ├── components/            # App-specific React components
│   ├── dictionaries/          # i18n JSON translation files
│   ├── lib/                   # App-local utilities and config
│   └── styles/                # SCSS stylesheets
├── next.config.ts             # Next.js configuration
├── security-headers.ts        # CSP and HTTP security header builder
└── Dockerfile                 # Container image (build from repo root)
```

## `src/app/`

The App Router route tree. Routes are defined by directory structure; each directory that contains a `page.tsx` becomes a URL segment.

| Path | Purpose |
|---|---|
| `[lang]/layout.tsx` | Root layout — HTML shell, header, footer, i18n provider, analytics scripts |
| `[lang]/[[...slug]]/page.tsx` | Catch-all route — fetches and renders any CMS page |
| `[lang]/error.tsx` | Route-level error boundary (client component, translatable) |
| `[lang]/not-found.tsx` | 404 page (client component, translatable) |
| `global-error.tsx` | Root error boundary — catches errors that escape the lang layout |
| `api/revalidate/route.ts` | Webhook endpoint for on-demand ISR cache invalidation |
| `robots.ts` | Generates `robots.txt` via Next.js Metadata API |
| `sitemap.ts` | Generates `sitemap.xml` from the CMS pages API |
| `favicon.ico` | Browser tab icon fallback |

## `src/components/`

App-specific React components. Each component lives in its own folder with a barrel `index.ts` export.

| Folder | Contents |
|---|---|
| `scripts/` | Conditional analytics scripts — `GtmScripts`, `OneTrustScripts`, `PiwikProScripts` |
| `site-header/` | `SiteHeader` — renders CMS-driven header navigation |
| `site-footer/` | `SiteFooter` — renders CMS-driven footer content |

## `src/dictionaries/`

JSON translation files loaded at runtime by `@repo/i18n`. One file per locale.

| File | Locale |
|---|---|
| `en.json` | English (default) |
| `ga.json` | Irish (Gaeilge) |

The dictionary shape is typed via `src/lib/i18n/dictionary.ts`, which exports the `Dictionary` type used with `useDictionary<Dictionary>()`.

## `src/lib/`

App-local utilities — thin wrappers and configuration objects that integrate the shared packages into this specific app.

| File | Purpose |
|---|---|
| `cms/client.ts` | Constructs the shared `CMSClient` instance from `@repo/app-config` env vars |
| `i18n/config.ts` | Defines supported locales (`en`, `ga`) and the default locale |
| `i18n/loaders.ts` | Maps locale codes to dynamic `import()` calls for dictionary JSON files |
| `i18n/dictionary.ts` | TypeScript type for the app's dictionary shape |
| `one-trust.ts` | OneTrust consent utility helpers |

## `src/styles/`

SCSS entry points imported by the root layout.

| File | Purpose |
|---|---|
| `main.scss` | Primary stylesheet — imports the HSE design system (`@hseireland/hse-frontend`) |
| `_footer.scss` | Footer-specific style overrides |

## Top-level files

**`next.config.ts`** — Sets `output: "standalone"`, `trailingSlash: true`, remote image patterns from `@repo/app-config`, localhost fetch logging, and wires `security-headers.ts` into the `headers()` hook.

**`security-headers.ts`** — Builds the Content Security Policy and all other HTTP security headers dynamically based on which third-party integrations are configured. See [Security Headers](./security-headers.md) for details.

**`Dockerfile`** — Multi-stage build using `turbo prune --docker`. Must be run from the monorepo root using `-f apps/hse-multisite-template/Dockerfile`.
