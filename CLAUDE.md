# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root via Turborepo:

```bash
pnpm install          # install all workspace deps
pnpm build            # build all packages/apps in dependency order
pnpm dev              # start all dev servers (persistent, no cache)
pnpm test             # vitest run (all packages, requires ^build)
pnpm test:ci          # vitest run --coverage
pnpm lint             # biome check --write (auto-fixes .ts/.tsx)
pnpm typecheck        # tsc --noEmit across workspace
pnpm format           # prettier --write (Markdown files only)
```

Filter to a single workspace:

```bash
turbo run dev --filter=hse-multisite-template
turbo run test --filter=@repo/wagtail-api-client
```

Run a single test file (from a package directory):

```bash
cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetchContent.test.ts
```

## Architecture

This is a **pnpm + Turborepo monorepo** with a Next.js 16 app integrating with a **Wagtail CMS** backend.

### Workspace layout

| npm name                    | Path                           | Role                                                          |
| --------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `hse-multisite-template`    | `apps/hse-multisite-template`  | Next.js 16 / React 19 App Router app                          |
| `@repo/app-config`          | `packages/app-config`          | Centralised env var validation and typed config (source-only) |
| `@repo/wagtail-api-client`  | `packages/wagtail-cms-client`  | Wagtail REST client (`CMSClient` + `fetchContent`)            |
| `@repo/wagtail-cms-types`   | `packages/wagtail-cms-types`   | Zod-based CMS types (source-only, no build step)              |
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | CMS-to-component mapping (source-only, factory pattern)       |
| `@repo/i18n`                | `packages/i18n`                | Locale routing, dictionary loading, translation helpers        |
| `@repo/logger`              | `packages/logger`              | Thin console wrapper                                          |
| `@repo/vitest-config`       | `packages/config-vitest`       | Shared `createVitestConfig()` factory                         |
| `@repo/biome-config`        | `packages/biome-config`        | Shared Biome rule sets                                        |
| `@repo/typescript-config`   | `packages/config-typescript`   | Shared tsconfig bases                                         |
| `@repo/commitlint-config`   | `packages/commitlint-config`   | Conventional commits config                                   |

### Key architectural decisions

- **Server Components by default**. Add `"use client"` only when hooks, interactivity, or browser APIs are needed.
- **App configuration**: `@repo/app-config` centralises env var reading with Zod validation. Import `config` for client-safe settings, `serverConfig` from `@repo/app-config/server` for secrets. Never read `process.env` directly in app code.
- **CMS content flow**: `CMSClient` (from `@repo/wagtail-api-client`) fetches data using `config.cms` from `@repo/app-config`; response shapes validated via Zod schemas in `@repo/wagtail-cms-types`; `createCMSRenderer` (from `@repo/wagtail-cms-mapping`) maps data to React components.
- **Design system**: `@hseireland/hse-frontend` (CSS/tokens) + `@hseireland/hse-frontend-react` (React components). Use these before writing custom components.
- **i18n**: `@repo/i18n` provides locale-aware routing (`createI18nProxy`), dictionary loading (`getDictionary`), and client-side translation (`DictionaryProvider` / `useDictionary`). Default locale (`en-ie`) is hidden from URLs; non-default locales get a prefix (`/ga/`).
- **Third-party scripts**: OneTrust cookie consent, GTM, and Piwik are gated on `@repo/app-config` env vars and `config.isLocalhost`. CSP headers in `security-headers.ts` are built dynamically — domains are only added when the corresponding integration is configured.
- **Forms**: `react-hook-form` + `@hookform/resolvers` + Zod schemas.

### Dependency conventions

- Internal packages: `"workspace:*"` protocol.
- Pinned external versions: defined in `pnpm-workspace.yaml` `catalog:`, referenced as `"catalog:"` in package.json.
- HSE design system packages come from GitHub Packages (`@hseireland:registry=https://npm.pkg.github.com` in `.npmrc`).

### Library build conventions

- `@repo/wagtail-api-client` and `@repo/logger`: built with **bunchee** to dual ESM (`dist/es/`) + CJS (`dist/cjs/`) output. TypeScript imports use `.js` extensions.
- `@repo/wagtail-cms-types`: **source-only** -- `exports` map points directly at `.ts` files (no build step).
- `@repo/wagtail-cms-mapping`: **source-only** -- `exports` map points directly at `.ts`/`.tsx` files (no build step). Factory pattern maps CMS data to React components.

## Code style

- **Biome v2** for linting + formatting (no ESLint). Tabs, indent-width 2, line-width 120.
- `pnpm lint` auto-fixes; run before committing.
- Commits follow **Conventional Commits** (enforced by commitlint).
- TypeScript strict mode everywhere. Avoid `any`.
- Shared tsconfig bases from `@repo/typescript-config` (`base.json`, `nextjs.json`, `vite.json`, `react-library.json`).

## Testing

- **Vitest** with `@vitest/coverage-v8`. Use `createVitestConfig()` from `@repo/vitest-config`.
- Default test environment: `jsdom`. Pass `environment: 'node'` for server-only packages.
- App path alias: `@/*` maps to `./src/*`.

## Requirements

- Node.js >= 24
- pnpm 10.33.0 (pinned via `packageManager` field)
