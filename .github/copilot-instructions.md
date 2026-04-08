# Project Guidelines

## Overview

`hse-multisite-frontend` is a **pnpm + Turborepo monorepo** that builds a Next.js application. It integrates with a **Wagtail CMS** backend via a shared typed client and type definitions.

## Packages

| Name (npm) | Path | Purpose |
|---|---|---|
| `hse-multisite-template` | `apps/hse-multisite-template` | Next.js 16 app — primary UI |
| `@repo/app-config` | `packages/app-config` | Centralised env var validation and typed config (source-only) |
| `@repo/wagtail-api-client` | `packages/wagtail-cms-client` | Wagtail REST API client (`CMSClient` class + `fetchContent` helpers) |
| `@repo/wagtail-cms-types` | `packages/wagtail-cms-types` | Zod-based TypeScript types for all Wagtail content (no build — exports raw `.ts`) |
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | CMS-to-component mapping — factory pattern with HSE design system defaults |
| `@repo/i18n` | `packages/i18n` | Locale routing, dictionary loading, translation helpers (source-only) |
| `@repo/logger` | `packages/logger` | Thin console wrapper |
| `@repo/vitest-config` | `packages/config-vitest` | Shared `createVitestConfig()` factory |
| `@repo/biome-config` | `packages/biome-config` | Shared Biome rule sets |
| `@repo/typescript-config` | `packages/config-typescript` | Shared `tsconfig` bases |

## Build & Test

All commands run via Turbo from the repo root; Turbo respects build dependency order automatically.

```bash
pnpm install          # install all workspace deps
pnpm build            # build all packages/apps in dependency order
pnpm dev              # start dev servers (persistent, no cache)
pnpm test             # vitest run (after ^build)
pnpm test:ci          # vitest run --coverage (outputs coverage/**)
pnpm lint             # biome check --write across workspace
pnpm typecheck        # tsc --noEmit (app runs next typegen first)
```

## Architecture

- **Next.js App Router** (Next.js 16 / React 19). Use Server Components by default; add `"use client"` only when interactivity, hooks, or browser APIs are required.
- **Wagtail CMS integration**: fetch content via `CMSClient` from `@repo/wagtail-api-client`. All response shapes are typed through `@repo/wagtail-cms-types` (sub-path exports: `/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`).
- **Design system**: `@hseireland/hse-frontend` (CSS/tokens) and `@hseireland/hse-frontend-react` (React components) are the HSE Ireland UI library — use their components before writing custom ones.
- **i18n**: `@repo/i18n` handles locale routing (hidden default locale, `Accept-Language` negotiation), dictionary loading (shared + app layers), and client-side translation (`DictionaryProvider` / `useDictionary`).
- **Third-party scripts**: OneTrust, GTM, and Piwik are gated on `@repo/app-config` env vars. CSP headers in `security-headers.ts` are built dynamically per integration.
- **Forms**: `react-hook-form` + `@hookform/resolvers` + Zod schemas.

## Conventions

### Dependency declarations

- Internal workspace packages: `"workspace:*"` protocol.
- Pinned external versions live in `pnpm-workspace.yaml` under `catalog:` — reference them as `"catalog:"` in `package.json`, not a version string.

### Library packages (`@repo/wagtail-api-client`)

- Built with **bunchee** → dual ESM (`dist/es/`) + CJS (`dist/cjs/`) output.
- TypeScript import paths must use `.js` extensions (e.g., `"./lib/index.js"`).
- `@repo/wagtail-cms-types` is **source-only** (no build step) — its `exports` map points directly at `.ts` files.

### Code style

- **Biome v2** (`@biomejs/biome`) — linter + formatter for all `.ts`/`.tsx`. No ESLint.
- Formatter: **tabs**, indent-width 2, line-width **120**.
- `pnpm run lint` auto-fixes; run it before committing.
- Prettier is used only for `.md` files (`pnpm format`).

### Testing

- **Vitest 3** with `@vitest/coverage-v8`. Use `createVitestConfig()` from `@repo/vitest-config`.
- Default environment is `jsdom`; pass `environment: 'node'` for server-only packages.
- CI coverage output goes to `coverage/` — included in Turbo `test:ci` output cache.

### TypeScript

- Extend shared configs from `@repo/typescript-config` (`base.json`, `nextjs.json`, etc.).
- Strict mode everywhere. Avoid `any`.

## Scoped Instructions

Additional instructions activate based on file patterns — see `.github/instructions/`.

## Agents

Specialized agents are available in `.github/agents/`. Invoke them by name in Copilot chat (e.g., `@a11y-reviewer`, `@cms-specialist`).

## Skills

Portable skills in `.github/skills/` teach domain-specific workflows (CMS content fetching, HSE design system, conventional commits).
