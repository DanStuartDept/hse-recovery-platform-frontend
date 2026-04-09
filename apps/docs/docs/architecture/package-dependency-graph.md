---
sidebar_position: 3
---

# Package Dependency Graph

This page shows which packages depend on which, derived from the `dependencies` and `devDependencies` fields in each workspace's `package.json`. Understanding the graph helps you predict what needs to be rebuilt or retested when you change a package.

---

## Dependency relationships

### Internal dependencies only

The table below lists every workspace member and the internal (`@repo/*` or `workspace:*`) packages it directly depends on at runtime.

| Package | Runtime depends on |
|---|---|
| `hse-multisite-template` | `@repo/app-config`, `@repo/i18n`, `@repo/logger`, `@repo/wagtail-api-client`, `@repo/wagtail-cms-mapping`, `@repo/wagtail-cms-types` |
| `@repo/wagtail-cms-mapping` | `@repo/wagtail-api-client`, `@repo/wagtail-cms-types` |
| `@repo/wagtail-api-client` | `@repo/logger` |
| `@repo/app-config` | _(none — only external `zod`)_ |
| `@repo/wagtail-cms-types` | _(none — only external `zod`)_ |
| `@repo/i18n` | _(none — peer deps on `next` and `react`)_ |
| `@repo/logger` | _(no internal dependencies)_ |

Config packages (`@repo/biome-config`, `@repo/typescript-config`, `@repo/vitest-config`, `@repo/commitlint-config`) appear only in `devDependencies` across the workspace. They have no runtime dependencies.

---

## Visualised graph

```
hse-multisite-template
├── @repo/app-config
│   └── zod
├── @repo/i18n
│   ├── @formatjs/intl-localematcher
│   └── negotiator
├── @repo/logger           ← compiled (bunchee)
├── @repo/wagtail-api-client  ← compiled (bunchee)
│   ├── @repo/logger
│   └── zod
├── @repo/wagtail-cms-mapping
│   ├── @repo/wagtail-api-client
│   ├── @repo/wagtail-cms-types
│   ├── @hseireland/hse-frontend-react
│   ├── html-react-parser
│   ├── next
│   ├── react
│   └── zod
└── @repo/wagtail-cms-types
    └── zod
```

Packages marked **compiled (bunchee)** must be built before any package that imports them. Turborepo handles this automatically via `"dependsOn": ["^build"]` on the `build`, `typecheck`, and `test` tasks.

---

## Build order

Turborepo derives the required build order from this graph. The topological sequence is:

1. `@repo/logger` (no internal deps — builds first)
2. `@repo/wagtail-api-client` (depends on `@repo/logger`)
3. `@repo/app-config`, `@repo/wagtail-cms-types`, `@repo/i18n` (no compiled deps — can build in parallel with step 1 or after)
4. `@repo/wagtail-cms-mapping` (depends on `@repo/wagtail-api-client` and `@repo/wagtail-cms-types`)
5. `hse-multisite-template` (depends on all of the above)

Source-only packages (no build step) don't block the queue — their `build` script is a no-op (`echo 'Source-only package — no build step'`), but they still participate in the `^build` chain so Turborepo's dependency resolution remains correct.

---

## Impact analysis

Use this table to understand what needs to be checked when you change a package.

| If you change... | Also check / rebuild... |
|---|---|
| `@repo/logger` | `@repo/wagtail-api-client` (depends on logger at runtime), `hse-multisite-template` (uses logger directly) |
| `@repo/wagtail-api-client` | `@repo/wagtail-cms-mapping` (depends on the client), `hse-multisite-template` (uses the client directly) |
| `@repo/wagtail-cms-types` | `@repo/wagtail-api-client` (uses types in devDeps), `@repo/wagtail-cms-mapping` (depends on types), `hse-multisite-template` |
| `@repo/wagtail-cms-mapping` | `hse-multisite-template` only |
| `@repo/app-config` | `hse-multisite-template` only |
| `@repo/i18n` | `hse-multisite-template` only |
| `@repo/typescript-config` | All packages using that tsconfig base (typecheck all) |
| `@repo/biome-config` | All packages using that Biome config (lint all) |
| `@repo/vitest-config` | All packages using `createVitestConfig()` (test all) |

Turborepo handles this automatically when you run tasks from the repo root — it computes the affected set from the changed files and only re-runs tasks for impacted workspaces.

---

## Key external dependencies

These external packages are shared across many workspaces via the `catalog:` mechanism.

| Package | Version | Used by |
|---|---|---|
| `zod` | 4.3.6 | `@repo/app-config`, `@repo/wagtail-cms-types`, `@repo/wagtail-api-client`, `@repo/wagtail-cms-mapping` |
| `next` | 16.2.2 | `hse-multisite-template`, `@repo/wagtail-cms-mapping`, `@repo/i18n` (peer) |
| `react` | 19.2.4 | `hse-multisite-template`, `@repo/wagtail-cms-mapping`, `@repo/i18n` (peer) |
| `vitest` | ^4.1.2 | All packages with tests |
| `@hseireland/hse-frontend` | 5.0.0 | `hse-multisite-template` |
| `@hseireland/hse-frontend-react` | 5.3.0 | `hse-multisite-template`, `@repo/wagtail-cms-mapping` |
| `bunchee` | ^6.4.0 | `@repo/logger`, `@repo/wagtail-api-client` (build only) |
