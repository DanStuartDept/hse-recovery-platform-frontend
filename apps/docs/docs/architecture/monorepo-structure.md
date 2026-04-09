---
sidebar_position: 1
---

# Monorepo Structure

This is a **pnpm + Turborepo monorepo**. All apps and packages live under the same Git repository and share a single `pnpm-lock.yaml`. Turborepo orchestrates builds, tests, and linting in dependency order and caches results so unchanged packages are never rebuilt.

## Directory layout

```
hse-multisite-frontend/
├── apps/
│   ├── hse-multisite-template/   # Next.js 16 / React 19 app
│   └── docs/                     # Docusaurus documentation site
├── packages/
│   ├── app-config/               # @repo/app-config
│   ├── wagtail-cms-client/       # @repo/wagtail-api-client
│   ├── wagtail-cms-types/        # @repo/wagtail-cms-types
│   ├── wagtail-cms-mapping/      # @repo/wagtail-cms-mapping
│   ├── i18n/                     # @repo/i18n
│   ├── logger/                   # @repo/logger
│   ├── biome-config/             # @repo/biome-config
│   ├── config-typescript/        # @repo/typescript-config
│   ├── config-vitest/            # @repo/vitest-config
│   └── commitlint-config/        # @repo/commitlint-config
├── pnpm-workspace.yaml
└── turbo.json
```

`pnpm-workspace.yaml` declares both `apps/*` and `packages/*` as workspace members. All versioned external dependencies are pinned in the `catalog:` section of that file and referenced from individual `package.json` files as `"catalog:"` — this ensures every package in the monorepo uses the same version of shared dependencies such as `react`, `next`, `zod`, and `vitest`.

---

## Apps

### `hse-multisite-template` (`apps/hse-multisite-template`)

npm name: `hse-multisite-template`

The production Next.js 16 / React 19 application. Uses App Router with Server Components by default. Consumes all `@repo/*` packages and both HSE design-system packages (`@hseireland/hse-frontend`, `@hseireland/hse-frontend-react`). This is the only workspace member that produces a deployable build artefact — either a `.next/standalone` output for Docker or a standard `.next` directory for Vercel/Node hosting.

---

## Runtime packages

These packages ship code that runs inside the app at runtime.

### `@repo/app-config` (`packages/app-config`)

**Build type:** source-only (no build step)

Centralises all environment-variable reading and validation using Zod. The `exports` map points directly at `.ts` source files:

- `.` → `src/index.ts` — exports `config`, a frozen `AppConfig` object holding all `NEXT_PUBLIC_*` values. Safe to import in Server and Client Components.
- `./server` → `src/server.ts` — exports `serverConfig` with `previewToken` and `revalidateToken`. **Never import this in client code.**

All env vars are validated at module import time; a missing required variable throws immediately rather than surfacing as a runtime `undefined`.

### `@repo/wagtail-api-client` (`packages/wagtail-cms-client`)

**Build type:** compiled with **bunchee** → ESM output at `dist/es/`

Provides `CMSClient` — the HTTP client for the Wagtail REST API. Key methods:

| Method | Description |
|---|---|
| `findPageByPath(path, init?)` | Fetches a page by its URL path via the Wagtail `find/` endpoint |
| `fetchPages(queries?, init?)` | Fetches a paginated list of published pages |
| `fetchPage(idOrSlug, queries?, init?)` | Fetches a single page by ID or slug |
| `fetchHeader(init?)` | Fetches the site header configuration snippet |
| `fetchFooter(init?)` | Fetches the site footer configuration snippet |
| `fetchImage(id, queries?, init?)` | Fetches a single image by ID |
| `fetchDocument(id, queries?, init?)` | Fetches a single document by ID |

Also exports utility functions: `isNotFound`, `logCmsError`, `slugToPath`, `extractPath`, and `buildQueryString`. The internal `fetchRequest` helper defaults to `next: { revalidate: 3600 }` on every fetch call, establishing the baseline ISR interval.

This is one of two packages that must be **built before** other packages can consume it (TypeScript resolves `dist/es/index.js`, not the source).

### `@repo/wagtail-cms-types` (`packages/wagtail-cms-types`)

**Build type:** source-only (no build step)

