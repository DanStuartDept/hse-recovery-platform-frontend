---
sidebar_position: 4
---

# Project Overview

## What this is

The HSE Multisite Frontend is a **pnpm + Turborepo monorepo** that provides the frontend platform for HSE Ireland's multisite web presence. It contains:

- A **Next.js 16 / React 19** web application backed by a **Wagtail CMS** headless API
- A set of shared internal packages (CMS client, types, mapping, i18n, config, logger)
- Tooling and config packages shared across all workspaces
- This documentation site

The monorepo is designed to be forked or templated per-site. All site-specific configuration (CMS endpoint, analytics IDs, etc.) lives in environment variables — the codebase itself is environment-agnostic.

## Why a monorepo

Keeping the app and its internal packages in one repo gives several practical benefits:

- **Atomic changes** — a CMS API change that touches the type package, the client package, and the app can land in a single commit and PR
- **Single lockfile** — all packages share one `pnpm-lock.yaml`, so dependency versions are consistent and auditable in one place
- **Turborepo caching** — task outputs (builds, type checks, tests) are cached by input hash. Unchanged packages are never rebuilt. Remote caching lets CI and team members share those caches
- **Shared tooling** — Biome config, TypeScript tsconfig bases, Vitest config, and commitlint config are packages in the monorepo, so updates to linting rules or compiler settings propagate everywhere at once

## Tech stack

| Concern | Technology |
|---|---|
| Web framework | Next.js 16 (App Router, `output: "standalone"`) |
| UI library | React 19 |
| Language | TypeScript 5 (strict mode) |
| CMS backend | Wagtail (headless REST API v2) |
| Schema validation | Zod 4 |
| Design system | `@hseireland/hse-frontend` (CSS) + `@hseireland/hse-frontend-react` (React components) |
| Package manager | pnpm 10.33.0 (Corepack) |
| Task runner | Turborepo 2 |
| Linter / formatter | Biome v2 (no ESLint, no Prettier for code) |
| Testing | Vitest 4 + `@vitest/coverage-v8` + Testing Library |
| Internationalisation | Custom `@repo/i18n` package (locale routing + dictionary loading) |
| Containerisation | Docker (multi-stage, standalone output) |
| Commit convention | Conventional Commits (enforced by commitlint + Husky) |

## Workspace layout

| npm name | Path | Role |
|---|---|---|
| `hse-multisite-template` | `apps/hse-multisite-template` | Next.js 16 / React 19 App Router application |
| `docs` | `apps/docs` | This Docusaurus documentation site |
| `@repo/app-config` | `packages/app-config` | Centralised env var validation and typed config |
| `@repo/wagtail-api-client` | `packages/wagtail-cms-client` | Wagtail REST client (`CMSClient` + `fetchContent`) |
| `@repo/wagtail-cms-types` | `packages/wagtail-cms-types` | Zod-based CMS response types |
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | Maps CMS block data to React components |
| `@repo/i18n` | `packages/i18n` | Locale routing, dictionary loading, translation helpers |
| `@repo/logger` | `packages/logger` | Structured console logger (`log`, `warn`, `error`) |
| `@repo/vitest-config` | `packages/config-vitest` | Shared `createVitestConfig()` factory |
| `@repo/biome-config` | `packages/biome-config` | Shared Biome rule sets |
| `@repo/typescript-config` | `packages/config-typescript` | Shared tsconfig bases |
| `@repo/commitlint-config` | `packages/commitlint-config` | Conventional Commits config |

## Where to go next

- **[Architecture](../architecture/monorepo-structure)** — detailed explanations of the CMS content flow, caching strategy, i18n routing, and configuration model
- **[Installation](./installation.md)** — step-by-step setup instructions
- **[Running Locally](./running-locally.md)** — starting dev servers and working with environment variables
