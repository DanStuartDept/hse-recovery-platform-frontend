---
sidebar_position: 7
---

# Shared configuration packages

The monorepo centralises linting, formatting, TypeScript, and test configuration into dedicated packages. Each workspace extends these rather than maintaining its own configuration.

---

## `@repo/biome-config`

**Path:** `packages/biome-config`  
**Files:** `base.json`, `next.json`, `react-internal.json`

Shared [Biome v2](https://biomejs.dev/) rule sets. Biome handles both linting and formatting — there is no ESLint or Prettier in this repository.

### Presets

#### `base.json`

The foundation preset. Extended by `next.json` and `react-internal.json`.

Key settings:

| Setting | Value | Description |
|---|---|---|
| `formatter.indentStyle` | `"tab"` | Tabs for indentation. |
| `javascript.formatter.quoteStyle` | `"double"` | Double quotes for JS/TS strings. |
| `assist.actions.source.organizeImports` | `"on"` | Automatically organises imports on format. |
| `linter.rules.recommended` | `false` | Does not use Biome's recommended preset — rules are individually configured. |
| `style.noCommonJs` | `"error"` | No `require()` / `module.exports`. |
| `suspicious.noExplicitAny` | `"error"` | Bans `any`. |
| `suspicious.noDebugger` | `"error"` | Bans `debugger` statements. |
| `correctness.noUnusedVariables` | `"error"` | Bans unused variables. |
| `style.useConst` | `"error"` (TS files) | Prefer `const` over `let`. |
| `suspicious.noVar` | `"error"` (TS files) | No `var` declarations. |

Excluded paths: `dist`, `build`, `coverage`, `docs`, `public`.

#### `next.json`

Extends `base.json`. For Next.js applications.

Additional settings over `base.json`:

| Setting | Value | Description |
|---|---|---|
| `linter.rules.recommended` | `true` | Enables Biome's recommended rule set. |
| `linter.domains.next` | `"recommended"` | Enables the Biome Next.js domain rules. |
| `linter.domains.react` | `"recommended"` | Enables the Biome React domain rules. |
| `correctness.useHookAtTopLevel` | `"error"` | Hooks must be called at the top level. |
| `correctness.useExhaustiveDependencies` | `"warn"` | Warns on missing `useEffect`/`useCallback` dependencies. |
| `correctness.useJsxKeyInIterable` | `"error"` | Requires `key` prop in JSX iterables. |
| `security.noDangerouslySetInnerHtmlWithChildren` | `"error"` | Prevents misuse of `dangerouslySetInnerHTML`. |
| `suspicious.noCommentText` | `"error"` | No raw text in JSX (must use JSX expressions). |
| `suspicious.noDuplicateJsxProps` | `"error"` | No duplicate props on a JSX element. |

Excluded paths: `.next`, `out`, `next-env.d.ts`.

#### `react-internal.json`

Extends `base.json`. For internal React library packages (e.g., `@repo/wagtail-cms-mapping`).

Additional settings:

| Setting | Value | Description |
|---|---|---|
| `linter.domains.react` | `"recommended"` | Enables Biome React domain rules. |

Lighter than `next.json` — appropriate for packages that are consumed by Next.js apps but are not apps themselves.

### Usage

Reference a preset in your package's `biome.json`:

```json
{
  "extends": ["@repo/biome-config/next"]
}
```

Or from the root `biome.json`:

```json
{
  "extends": ["@repo/biome-config/base"]
}
```

Run linting and auto-fix from the repo root:

```bash
pnpm lint
```

---

## `@repo/typescript-config`

**Path:** `packages/config-typescript`  
**Files:** `base.json`, `nextjs.json`, `react-library.json`

Shared TypeScript compiler configurations. Every package and app extends one of these bases.

### Bases

#### `base.json`

The foundation for all TypeScript in the monorepo.

Key settings:

| Setting | Value | Notes |
|---|---|---|
| `strict` | `true` | Full strict mode. |
| `strictNullChecks` | `true` | Explicit null handling. |
| `isolatedModules` | `true` | Each file is a separate module — required for fast bundlers. |
| `module` | `"ESNext"` | ES module output. |
| `moduleResolution` | `"Bundler"` | Modern resolution for Vite/bunchee/Next.js. |
| `esModuleInterop` | `true` | Interop for default imports from CJS modules. |
| `allowImportingTsExtensions` | `true` | Allows `.ts`/`.tsx` in import paths (source-only packages). |
| `declaration` | `true` | Emits `.d.ts` files. |
| `declarationMap` | `true` | Emits `.d.ts.map` files. |
| `noEmit` | `true` | Type-checking only — bundlers handle emit. |
| `skipLibCheck` | `true` | Skip type-checking `.d.ts` files in `node_modules`. |
| `forceConsistentCasingInFileNames` | `true` | Prevents case-sensitivity issues across OSes. |

#### `nextjs.json`

Extends `base.json`. For Next.js applications.

Key additions:

| Setting | Value | Notes |
|---|---|---|
| `plugins` | `[{ "name": "next" }]` | Enables the Next.js TypeScript plugin for IDE hints. |
| `target` | `"ES2022"` | Modern JS output for Node.js runtime. |
| `lib` | `["dom", "dom.iterable", "esnext"]` | Browser APIs available. |
| `jsx` | `"preserve"` | JSX handled by Next.js transform. |
| `allowJs` | `true` | Allows `.js` files alongside TypeScript. |
| `incremental` | `true` | Incremental builds for faster `tsc`. |
| `resolveJsonModule` | `true` | Allows importing `.json` files. |
| `declaration` | `false` | No `.d.ts` emit for apps. |

#### `react-library.json`

Extends `base.json`. For React component library packages.

Key additions:

| Setting | Value | Notes |
|---|---|---|
| `lib` | `["ES2015"]` | Only ES2015 base lib (no DOM types — consumers provide those). |
| `target` | `"ES6"` | Compatible output. |
| `jsx` | `"react-jsx"` | Uses the new JSX transform (no `import React`). |

### Usage

Reference a base in your package's `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

Run type checking across the whole workspace:

```bash
pnpm typecheck
```

---

## `@repo/vitest-config`

**npm name:** `@repo/vitest-config`  
**Path:** `packages/config-vitest`  
**Build:** bunchee — dual ESM + CJS

Shared Vitest configuration factory. Every testable package calls `createVitestConfig()` in its `vitest.config.ts`.

### `createVitestConfig(options?)`

```ts
import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
  include: ["src/**/*.{ts,tsx}"],
  setupFile: "src/vitest.setup.ts",
});
```

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `[]` | Glob patterns for coverage `include`. |
| `exclude` | `string[]` | `[]` | Additional coverage exclusions merged with defaults. |
| `setupFile` | `string` | `undefined` | Path to a setup file run before each test file. |
| `environment` | `"jsdom" \| "node"` | `"jsdom"` | Test environment. Use `"node"` for server-only packages. |

#### What it configures

- **Plugins:** `@vitejs/plugin-react` (jsdom only) + `vite-tsconfig-paths` (always).
- **Globals:** `true` — `describe`, `it`, `expect`, etc. are globally available without imports.
- **`passWithNoTests`:** `true` — packages without tests do not fail CI.
- **Coverage provider:** `v8`.
- **Coverage reporters:** `text`, `text-summary`, `json`, `json-summary`, `html`, `lcov`.
- **Test reporters:** default console output + JSON (`coverage/coverage.json`) + Sonar (`coverage/test-report.xml`) + JUnit (`coverage/junit.xml`).
- **Coverage exclusions (always applied):** `node_modules`, `dist`, `build`, coverage reports, test files, config files, stories, `.d.ts` files.

#### Environment selection

```ts
// Server-only package (no DOM, no React)
export default createVitestConfig({
  environment: "node",
  include: ["src/**/*.ts"],
});

// React component package (default jsdom environment)
export default createVitestConfig({
  include: ["src/**/*.{ts,tsx}"],
  setupFile: "src/vitest.setup.ts",
});
```

### Mock utilities (`@repo/vitest-config/mocks`)

The package exports a `mocks` sub-path with shared mock factories:

```ts
import { mockNextNavigation, createNavigationMocks } from "@repo/vitest-config/mocks";
```

| Export | Description |
|---|---|
| `mockNextNavigation()` | Calls `vi.mock("next/navigation", ...)` with standard mocks for `notFound`, `redirect`, `useRouter`, `usePathname`, `useSearchParams`. |
| `createNavigationMocks()` | Returns the mock object directly (for tests that need access to the mock functions). |

### Running tests

```bash
# All packages
pnpm test

# Single package
turbo run test --filter=@repo/wagtail-api-client

# Single file (from package directory)
cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts
```

---

## `@repo/commitlint-config`

**Path:** `packages/commitlint-config`  
**File:** `.commitlintrc.js`

Commitlint configuration enforcing [Conventional Commits](https://www.conventionalcommits.org/) format. Enforced automatically on every `git commit` via a Husky pre-commit hook.

### Commit message format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Allowed types (from `@commitlint/config-conventional`)

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting changes (no logic change) |
| `refactor` | Code change that is not a feature or bug fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

### Allowed scopes

Scope must be one of:

| Scope | Use for |
|---|---|
| `apps` | Changes inside `apps/` |
| `packages` | Changes inside `packages/` |
| `configs` | Root-level configuration files |
| `gh-actions` | GitHub Actions workflows |
| `deps` | Production dependency updates |
| `deps-dev` | Development dependency updates |

### Subject case

Subject case is not enforced (`subject-case` rule is disabled) — write naturally.

### Examples

```
feat(apps): add revalidation webhook route
fix(packages): resolve circular dependency in wagtail-cms-types
docs(configs): update Vitest configuration guide
chore(deps): bump next from 15.3.0 to 15.3.1
ci(gh-actions): add Node.js 24 matrix entry
```

### Enforcement

Commitlint runs as a Husky `commit-msg` hook. A commit with a non-conforming message is rejected with an error message explaining which rule failed.
