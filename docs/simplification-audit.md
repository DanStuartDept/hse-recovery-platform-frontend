# Simplification Audit

Findings from a code reuse, quality, and efficiency audit of the monorepo. Items are grouped by category and prioritised within each group.

## Summary

| # | Item | Severity | Packages affected |
|---|------|----------|-------------------|
| 1 | [`buildQueryString` lacks URL encoding](#1-buildquerystring-lacks-url-encoding) | Bug | `wagtail-cms-client` |
| 2 | [`JSON.stringify(response)` produces `{}` on error](#2-jsonstringifyresponse-produces--on-error) | Bug | `wagtail-cms-client` |
| 3 | [Verify `decendant_of` spelling against Wagtail API](#3-verify-decendant_of-spelling-against-wagtail-api) | Bug (potential) | `wagtail-cms-types`, `wagtail-cms-client` |
| 4 | [Turbo build outputs missing `dist/**`](#4-turbo-build-outputs-missing-dist) | High | Root `turbo.json` |
| 5 | [Turbo `lint` task unnecessarily serialised](#5-turbo-lint-task-unnecessarily-serialised) | High | Root `turbo.json` |
| 6 | [Turbo `typecheck` task unnecessarily serialised](#6-turbo-typecheck-task-unnecessarily-serialised) | Medium | Root `turbo.json` |
| 7 | [Turbo lint/typecheck missing `inputs` config](#7-turbo-linttypecheck-missing-inputs-config) | Medium | Root `turbo.json` |
| 8 | [`wagtail-cms-types` build script runs typedoc](#8-wagtail-cms-types-build-script-runs-typedoc) | High | `wagtail-cms-types` |
| 9 | [`wagtail-cms-types` dev script runs typedoc + live-server](#9-wagtail-cms-types-dev-script-runs-typedoc--live-server) | Medium | `wagtail-cms-types` |
| 10 | [Unused dependencies in `wagtail-cms-client`](#10-unused-dependencies-in-wagtail-cms-client) | Medium | `wagtail-cms-client` |
| 11 | [Duplicate file: `fields/schemas.ts` identical to `fields/index.ts`](#11-duplicate-file-fieldsschemasts-identical-to-fieldsindexts) | Low-effort fix | `wagtail-cms-types` |
| 12 | [Duplicated NavigationItem schema](#12-duplicated-navigationitem-schema) | Low-effort fix | `wagtail-cms-types` |
| 13 | [Duplicated error handling boilerplate in `CMSClient`](#13-duplicated-error-handling-boilerplate-in-cmsclient) | Medium | `wagtail-cms-client` |
| 14 | [`@repo/logger` unused everywhere](#14-repologger-unused-everywhere) | Medium | `logger`, `wagtail-cms-client` |
| 15 | [Dual CJS+ESM build for private packages](#15-dual-cjsesm-build-for-private-packages) | Medium | `wagtail-cms-client`, `logger`, `config-vitest` |
| 16 | [`config-vitest` could be source-only](#16-config-vitest-could-be-source-only) | Medium | `config-vitest` |
| 17 | [`sharedConfig` exported but never used](#17-sharedconfig-exported-but-never-used) | Low-effort fix | `config-vitest` |
| 18 | [Duplicated coverage exclusion list in vitest config](#18-duplicated-coverage-exclusion-list-in-vitest-config) | Low-effort fix | `config-vitest` |
| 19 | [Prettier format script overlaps with Biome](#19-prettier-format-script-overlaps-with-biome) | Medium | Root `package.json` |
| 20 | [`z.any()` usage violates strict TypeScript policy](#20-zany-usage-violates-strict-typescript-policy) | Medium | `wagtail-cms-types` |
| 21 | [Zod schemas never used for runtime validation](#21-zod-schemas-never-used-for-runtime-validation) | Medium | `wagtail-cms-types`, `wagtail-cms-client` |
| 22 | [Hardcoded `next.revalidate: 360` in generic API client](#22-hardcoded-nextrevalidate-360-in-generic-api-client) | Medium | `wagtail-cms-client` |
| 23 | [Trailing `?` appended even with no query params](#23-trailing--appended-even-with-no-query-params) | Low | `wagtail-cms-client` |
| 24 | [`wagtail-cms-client` re-exports all of `wagtail-cms-types/core`](#24-wagtail-cms-client-re-exports-all-of-wagtail-cms-typescore) | Medium | `wagtail-cms-client` |
| 25 | [Stale `@repo/ui` path alias in tsconfig](#25-stale-repoui-path-alias-in-tsconfig) | Low-effort fix | `wagtail-cms-client` |
| 26 | [TypeScript target ES5 unnecessarily conservative](#26-typescript-target-es5-unnecessarily-conservative) | Low | `config-typescript` |
| 27 | [Unused tsconfig bases (`react-app.json`, `vite.json`)](#27-unused-tsconfig-bases-react-appjson-vitejson) | Low-effort fix | `config-typescript` |
| 28 | [Non-React packages extend `react-internal` Biome config](#28-non-react-packages-extend-react-internal-biome-config) | Low | `logger`, `config-vitest`, `wagtail-cms-types` |
| 29 | [`biome-config` has placeholder echo scripts](#29-biome-config-has-placeholder-echo-scripts) | Low-effort fix | `biome-config` |
| 30 | [Inconsistent `workspace:*` vs `workspace:^`](#30-inconsistent-workspace-vs-workspace) | Low-effort fix | Multiple |
| 31 | [Duplicate commitlint dependencies](#31-duplicate-commitlint-dependencies) | Low-effort fix | Root, `commitlint-config` |
| 32 | [Unused pnpm catalog entries](#32-unused-pnpm-catalog-entries) | Low-effort fix | Root `pnpm-workspace.yaml` |
| 33 | [TypeScript version mismatch root vs catalog](#33-typescript-version-mismatch-root-vs-catalog) | Low-effort fix | Root `package.json` |
| 34 | [Redundant dev deps in `wagtail-cms-types`](#34-redundant-dev-deps-in-wagtail-cms-types) | Low-effort fix | `wagtail-cms-types` |
| 35 | [React plugin loaded for non-React test configs](#35-react-plugin-loaded-for-non-react-test-configs) | Low | `config-vitest` |
| 36 | [Template app has boilerplate metadata](#36-template-app-has-boilerplate-metadata) | Low-effort fix | `hse-app-template` |
| 37 | [Unused CSS module declarations](#37-unused-css-module-declarations) | Low-effort fix | `hse-app-template` |
| 38 | [Test setup file exists but is never referenced](#38-test-setup-file-exists-but-is-never-referenced) | Low | `config-vitest` |

---

## Bugs

### 1. `buildQueryString` lacks URL encoding

**File:** `packages/wagtail-cms-client/src/utils/index.ts`

Query parameter values are joined as raw `key=value` with no `encodeURIComponent()`. If a value contains `&`, `=`, spaces, or other special characters, the URL will be malformed.

**Fix:** Replace with `URLSearchParams` which handles encoding automatically.

### 2. `JSON.stringify(response)` produces `{}` on error

**File:** `packages/wagtail-cms-client/src/lib/fetch.ts` (line 57)

`JSON.stringify(response, null, 2)` on a `Response` object produces `"{}"` since Response properties are not enumerable. Error messages will always read `"Request failed with response: {}"`.

**Fix:** Extract `response.status`, `response.statusText`, `response.url` into the error message.

### 3. Verify `decendant_of` spelling against Wagtail API

**Files:** `packages/wagtail-cms-types/src/types/core/index.ts` (line 41), `packages/wagtail-cms-client/src/lib/cms/index.ts` (lines 66, 70)

`decendant_of` is a misspelling of `descendant_of`. If the Wagtail API uses the correct spelling, this is a bug. If the API uses the misspelling, add a comment documenting it.

**Action needed:** Check the Wagtail Pages API docs.

---

## Turbo Pipeline

### 4. Turbo build outputs missing `dist/**`

**File:** `turbo.json` (lines 12-14)

Build outputs only list `.next/**`. Library packages (`wagtail-cms-client`, `logger`, `config-vitest`) emit to `dist/` but this isn't captured — Turbo cannot cache their builds.

**Fix:** Add `"dist/**"` to the build task outputs.

### 5. Turbo `lint` task unnecessarily serialised

**File:** `turbo.json` (lines 19-21)

`dependsOn: ["^lint"]` forces lint tasks to run in dependency order. Linting is fully independent per package.

**Fix:** Change to `"dependsOn": []` so all lint tasks run in parallel.

### 6. Turbo `typecheck` task unnecessarily serialised

**File:** `turbo.json` (lines 23-25)

`dependsOn: ["^typecheck"]` serialises typechecking. TypeScript resolves workspace deps directly. Only needs built outputs to exist.

**Fix:** Change to `"dependsOn": ["^build"]` or `"dependsOn": []` if using source-only packages.

### 7. Turbo lint/typecheck missing `inputs` config

**File:** `turbo.json`

Without explicit `inputs`, any file change (README, docs) invalidates the lint/typecheck cache.

**Fix:** Add `"inputs": ["src/**", "*.json", "*.ts"]` or similar.

---

## Build Pipeline

### 8. `wagtail-cms-types` build script runs typedoc

**File:** `packages/wagtail-cms-types/package.json` (line 16)

The `build` script is `"typedoc"`. Since this is a source-only package, it has no real build step — but Turbo's `^build` dependency causes typedoc to run every time a downstream package builds.

**Fix:** Rename typedoc to `"docs"`. Set `"build"` to a no-op or remove it.

### 9. `wagtail-cms-types` dev script runs typedoc + live-server

**File:** `packages/wagtail-cms-types/package.json` (line 15)

The `dev` script starts typedoc-watch + live-server on port 3002. This runs during `pnpm dev` alongside the Next.js dev server, consuming resources.

**Fix:** Rename to `"dev:docs"` so it's not triggered by `turbo run dev`.

### 10. Unused dependencies in `wagtail-cms-client`

**File:** `packages/wagtail-cms-client/package.json`

- `@semantic-release/changelog`, `@semantic-release/git`, `@semantic-release/gitlab`, `@semantic-release/npm` — no release config exists
- `tsup` — package builds with bunchee, not tsup
- `jsdom` — vitest config uses `environment: "node"`, not jsdom
- `typedoc` v0.25.13 — different version from `wagtail-cms-types` (v0.28.13)

**Fix:** Remove all unused devDependencies and `tsup` from the pnpm catalog.

---

## Duplicate Code

### 11. Duplicate file: `fields/schemas.ts` identical to `fields/index.ts`

**Files:** `packages/wagtail-cms-types/src/types/fields/index.ts` and `fields/schemas.ts`

88-line files, byte-for-byte identical. `schemas.ts` is not imported anywhere.

**Fix:** Delete `schemas.ts`.

### 12. Duplicated NavigationItem schema

**Files:** `packages/wagtail-cms-types/src/types/page-models/appbase.ts` (`NavigationItemSchema`) and `settings/index.ts` (`CMSSiteSettingsNavItemSchema`)

Both define `z.object({ title: z.string(), url: z.string() })` under different names.

**Fix:** Extract a shared `NavItemSchema` into the `fields` sub-module.

### 13. Duplicated error handling boilerplate in `CMSClient`

**File:** `packages/wagtail-cms-client/src/index.ts`

Six methods have the same try/catch pattern (~12 lines each): check `FetchError`, return `NotFoundContents`.

**Fix:** Extract a private `handleFetchError(error, message)` helper.

---

## Dead Code and Unused Packages

### 14. `@repo/logger` unused everywhere

**Files:** `packages/logger/src/index.ts`, `packages/wagtail-cms-client/package.json`

The logger is a 3-line `console.log` wrapper with a full bunchee build pipeline. It is listed as a devDependency of `wagtail-cms-client` but never imported — by any package or app in the repo.

**Fix:** Either remove the package entirely until real logging is needed, or flesh it out and actually wire it in. Remove from `wagtail-cms-client` devDependencies either way.

### 15. Dual CJS+ESM build for private packages

**Files:** `packages/wagtail-cms-client`, `packages/logger`, `packages/config-vitest`

All three produce both ESM and CJS output via bunchee. They are private, consumed only within this ESM monorepo. CJS output is dead weight.

**Fix:** Build ESM-only to halve library build time.

### 16. `config-vitest` could be source-only

**File:** `packages/config-vitest/package.json`

This dev-only config package goes through a bunchee build for dual ESM/CJS output. It could follow the `wagtail-cms-types` pattern — point exports at `.ts` source files directly.

**Fix:** Convert to source-only, remove build step.

### 17. `sharedConfig` exported but never used

**File:** `packages/config-vitest/src/index.ts`

Exported as both named and default export. All consumers use `createVitestConfig()` instead.

**Fix:** Remove the `sharedConfig` export.

### 18. Duplicated coverage exclusion list in vitest config

**File:** `packages/config-vitest/src/index.ts`

The coverage exclusion array is defined twice — once in `sharedConfig` (lines 17-33) and again in `createVitestConfig` (lines 64-79).

**Fix:** Extract into a constant.

---

## Config and Consistency

### 19. Prettier format script overlaps with Biome

**File:** Root `package.json` (line 8)

`prettier --write "**/*.{ts,tsx,md}"` formats TypeScript files with Prettier. Biome already handles `.ts/.tsx` formatting. CLAUDE.md says Prettier is for Markdown only.

**Fix:** Change to `prettier --write "**/*.md"`.

### 20. `z.any()` usage violates strict TypeScript policy

**Files:** `packages/wagtail-cms-types/src/types/core/index.ts` (line 24), `blocks/base.ts` (line 57)

Produces `any` types, violating the "no `any`" policy.

**Fix:** Replace with `z.unknown()` or properly typed schemas (e.g., `z.custom<RequestInit>()`).

### 21. Zod schemas never used for runtime validation

**Files:** All files in `packages/wagtail-cms-types/src/`

41 `z.infer<>` calls producing types, zero `.parse()` or `.safeParse()` calls anywhere. The Zod runtime is bundled as a dependency but only used for type inference.

**Fix:** Either add `.parse()` / `.safeParse()` calls at the API response boundary in `fetchRequest` or `fetchContent`, or switch to plain TypeScript types if runtime validation isn't planned. Runtime validation is recommended — it catches malformed CMS responses before they cause rendering errors.

**Needs more research:** Determine the best place to add validation (in `fetchRequest`, in `CMSClient` methods, or in the mapping layer).

### 22. Hardcoded `next.revalidate: 360` in generic API client

**File:** `packages/wagtail-cms-client/src/lib/fetch.ts` (line 49)

Couples the generic API client to Next.js's specific fetch extension. Not overridable without passing a full `init` object with `next: { revalidate }`.

**Fix:** Make configurable via `CMSClient` constructor options or `fetchContent` parameters. Consider moving the Next.js-specific default to the app layer.

### 23. Trailing `?` appended even with no query params

**File:** `packages/wagtail-cms-client/src/lib/cms/index.ts` (line 75)

URLs are built as `${baseURL}${apiPath}/${content}/?${query}` even when `query` is empty.

**Fix:** Only append `?${query}` when query is non-empty.

### 24. `wagtail-cms-client` re-exports all of `wagtail-cms-types/core`

**File:** `packages/wagtail-cms-client/src/index.ts` (line 18)

`export * from "@repo/wagtail-cms-types/core"` creates ambiguity about the canonical import path.

**Fix:** Remove the wildcard re-export. Consumers should import types directly from `@repo/wagtail-cms-types`.

### 25. Stale `@repo/ui` path alias in tsconfig

**File:** `packages/wagtail-cms-client/tsconfig.json` (line 8)

References `"@repo/ui": ["../ui/src/*"]` — no `packages/ui` directory exists.

**Fix:** Remove the stale path alias.

### 26. TypeScript target ES5 unnecessarily conservative

**Files:** `packages/config-typescript/nextjs.json`, `react-app.json`

Targeting ES5 forces unnecessary transpilation. The project requires Node >= 24.

**Fix:** Update to `"ES2022"` or `"ESNext"`.

### 27. Unused tsconfig bases (`react-app.json`, `vite.json`)

**Files:** `packages/config-typescript/react-app.json`, `vite.json`

Not extended by any tsconfig in the workspace. `vite.json` also references a non-existent `./tsconfig.node.json`.

**Fix:** Remove both unless there is a planned use case.

### 28. Non-React packages extend `react-internal` Biome config

**Files:** `packages/logger/biome.json`, `config-vitest/biome.json`, `wagtail-cms-types/biome.json`

These packages have no React code but get React-specific linting rules.

**Fix:** Create a `@repo/biome-config/library` export for non-React packages, or have them extend `base` only.

### 29. `biome-config` has placeholder echo scripts

**File:** `packages/biome-config/package.json`

Four `echo 'Add ... script here'` stubs. These execute during Turbo runs and pollute logs.

**Fix:** Remove all placeholder scripts.

### 30. Inconsistent `workspace:*` vs `workspace:^`

`@repo/vitest-config` is referenced as `"workspace:^"` in three packages. All other internal deps use `"workspace:*"`.

**Fix:** Standardise on `"workspace:*"`.

### 31. Duplicate commitlint dependencies

Both root `package.json` and `packages/commitlint-config/package.json` declare `@commitlint/cli` and `@commitlint/config-conventional`.

**Fix:** Keep `@commitlint/cli` at root only (it runs there). Keep `@commitlint/config-conventional` in the config package only (it extends there).

### 32. Unused pnpm catalog entries

**File:** `pnpm-workspace.yaml`

`@next/third-parties`, `react-hook-form`, `@hookform/resolvers`, `tsup` — not referenced by any package.json.

**Fix:** Remove unused entries (or add when features that need them are implemented).

### 33. TypeScript version mismatch root vs catalog

Root `package.json` pins `5.9.2`, catalog specifies `^5.9.3`.

**Fix:** Change root to `"catalog:"` for consistency.

### 34. Redundant dev deps in `wagtail-cms-types`

Both `live-server` and `serve` are installed for viewing docs locally. `serve` is unused in any script.

**Fix:** Remove `serve`.

### 35. React plugin loaded for non-React test configs

**File:** `packages/config-vitest/src/index.ts`

`@vitejs/plugin-react` is loaded for all vitest configs including `environment: "node"` packages.

**Fix:** Make the React plugin opt-in — only include when environment is `jsdom`.

### 36. Template app has boilerplate metadata

**Files:** `apps/hse-app-template/src/app/layout.tsx`

Metadata reads "Create Next App".

**Fix:** Update to HSE-specific values.

### 37. Unused CSS module declarations

**File:** `apps/hse-app-template/declaration.css.d.ts`

Declares module types for `.css`, `.scss`, `.sass`, `.less`, `.styl` as CSS modules. Current usage is side-effect SCSS imports only. `.less` and `.styl` are certainly unused.

**Fix:** Remove unused declarations. Keep only what's needed.

### 38. Test setup file exists but is never referenced

**File:** `packages/config-vitest/src/test-setup.js`

Imports `@testing-library/jest-dom/vitest` but no vitest config passes it via `setupFile`.

**Fix:** Wire it into consuming configs or remove it.

---

## Areas for Further Research

| Topic | Question |
|-------|----------|
| Zod runtime validation | Where is the best place to add `.parse()` / `.safeParse()` — in `fetchRequest`, in `CMSClient` methods, or in the mapping layer? |
| `CMSClient` return type design | The `T \| NotFoundContents` union has no type discriminator. Should this use a discriminated union with a `success` flag, or throw errors instead of returning them? |
| `CMSClient` scalability | The class is 363 lines and growing. Should resource-specific methods (pages, images, documents) be split into separate modules? |
| `@repo/logger` future | Should this become a real structured logger (pino, winston), or should it be removed until monitoring (backlog item 16) is tackled? |
| `decendant_of` spelling | Need to verify against the actual Wagtail Pages API — could be a Wagtail-side typo that we need to match |