Zod-based CMS type definitions. The `exports` map exposes six sub-paths, each pointing at a `.ts` source file:

| Export path | Contents |
|---|---|
| `./blocks` | Zod schemas and TypeScript types for every content block |
| `./core` | Core API response shapes (`CMSPageContents`, `CMSPageContent`, `NotFoundContents`, etc.) |
| `./fields` | Reusable field schemas (images, documents, rich text, etc.) |
| `./page-models` | Typed page model union (`CMSPageProps`) |
| `./settings` | Header and footer API response types |
| `./snippets` | Snippet types used by the settings endpoints |

### `@repo/wagtail-cms-mapping` (`packages/wagtail-cms-mapping`)

**Build type:** source-only (no build step)

Maps Wagtail CMS data to React components via a factory pattern. The primary export is `createCMSRenderer(options)`, which returns `{ renderPage, renderBlocks, renderBlock }`. Also exports `generatePageMetadata` for translating CMS page fields into a Next.js `Metadata` object.

Sub-path exports:

| Export path | Contents |
|---|---|
| `.` | `createCMSRenderer`, `generatePageMetadata`, renderer types |
| `./blocks` | Default block component registry |
| `./pages` | Default page layout registry |
| `./types` | Renderer types (`CMSRenderer`, `CMSRendererOptions`, etc.) |

### `@repo/i18n` (`packages/i18n`)

**Build type:** source-only (no build step)

Locale-aware routing, dictionary loading, and translation utilities. Key exports:

- `createI18nProxy(config)` — Next.js middleware factory for locale detection, URL rewriting, and redirects
- `loadDictionary(locale, loaders, defaultLocale?)` — merges shared and app dictionaries into a flat `Record<string, string>`
- `getDictionary(locale, loaders, defaultLocale?)` — as above but returns an unflattened nested object
- `DictionaryProvider` / `useDictionary` — React context pair for client components
- `interpolate`, `plural`, `rich` — string formatting helpers

Declares `next` and `react` as `peerDependencies` rather than direct dependencies to avoid version conflicts.

### `@repo/logger` (`packages/logger`)

**Build type:** compiled with **bunchee** → ESM output at `dist/es/`

Structured console logger. Exports `log`, `warn`, and `error` functions. Intended to be extended in consuming apps to forward messages to an external log drain. Like `@repo/wagtail-api-client`, it must be **built first** — other packages resolve its `dist/es/index.js` entry point.

---

## Config packages

These packages contain shared tooling configuration. They have no runtime code and no build step.

| npm name | Path | Purpose |
|---|---|---|
| `@repo/biome-config` | `packages/biome-config` | Shared Biome rule sets (`base.json`, `next.json`, `react-internal.json`) |
| `@repo/typescript-config` | `packages/config-typescript` | Shared `tsconfig` bases (`base.json`, `nextjs.json`, `react-library.json`) |
| `@repo/vitest-config` | `packages/config-vitest` | `createVitestConfig()` factory and shared mocks |
| `@repo/commitlint-config` | `packages/commitlint-config` | Conventional Commits rule set for commitlint |

---

## Dependency conventions

### Internal packages

All internal package references use the `workspace:*` protocol:

```json
"@repo/logger": "workspace:*"
```

This tells pnpm to always resolve to the local workspace copy, regardless of the version field in the dependency's `package.json`.

### External versions (catalog)

Shared external dependencies are pinned in `pnpm-workspace.yaml` under the `catalog:` key and referenced as `"catalog:"` in individual `package.json` files:

```yaml
# pnpm-workspace.yaml
catalog:
  next: 16.2.2
  react: 19.2.4
  zod: 4.3.6
```

```json
// any package.json
"next": "catalog:"
```

This guarantees that every package in the monorepo uses identical versions of these critical dependencies and makes version upgrades a single-line change in `pnpm-workspace.yaml`.

### HSE design-system packages

`@hseireland/hse-frontend` and `@hseireland/hse-frontend-react` are hosted on **GitHub Packages** at `https://npm.pkg.github.com`. The `.npmrc` file at the repo root configures the scoped registry:

```
@hseireland:registry=https://npm.pkg.github.com
```

Authentication requires an `NPM_TOKEN` environment variable with `read:packages` scope — set locally in your shell profile and passed as a Docker build secret in CI.
