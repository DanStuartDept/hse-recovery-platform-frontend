# Simplification Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 38 items from the simplification audit — bugs, turbo pipeline, dead code, build restructuring, code quality, and config consistency — in dependency order with maximum parallelism within each phase.

**Architecture:** Work is split into 7 sequential phases. Within each phase, tasks are independent and can be dispatched to parallel sub-agents (one per task). Each phase must complete before the next starts because later phases depend on earlier file states.

**Tech Stack:** pnpm 10, Turborepo, TypeScript 5.9, Vitest 4, Biome 2, Zod 4, bunchee 6, Next.js 16

---

## Phase 1: Bug Fixes

> 3 parallel agents. All touch different files — no conflicts.

### Task 1.1: Fix `buildQueryString` URL encoding (Audit #1)

**Files:**
- Modify: `packages/wagtail-cms-client/src/utils/index.ts`
- Modify: `packages/wagtail-cms-client/src/utils/index.test.ts`

- [ ] **Step 1: Write failing tests for URL encoding**

Add tests to `packages/wagtail-cms-client/src/utils/index.test.ts`:

```typescript
it("should encode special characters in values", () => {
	const queries: CMSQueries = { search: "foo bar&baz=qux" };
	const result = buildQueryString(queries);
	expect(result).toBe("search=foo+bar%26baz%3Dqux");
});

it("should encode special characters in array values", () => {
	const queries: CMSQueries = { fields: ["title&id", "body content"] };
	const result = buildQueryString(queries);
	expect(result).toBe("fields=title%26id%2Cbody+content");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/index.test.ts`
Expected: FAIL — values are not encoded

- [ ] **Step 3: Replace buildQueryString with URLSearchParams**

Replace the contents of `packages/wagtail-cms-client/src/utils/index.ts`:

```typescript
import type { CMSQueries } from "@repo/wagtail-cms-types/core";

export function buildQueryString(queries: CMSQueries | undefined): string {
	if (!queries) {
		return "";
	}

	const params = new URLSearchParams();

	for (const key in queries) {
		if (Object.hasOwn(queries, key) && queries[key] !== undefined) {
			const value = queries[key];

			if (Array.isArray(value)) {
				params.set(key, value.join(","));
			} else if (value !== "") {
				params.set(key, String(value));
			}
		}
	}

	return params.toString();
}
```

- [ ] **Step 4: Update existing tests for URLSearchParams output format**

`URLSearchParams` encodes spaces as `+` and keys may appear in insertion order. Update any existing assertions that rely on raw `key=value` format. For example, `"type=appbase.HomePage&limit=10"` stays the same (no special chars), but tests with spaces or `&` in values will now be encoded.

Review each existing test and confirm the expected output matches URLSearchParams encoding:
- `"type=appbase.HomePage"` stays the same
- `"type=appbase.HomePage&limit=10&offset=0"` stays the same
- `"fields=title%2Cbody"` — note: URLSearchParams encodes commas in the individual values but we join with `,` first then set, so `fields=title,body` becomes `fields=title%2Cbody`. Wait — actually `URLSearchParams.set("fields", "title,body")` produces `fields=title%2Cbody`.

**Important:** The existing test `"should handle array parameters by joining with comma"` expects `fields=title,body`. With URLSearchParams, commas are encoded as `%2C`. Either:
- (a) Accept the encoded output: `fields=title%2Cbody` — Wagtail should decode it, or
- (b) Build array values outside URLSearchParams and append raw.

The safest approach for Wagtail compatibility is (a) — standard URL encoding. Update the test expectation:

```typescript
it("should handle array parameters by joining with comma", () => {
	const queries: CMSQueries = { fields: ["title", "body"] };
	const result = buildQueryString(queries);
	expect(result).toBe("fields=title%2Cbody");
});
```

- [ ] **Step 5: Run all utils tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/index.test.ts`
Expected: All PASS

- [ ] **Step 6: Run full package tests to catch regressions**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add packages/wagtail-cms-client/src/utils/index.ts packages/wagtail-cms-client/src/utils/index.test.ts
git commit -m "fix(packages): use URLSearchParams for proper URL encoding in buildQueryString"
```

---

### Task 1.2: Fix `JSON.stringify(response)` error message (Audit #2)

**Files:**
- Modify: `packages/wagtail-cms-client/src/lib/fetch.ts`
- Modify: `packages/wagtail-cms-client/src/lib/fetch.test.ts`

- [ ] **Step 1: Write failing test for meaningful error message**

Add test to `packages/wagtail-cms-client/src/lib/fetch.test.ts`:

```typescript
it("should include status, statusText, and url in error message", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
			url: "https://example.com/api/pages/",
			json: vi.fn(),
		}),
	);

	await expect(fetchRequest("https://example.com/api/pages/")).rejects.toThrow(
		/404 Not Found/,
	);
	await expect(fetchRequest("https://example.com/api/pages/")).rejects.toThrow(
		/example\.com/,
	);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`
Expected: FAIL — current message is `"Request failed with response: {}"`

- [ ] **Step 3: Fix the error message in fetchRequest**

In `packages/wagtail-cms-client/src/lib/fetch.ts`, replace lines 56-59:

```typescript
// Old:
throw new FetchError(
	`Request failed with response: ${JSON.stringify(response, null, 2)}`,
	"REQUEST_FAILED",
);

// New:
throw new FetchError(
	`Request failed: ${response.status} ${response.statusText} (${response.url})`,
	"REQUEST_FAILED",
);
```

- [ ] **Step 4: Update existing test assertions that match the old message format**

Search `fetch.test.ts` for any assertions that check for `"Request failed with response:"` and update them to match the new format `"Request failed: <status> <statusText> (<url>)"`.

- [ ] **Step 5: Run all fetch tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/src/lib/fetch.ts packages/wagtail-cms-client/src/lib/fetch.test.ts
git commit -m "fix(packages): extract status/statusText/url in FetchError instead of JSON.stringify"
```

---

### Task 1.3: Fix `decendant_of` spelling (Audit #3)

**Files:**
- Modify: `packages/wagtail-cms-types/src/types/core/index.ts` (line 41)
- Modify: `packages/wagtail-cms-client/src/lib/cms/index.ts` (lines 66, 70)
- Modify: `packages/wagtail-cms-client/src/lib/cms/index.test.ts` (lines 165, 180, 184, 188, 193)
- Modify: `packages/wagtail-cms-client/src/index.test.ts` (if any references)

**Research result:** Wagtail API uses `descendant_of` (correct spelling). The codebase's `decendant_of` is confirmed as a bug.

- [ ] **Step 1: Fix the Zod schema in wagtail-cms-types**

In `packages/wagtail-cms-types/src/types/core/index.ts`, line 41, change:

```typescript
// Old:
decendant_of: z.number().optional(),

// New:
descendant_of: z.number().optional(),
```

- [ ] **Step 2: Fix the validation check in wagtail-cms-client**

In `packages/wagtail-cms-client/src/lib/cms/index.ts`, replace all instances of `decendant_of` with `descendant_of`:

Line 66:
```typescript
// Old:
(queries?.child_of || queries?.ancestor_of || queries?.decendant_of) &&

// New:
(queries?.child_of || queries?.ancestor_of || queries?.descendant_of) &&
```

Line 70:
```typescript
// Old:
"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'decendant_of'  query.",

// New:
"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'descendant_of' query.",
```

(Also fix the double space before "query." while we're here.)

- [ ] **Step 3: Update all test assertions**

In `packages/wagtail-cms-client/src/lib/cms/index.test.ts`, replace all instances of `decendant_of` with `descendant_of` in test descriptions, query objects, and expected error messages.

- [ ] **Step 4: Run tests for cms module**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/cms/index.test.ts`
Expected: All PASS

- [ ] **Step 5: Run full package tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-types/src/types/core/index.ts packages/wagtail-cms-client/src/lib/cms/index.ts packages/wagtail-cms-client/src/lib/cms/index.test.ts
git commit -m "fix(packages): correct decendant_of → descendant_of to match Wagtail API"
```

---

## Phase 2: Turbo Pipeline

> 1 agent. All changes are in `turbo.json` — cannot parallelise.

### Task 2.1: Fix Turbo pipeline config (Audit #4, #5, #6, #7)

**Files:**
- Modify: `turbo.json`

- [ ] **Step 1: Read current turbo.json and plan changes**

Current state:
```json
{
  "build": {
    "dependsOn": ["^build"],
    "inputs": ["$TURBO_DEFAULT$", ".env*"],
    "outputs": [".next/**", "!.next/cache/**"]
  },
  "lint": {
    "dependsOn": ["^lint"]
  },
  "typecheck": {
    "dependsOn": ["^typecheck"]
  }
}
```

Changes needed:
1. **#4:** Add `"dist/**"` to build outputs
2. **#5:** Change lint `dependsOn` to `[]`
3. **#6:** Change typecheck `dependsOn` to `[]`
4. **#7:** Add `inputs` to lint and typecheck

- [ ] **Step 2: Apply all four fixes to turbo.json**

Replace the full `tasks` object in `turbo.json`:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": [],
      "inputs": ["src/**", "*.json", "*.ts", "*.js"]
    },
    "typecheck": {
      "dependsOn": [],
      "inputs": ["src/**", "*.json", "*.ts"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test:ci": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 3: Verify turbo can parse the config**

Run: `pnpm turbo run build --dry`
Expected: Shows task graph without errors

- [ ] **Step 4: Verify lint runs in parallel**

Run: `pnpm turbo run lint --dry`
Expected: All lint tasks show no topological dependencies (they don't wait for each other)

- [ ] **Step 5: Commit**

```bash
git add turbo.json
git commit -m "fix(config): add dist outputs, parallelise lint/typecheck, add inputs filtering to turbo.json"
```

---

## Phase 3: Remove Dead Code & Unused Dependencies

> Up to 5 parallel agents. Each touches different packages/files.

### Task 3.1: Delete duplicate `fields/schemas.ts` (Audit #11)

**Files:**
- Delete: `packages/wagtail-cms-types/src/types/fields/schemas.ts`

- [ ] **Step 1: Verify schemas.ts is not imported anywhere**

Run: `grep -r "fields/schemas" packages/`
Expected: No results (file is not imported)

- [ ] **Step 2: Verify schemas.ts is identical to fields/index.ts**

Run: `diff packages/wagtail-cms-types/src/types/fields/schemas.ts packages/wagtail-cms-types/src/types/fields/index.ts`
Expected: No differences

- [ ] **Step 3: Delete the duplicate file**

```bash
rm packages/wagtail-cms-types/src/types/fields/schemas.ts
```

- [ ] **Step 4: Run typecheck to confirm nothing breaks**

Run: `pnpm turbo run typecheck --filter=@repo/wagtail-cms-types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-types/src/types/fields/schemas.ts
git commit -m "chore(packages): delete duplicate fields/schemas.ts (identical to fields/index.ts)"
```

---

### Task 3.2: Remove `@repo/logger` from wagtail-cms-client (Audit #14)

**Files:**
- Modify: `packages/wagtail-cms-client/package.json` (remove `@repo/logger` from devDependencies)

Note: We are NOT deleting the logger package itself — that's a bigger decision. We are removing the unused dependency reference.

- [ ] **Step 1: Verify logger is never imported in wagtail-cms-client**

Run: `grep -r "@repo/logger" packages/wagtail-cms-client/src/`
Expected: No results

- [ ] **Step 2: Remove @repo/logger from devDependencies**

In `packages/wagtail-cms-client/package.json`, remove this line from `devDependencies`:

```json
"@repo/logger": "workspace:*",
```

- [ ] **Step 3: Run pnpm install to update lockfile**

Run: `pnpm install`
Expected: Lockfile updates cleanly

- [ ] **Step 4: Run package tests to confirm nothing breaks**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-client/package.json pnpm-lock.yaml
git commit -m "chore(packages): remove unused @repo/logger dep from wagtail-cms-client"
```

---

### Task 3.3: Remove unused dependencies from wagtail-cms-client (Audit #10)

**Files:**
- Modify: `packages/wagtail-cms-client/package.json`

- [ ] **Step 1: Verify each dependency is unused**

Run these checks:
```bash
grep -r "semantic-release" packages/wagtail-cms-client/
grep -r "tsup" packages/wagtail-cms-client/src/
grep -r "jsdom" packages/wagtail-cms-client/
grep -r "typedoc" packages/wagtail-cms-client/src/
```
Expected: No source-code imports for any of them. (`typedoc` may appear in the `generate-docs` script — that's fine, but it shouldn't be a devDependency since the script is optional.)

- [ ] **Step 2: Remove unused devDependencies**

Remove these from `packages/wagtail-cms-client/package.json` devDependencies:

```json
"@semantic-release/changelog": "^6.0.3",
"@semantic-release/git": "^10.0.1",
"@semantic-release/gitlab": "^13.0.3",
"@semantic-release/npm": "^12.0.0",
"tsup": "catalog:",
"jsdom": "catalog:",
"typedoc": "^0.25.13",
```

- [ ] **Step 3: Run pnpm install**

Run: `pnpm install`
Expected: Lockfile updates cleanly

- [ ] **Step 4: Run tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-client/package.json pnpm-lock.yaml
git commit -m "chore(packages): remove unused semantic-release, tsup, jsdom, typedoc deps from wagtail-cms-client"
```

---

### Task 3.4: Remove redundant dev deps from wagtail-cms-types (Audit #34)

**Files:**
- Modify: `packages/wagtail-cms-types/package.json`

- [ ] **Step 1: Verify `serve` is unused**

Run: `grep "serve" packages/wagtail-cms-types/package.json`
Expected: Only appears in devDependencies, not in any script (scripts use `live-server`, not `serve`)

- [ ] **Step 2: Remove `serve` from devDependencies**

In `packages/wagtail-cms-types/package.json`, remove:

```json
"serve": "^14.2.4",
```

- [ ] **Step 3: Run pnpm install**

Run: `pnpm install`

- [ ] **Step 4: Commit**

```bash
git add packages/wagtail-cms-types/package.json pnpm-lock.yaml
git commit -m "chore(packages): remove unused serve dep from wagtail-cms-types"
```

---

### Task 3.5: Remove unused tsconfig bases and CSS declarations (Audit #27, #37)

**Files:**
- Delete: `packages/config-typescript/react-app.json`
- Delete: `packages/config-typescript/vite.json`
- Modify: `apps/hse-app-template/declaration.css.d.ts`

- [ ] **Step 1: Verify react-app.json is not referenced**

Run: `grep -r "react-app" packages/ apps/ --include="*.json"`
Expected: No tsconfig extends react-app.json

- [ ] **Step 2: Verify vite.json is not referenced**

Run: `grep -r "config-typescript/vite" packages/ apps/ --include="*.json"`
Expected: No tsconfig extends vite.json

- [ ] **Step 3: Delete unused tsconfig bases**

```bash
rm packages/config-typescript/react-app.json
rm packages/config-typescript/vite.json
```

- [ ] **Step 4: Trim declaration.css.d.ts to only needed types**

Replace `apps/hse-app-template/declaration.css.d.ts` with:

```typescript
declare module "*.scss" {
	const content: { [className: string]: string };
	export default content;
}
```

The app only uses SCSS (via `@hseireland/hse-frontend/packages/hse.scss`). Remove `.css`, `.sass`, `.less`, `.styl` module declarations. If CSS modules are needed later for `.css` files, add back then.

- [ ] **Step 5: Run typecheck**

Run: `pnpm turbo run typecheck`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/config-typescript/react-app.json packages/config-typescript/vite.json apps/hse-app-template/declaration.css.d.ts
git commit -m "chore(config): remove unused tsconfig bases (react-app, vite) and unused CSS module declarations"
```

---

## Phase 4: Build & Package Restructuring

> Up to 3 parallel agents. Each modifies different packages.

### Task 4.1: Fix wagtail-cms-types build/dev scripts (Audit #8, #9)

**Files:**
- Modify: `packages/wagtail-cms-types/package.json`

- [ ] **Step 1: Restructure the scripts**

In `packages/wagtail-cms-types/package.json`, replace the scripts block:

```json
"scripts": {
	"dev:docs": "concurrently \"pnpm run docs:watch\" \"pnpm run docs:serve\"",
	"build": "echo 'Source-only package — no build step'",
	"docs": "typedoc",
	"docs:watch": "typedoc --watch",
	"docs:serve": "npx live-server public --port=3002 --wait=2000",
	"lint": "biome check --write",
	"typecheck": "tsc --noEmit",
	"test": "vitest run",
	"test:ci": "vitest run --coverage",
	"clean": "rm -rf node_modules"
},
```

Key changes:
- `build` → no-op echo (source-only, no transpilation needed)
- `dev` → renamed to `dev:docs` (won't run during `turbo run dev`)
- `build:watch` → `docs:watch`
- `serve:live` → `docs:serve`
- Added `docs` script (was previously `build`)

- [ ] **Step 2: Verify turbo build skips this package gracefully**

Run: `pnpm turbo run build --filter=@repo/wagtail-cms-types`
Expected: Runs the echo command, succeeds immediately

- [ ] **Step 3: Verify downstream builds still work**

Run: `pnpm turbo run build --filter=@repo/wagtail-api-client`
Expected: Builds successfully (it imports source .ts files directly)

- [ ] **Step 4: Commit**

```bash
git add packages/wagtail-cms-types/package.json
git commit -m "fix(packages): change wagtail-cms-types build to no-op, rename dev to dev:docs"
```

---

### Task 4.2: Convert config-vitest to source-only + fix sharedConfig and coverage dedup (Audit #16, #17, #18)

**Files:**
- Modify: `packages/config-vitest/package.json`
- Modify: `packages/config-vitest/src/index.ts`

- [ ] **Step 1: Convert package.json to source-only exports**

Replace `packages/config-vitest/package.json`:

```json
{
	"name": "@repo/vitest-config",
	"version": "0.0.0",
	"type": "module",
	"private": true,
	"description": "Shared Vitest configuration for the monorepo.",
	"exports": {
		".": "./src/index.ts",
		"./mocks": "./src/mocks/index.ts"
	},
	"scripts": {
		"typecheck": "tsc --noEmit",
		"lint": "biome check --write"
	},
	"dependencies": {
		"@vitejs/plugin-react": "catalog:",
		"vite-tsconfig-paths": "catalog:"
	},
	"peerDependencies": {
		"vitest": "^1 || ^2 || ^3 || ^4",
		"@vitest/coverage-v8": "^1 || ^2 || ^3 || ^4",
		"jsdom": "^22 || ^23 || ^24 || ^26 || ^29",
		"vitest-sonar-reporter": "^2.0.4 || ^3.0.0"
	},
	"devDependencies": {
		"@repo/typescript-config": "workspace:*",
		"@repo/biome-config": "workspace:*",
		"@testing-library/jest-dom": "catalog:",
		"@vitest/coverage-v8": "catalog:",
		"typescript": "catalog:",
		"vitest": "catalog:",
		"jsdom": "catalog:",
		"vitest-sonar-reporter": "catalog:"
	}
}
```

Changes:
- Removed `main`, `module`, `types`, `files` fields (no build output)
- Changed `exports` to point at `.ts` source files
- Removed `build` and `dev` scripts (no bunchee)
- Removed `bunchee` from devDependencies

- [ ] **Step 2: Remove sharedConfig export and deduplicate coverage exclusions**

Replace `packages/config-vitest/src/index.ts`:

```typescript
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const coverageExclusions = [
	"node_modules/",
	"src/test-setup.js",
	"src/vitest.setup.ts",
	"**/*.test.{ts,tsx}",
	"**/*.spec.{ts,tsx}",
	"**/tests/**",
	"**/__tests__/**",
	"**/coverage/**",
	"**/.next/**",
	"**/dist/**",
	"**/build/**",
	"**/storybook-static/**",
	"**/*.config.{js,ts,mjs,mts}",
	"**/*.stories.{ts,tsx,js,jsx,mdx}",
	"**/*.d.ts",
	"**/node_modules/**",
];

interface VitestConfigOptions {
	include?: string[];
	exclude?: string[];
	setupFile?: string;
	environment?: "jsdom" | "node";
}

export function createVitestConfig(options: VitestConfigOptions = {}) {
	const {
		include = [],
		exclude = [],
		setupFile,
		environment = "jsdom",
	} = options;

	return defineConfig({
		plugins: [react(), tsconfigPaths()],
		test: {
			environment,
			globals: true,
			passWithNoTests: true,
			setupFiles: setupFile ? [setupFile] : undefined,
			coverage: {
				provider: "v8",
				reporter: ["text", "text-summary", "json", "html", "lcov"],
				include,
				exclude: [...coverageExclusions, ...exclude],
			},
			reporters: [
				"default",
				["json", { outputFile: "coverage/coverage.json" }],
				["vitest-sonar-reporter", { outputFile: "coverage/test-report.xml" }],
				["junit", { outputFile: "coverage/junit.xml" }],
			],
		},
	});
}
```

Changes:
- Removed `sharedConfig` export and its `default` export
- Extracted `coverageExclusions` constant (dedup)
- Added `"**/node_modules/**"` that was only in `createVitestConfig`

- [ ] **Step 3: Delete dist directory (no longer needed)**

```bash
rm -rf packages/config-vitest/dist
```

- [ ] **Step 4: Run pnpm install to update lockfile**

Run: `pnpm install`

- [ ] **Step 5: Run all tests that use this config**

Run: `pnpm turbo run test`
Expected: All PASS — consumers use `createVitestConfig()` not `sharedConfig`

- [ ] **Step 6: Commit**

```bash
git add packages/config-vitest/
git commit -m "refactor(packages): convert config-vitest to source-only, remove sharedConfig, deduplicate coverage exclusions"
```

---

### Task 4.3: Convert wagtail-cms-client and logger to ESM-only (Audit #15)

**Files:**
- Modify: `packages/wagtail-cms-client/package.json`
- Modify: `packages/logger/package.json`

- [ ] **Step 1: Simplify wagtail-cms-client exports to ESM-only**

In `packages/wagtail-cms-client/package.json`, replace the exports/main/module/types fields:

```json
{
	"main": "./dist/es/index.js",
	"module": "./dist/es/index.js",
	"types": "./dist/es/index.d.ts",
	"exports": {
		".": {
			"types": "./dist/es/index.d.ts",
			"default": "./dist/es/index.js"
		}
	}
}
```

Remove the `require` condition from exports — no CJS consumers exist in this private monorepo.

- [ ] **Step 2: Simplify logger exports to ESM-only**

In `packages/logger/package.json`, replace the exports/main/module/types fields:

```json
{
	"main": "./dist/es/index.js",
	"module": "./dist/es/index.js",
	"types": "./dist/es/index.d.ts",
	"exports": {
		".": {
			"types": "./dist/es/index.d.ts",
			"default": "./dist/es/index.js"
		}
	}
}
```

- [ ] **Step 3: Clean and rebuild**

```bash
rm -rf packages/wagtail-cms-client/dist packages/logger/dist
pnpm turbo run build --filter=@repo/wagtail-api-client --filter=@repo/logger
```

Expected: Builds succeed with only ESM output in `dist/es/`. The `dist/cjs/` directory should no longer be created (bunchee reads the exports map).

- [ ] **Step 4: Verify no CJS output was generated**

```bash
ls packages/wagtail-cms-client/dist/
ls packages/logger/dist/
```
Expected: Only `es/` directory, no `cjs/`

- [ ] **Step 5: Run all tests**

Run: `pnpm turbo run test`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/package.json packages/logger/package.json
git commit -m "refactor(packages): remove CJS output from wagtail-cms-client and logger (ESM-only)"
```

---

## Phase 5: Code Quality Fixes

> Up to 6 parallel agents. Each touches different files.

### Task 5.1: Deduplicate NavigationItem schema (Audit #12)

**Files:**
- Modify: `packages/wagtail-cms-types/src/types/fields/index.ts`
- Modify: `packages/wagtail-cms-types/src/types/page-models/appbase.ts`
- Modify: `packages/wagtail-cms-types/src/types/settings/index.ts`

- [ ] **Step 1: Add NavItemSchema to fields module**

Add to the end of `packages/wagtail-cms-types/src/types/fields/index.ts`:

```typescript
/**
 * Basic navigation item schema for links with title and URL.
 * Used across page models and site settings for consistent navigation structures.
 */
export const NavItemSchema = z.object({
	title: z.string(),
	url: z.string(),
});

export type NavItem = z.infer<typeof NavItemSchema>;
```

- [ ] **Step 2: Update appbase.ts to use shared schema**

In `packages/wagtail-cms-types/src/types/page-models/appbase.ts`:

Replace the import and remove the local schema:

```typescript
import { z } from "zod";
import { type NavItem, NavItemSchema } from "../fields";
import { type CMSPageWithBlocks, CMSPageWithBlocksSchema } from "./index";

// Remove NavigationItemSchema and NavigationItem - use NavItemSchema from fields

export const CMSAppBaseHomePagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseHomePageProps = CMSPageWithBlocks;

export const CMSAppBaseLandingPagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseLandingPageProps = CMSPageWithBlocks;

export const CMSAppBaseContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	disable_navigation: z.boolean().optional(),
	side_nav: z.array(NavItemSchema).optional(),
});

export type CMSAppBaseContentPageProps = z.infer<
	typeof CMSAppBaseContentPagePropsSchema
>;

export const CMSAppBaseSearchPagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseSearchPageProps = CMSPageWithBlocks;
```

- [ ] **Step 3: Update settings/index.ts to use shared schema**

In `packages/wagtail-cms-types/src/types/settings/index.ts`:

Replace the `CMSSiteSettingsNavItemSchema` definition with an import:

```typescript
import { z } from "zod";
import { FieldTypeCtaSchema, FieldTypeImageSchema, NavItemSchema } from "../fields";

// Replace CMSSiteSettingsNavItemSchema definition with alias
export const CMSSiteSettingsNavItemSchema = NavItemSchema;
export type CMSSiteSettingsNavItem = z.infer<typeof CMSSiteSettingsNavItemSchema>;
```

This preserves the exported name for backwards compatibility while using the shared implementation.

- [ ] **Step 4: Run typecheck**

Run: `pnpm turbo run typecheck --filter=@repo/wagtail-cms-types`
Expected: PASS

- [ ] **Step 5: Check if NavigationItemSchema is imported anywhere externally**

Run: `grep -r "NavigationItemSchema\|NavigationItem" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "wagtail-cms-types/src"`
Expected: No external imports of the old name. If there are, add a re-export alias.

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-types/src/types/fields/index.ts packages/wagtail-cms-types/src/types/page-models/appbase.ts packages/wagtail-cms-types/src/types/settings/index.ts
git commit -m "refactor(packages): deduplicate NavigationItem schema into shared NavItemSchema in fields module"
```

---

### Task 5.2: Extract error handling helper in CMSClient (Audit #13)

**Files:**
- Modify: `packages/wagtail-cms-client/src/index.ts`
- Modify: `packages/wagtail-cms-client/src/index.test.ts`

- [ ] **Step 1: Run existing tests to establish baseline**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/index.test.ts`
Expected: All PASS

- [ ] **Step 2: Add private handleFetchError helper and refactor methods**

In `packages/wagtail-cms-client/src/index.ts`, add a private method to `CMSClient` after the constructor:

```typescript
/**
 * Handles errors from fetch operations, returning a NotFoundContents response.
 */
private handleFetchError(error: unknown, message: string): NotFoundContents {
	if (error instanceof FetchError) {
		return { message, data: error };
	}
	return { message: "An unknown error occurred:", data: error };
}
```

Then refactor each method that has the duplicated try/catch pattern. For example, `fetchEndpoint`:

```typescript
public async fetchEndpoint<T>(
	path: string,
	init?: RequestInit,
): Promise<T | NotFoundContents> {
	if (!path) {
		throw new Error(
			"Path is required to find an endpoint. Please provide a valid path.",
		);
	}
	const url = `${this.baseURL}${this.apiPath}/${path}`;
	try {
		return (await fetchRequest(url, init)) as T;
	} catch (error) {
		return this.handleFetchError(error, "Path not found");
	}
}
```

Apply the same pattern to: `fetchPage` (the try/catch branch for numeric ID), `findPageByPath`, `fetchPagePreview`, `fetchImage`, `fetchDocument`.

Each method's `catch` block becomes:
```typescript
} catch (error) {
	return this.handleFetchError(error, "<specific message>");
}
```

- [ ] **Step 3: Run all tests to verify behaviour is unchanged**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All PASS — behaviour is identical, just deduplicated

- [ ] **Step 4: Commit**

```bash
git add packages/wagtail-cms-client/src/index.ts
git commit -m "refactor(packages): extract handleFetchError helper to deduplicate CMSClient error handling"
```

---

### Task 5.3: Replace `z.any()` with proper types (Audit #20)

**Files:**
- Modify: `packages/wagtail-cms-types/src/types/core/index.ts` (line 24)
- Modify: `packages/wagtail-cms-types/src/types/blocks/base.ts` (line 57)

- [ ] **Step 1: Fix z.any() in ClientOptionsSchema**

In `packages/wagtail-cms-types/src/types/core/index.ts`, line 24:

```typescript
// Old:
init: z.any().optional(),

// New:
init: z.custom<RequestInit>().optional(),
```

This preserves the `RequestInit` type without introducing `any`.

- [ ] **Step 2: Fix z.any() in BaseCMSBlockTypeSchema**

In `packages/wagtail-cms-types/src/types/blocks/base.ts`, line 57 (the `value` field):

```typescript
// Old:
value: z.any(),

// New:
value: z.unknown(),
```

Using `z.unknown()` is safer — block value types are narrowed by specific block schemas (e.g., `BlockTextContentPropsSchema` overrides `value` with its own typed schema).

- [ ] **Step 3: Run typecheck across the workspace**

Run: `pnpm turbo run typecheck`
Expected: PASS. The `CMSBlockType` generic type already uses `Omit<..., "client">` so the `value: unknown` change should be compatible. If any downstream code relies on `value` being `any`, the typecheck will catch it and we fix those usages.

- [ ] **Step 4: Run tests**

Run: `pnpm turbo run test`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-types/src/types/core/index.ts packages/wagtail-cms-types/src/types/blocks/base.ts
git commit -m "fix(packages): replace z.any() with z.custom<RequestInit>() and z.unknown() for type safety"
```

---

### Task 5.4: Fix trailing `?` and remove wildcard re-export (Audit #23, #24)

**Files:**
- Modify: `packages/wagtail-cms-client/src/lib/cms/index.ts` (line 75)
- Modify: `packages/wagtail-cms-client/src/lib/cms/index.test.ts`
- Modify: `packages/wagtail-cms-client/src/index.ts` (line 18)

- [ ] **Step 1: Write test for empty query string not appending `?`**

Add to `packages/wagtail-cms-client/src/lib/cms/index.test.ts`:

```typescript
it("should not append trailing ? when no query params", async () => {
	await fetchContent("https://example.com", "/api/v2", "pages");
	expect(mockFetchRequest).toHaveBeenCalledWith(
		"https://example.com/api/v2/pages/",
		undefined,
	);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/cms/index.test.ts`
Expected: FAIL — URL currently has trailing `?`

- [ ] **Step 3: Fix URL construction in fetchContent**

In `packages/wagtail-cms-client/src/lib/cms/index.ts`, replace the URL construction line:

```typescript
// Old:
const url = `${baseURL}${apiPath}/${content}/?${query}`;

// New:
const url = query
	? `${baseURL}${apiPath}/${content}/?${query}`
	: `${baseURL}${apiPath}/${content}/`;
```

- [ ] **Step 4: Run cms tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/cms/index.test.ts`
Expected: All PASS

- [ ] **Step 5: Remove wildcard re-export of wagtail-cms-types/core**

In `packages/wagtail-cms-client/src/index.ts`, remove line 18:

```typescript
// Remove this line:
export * from "@repo/wagtail-cms-types/core";
```

- [ ] **Step 6: Check if any app imports types from wagtail-cms-client instead of wagtail-cms-types**

Run: `grep -r "from.*@repo/wagtail-api-client" apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: Check what types are imported. If apps import type-only things from the client, they need to switch to `@repo/wagtail-cms-types/core`.

- [ ] **Step 7: Run full workspace typecheck**

Run: `pnpm turbo run typecheck`
Expected: PASS — if it fails, add missing imports from `@repo/wagtail-cms-types/core` to the affected files

- [ ] **Step 8: Commit**

```bash
git add packages/wagtail-cms-client/src/lib/cms/index.ts packages/wagtail-cms-client/src/lib/cms/index.test.ts packages/wagtail-cms-client/src/index.ts
git commit -m "fix(packages): remove trailing ? with empty query, remove wildcard re-export of cms types"
```

---

### Task 5.5: Remove stale @repo/ui path alias (Audit #25)

**Files:**
- Modify: `packages/wagtail-cms-client/tsconfig.json`

- [ ] **Step 1: Remove the stale path alias**

In `packages/wagtail-cms-client/tsconfig.json`, remove the entire `paths` block:

```json
// Remove:
"paths": {
	"@repo/ui": ["../ui/src/*"]
},
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm turbo run typecheck --filter=@repo/wagtail-api-client`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/wagtail-cms-client/tsconfig.json
git commit -m "chore(packages): remove stale @repo/ui path alias from wagtail-cms-client tsconfig"
```

---

### Task 5.6: Make React plugin opt-in for non-React test configs (Audit #35)

**Files:**
- Modify: `packages/config-vitest/src/index.ts`

Note: This depends on Task 4.2 completing first (which restructures this file). If running in Phase 5, the file should already reflect the Phase 4 changes.

- [ ] **Step 1: Make React plugin conditional on environment**

In `packages/config-vitest/src/index.ts`, update `createVitestConfig`:

```typescript
export function createVitestConfig(options: VitestConfigOptions = {}) {
	const {
		include = [],
		exclude = [],
		setupFile,
		environment = "jsdom",
	} = options;

	const plugins = environment === "jsdom"
		? [react(), tsconfigPaths()]
		: [tsconfigPaths()];

	return defineConfig({
		plugins,
		test: {
			// ... rest unchanged
		},
	});
}
```

Also update the imports to be conditional or keep them static (they're tree-shaken at build time since this is dev-only config):

```typescript
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
```

The import stays — it's the `plugins` array that changes.

- [ ] **Step 2: Run all tests**

Run: `pnpm turbo run test`
Expected: All PASS — packages using `environment: "node"` no longer load the React plugin

- [ ] **Step 3: Commit**

```bash
git add packages/config-vitest/src/index.ts
git commit -m "refactor(packages): only include React plugin in vitest config when environment is jsdom"
```

---

## Phase 6: Config Consistency

> Up to 8 parallel agents. All touch different files.

### Task 6.1: Fix Prettier format script (Audit #19)

**Files:**
- Modify: Root `package.json`

- [ ] **Step 1: Update format script to Markdown-only**

In root `package.json`, change:

```json
// Old:
"format": "prettier --write \"**/*.{ts,tsx,md}\""

// New:
"format": "prettier --write \"**/*.md\""
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "fix(config): scope Prettier to Markdown files only (Biome handles ts/tsx)"
```

---

### Task 6.2: Update TypeScript target (Audit #26)

**Files:**
- Modify: `packages/config-typescript/nextjs.json`

- [ ] **Step 1: Update target from ES5 to ES2022**

In `packages/config-typescript/nextjs.json`, change:

```json
// Old:
"target": "es5"

// New:
"target": "ES2022"
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm turbo run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/config-typescript/nextjs.json
git commit -m "fix(config): update TypeScript target from ES5 to ES2022 (Node 24 + Cloudflare Workers)"
```

---

### Task 6.3: Fix non-React Biome configs (Audit #28)

**Files:**
- Modify: `packages/logger/biome.json`
- Modify: `packages/config-vitest/biome.json`
- Modify: `packages/wagtail-cms-types/biome.json`

- [ ] **Step 1: Remove react-internal from non-React packages**

For each of these three files, change:

```json
// Old:
"extends": ["@repo/biome-config/base", "@repo/biome-config/react-internal"]

// New:
"extends": ["@repo/biome-config/base"]
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm turbo run lint --filter=@repo/logger --filter=@repo/vitest-config --filter=@repo/wagtail-cms-types`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/logger/biome.json packages/config-vitest/biome.json packages/wagtail-cms-types/biome.json
git commit -m "fix(config): remove react-internal biome config from non-React packages"
```

---

### Task 6.4: Remove biome-config placeholder scripts (Audit #29)

**Files:**
- Modify: `packages/biome-config/package.json`

- [ ] **Step 1: Remove all placeholder scripts**

In `packages/biome-config/package.json`, remove the entire `scripts` block:

```json
{
	"name": "@repo/biome-config",
	"version": "0.0.0",
	"private": true,
	"exports": {
		"./base": "./base.json",
		"./next-js": "./next.json",
		"./react-internal": "./react-internal.json"
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/biome-config/package.json
git commit -m "chore(packages): remove placeholder echo scripts from biome-config"
```

---

### Task 6.5: Standardise workspace protocol and fix commitlint deps (Audit #30, #31)

**Files:**
- Modify: `packages/logger/package.json`
- Modify: `packages/wagtail-cms-types/package.json`
- Modify: `packages/wagtail-cms-client/package.json`
- Modify: Root `package.json`
- Modify: `packages/commitlint-config/package.json`

- [ ] **Step 1: Standardise workspace:^ to workspace:***

In these three files, change `@repo/vitest-config` from `"workspace:^"` to `"workspace:*"`:

`packages/logger/package.json`:
```json
"@repo/vitest-config": "workspace:*",
```

`packages/wagtail-cms-types/package.json`:
```json
"@repo/vitest-config": "workspace:*",
```

`packages/wagtail-cms-client/package.json`:
```json
"@repo/vitest-config": "workspace:*",
```

- [ ] **Step 2: Fix duplicate commitlint dependencies**

In root `package.json`, remove `@commitlint/config-conventional` (keep `@commitlint/cli` at root since it runs there):

```json
// Root devDependencies — remove this line:
"@commitlint/config-conventional": "^20.2.0",
```

In `packages/commitlint-config/package.json`, remove `@commitlint/cli` (keep `@commitlint/config-conventional` since the config extends it):

```json
// commitlint-config devDependencies — remove this line:
"@commitlint/cli": "^20.2.0",
```

- [ ] **Step 3: Run pnpm install**

Run: `pnpm install`

- [ ] **Step 4: Commit**

```bash
git add packages/logger/package.json packages/wagtail-cms-types/package.json packages/wagtail-cms-client/package.json package.json packages/commitlint-config/package.json pnpm-lock.yaml
git commit -m "fix(config): standardise workspace:* protocol, deduplicate commitlint deps"
```

---

### Task 6.6: Clean up pnpm catalog and TypeScript version (Audit #32, #33)

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: Root `package.json`

- [ ] **Step 1: Remove unused catalog entries**

In `pnpm-workspace.yaml`, remove these lines from the `catalog:` section:

```yaml
# Remove:
'@next/third-parties': 16.1.5
react-hook-form: 7.72.0
'@hookform/resolvers': 5.2.2
tsup: ^8.0.2
```

- [ ] **Step 2: Fix TypeScript version mismatch**

In root `package.json`, change:

```json
// Old:
"typescript": "5.9.2"

// New:
"typescript": "catalog:"
```

- [ ] **Step 3: Run pnpm install**

Run: `pnpm install`

- [ ] **Step 4: Run typecheck to verify**

Run: `pnpm turbo run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "fix(config): remove unused pnpm catalog entries, align root TypeScript to catalog version"
```

---

### Task 6.7: Fix template app boilerplate (Audit #36)

**Files:**
- Modify: `apps/hse-app-template/src/app/layout.tsx`
- Modify: `apps/hse-app-template/wrangler.jsonc`

- [ ] **Step 1: Update layout metadata**

In `apps/hse-app-template/src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
	title: "HSE App Template",
	description: "HSE Recovery Platform application template",
};
```

- [ ] **Step 2: Fix wrangler.jsonc**

In `apps/hse-app-template/wrangler.jsonc`:

1. Remove the duplicate comment block (the first `/** For more details... */` block — there are two identical ones).
2. Change worker name from `"my-next-app"` to `"hse-app-template"`.
3. Update the self-reference service binding to match:

```jsonc
/**
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "hse-app-template",
	"main": ".open-next/worker.js",
	// ... rest unchanged ...
	"services": [
		{
			"binding": "WORKER_SELF_REFERENCE",
			"service": "hse-app-template"
		}
	],
	// ... rest unchanged ...
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/hse-app-template/src/app/layout.tsx apps/hse-app-template/wrangler.jsonc
git commit -m "chore(apps): update template app metadata and wrangler name from boilerplate defaults"
```

---

### Task 6.8: Wire up or remove test-setup.js (Audit #38)

**Files:**
- Delete: `packages/config-vitest/src/test-setup.js` (or wire it in)

Decision: The test-setup file imports `@testing-library/jest-dom/vitest` which provides custom DOM matchers. Since no vitest config references it, and consumers can opt in via `setupFile` parameter in `createVitestConfig`, we should document this in the function and leave the file as an available resource — but it needs to be importable.

- [ ] **Step 1: Check if any vitest config uses setupFile parameter**

Run: `grep -r "setupFile\|test-setup" packages/ apps/ --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v config-vitest/src/index.ts`
Expected: No configs currently pass `setupFile`

- [ ] **Step 2: Delete the orphaned test-setup.js**

Since no config references it and consumers who need jest-dom matchers can create their own setup file, remove it:

```bash
rm packages/config-vitest/src/test-setup.js
```

- [ ] **Step 3: Commit**

```bash
git add packages/config-vitest/src/test-setup.js
git commit -m "chore(packages): remove unreferenced test-setup.js from config-vitest"
```

---

## Phase 7: Deferred — Research Required

These items require design decisions before implementation. They should be tackled as separate planning exercises.

### Item 21: Zod runtime validation

**Question:** Where to add `.parse()` / `.safeParse()` calls — in `fetchRequest`, in `CMSClient` methods, or in a mapping layer? What are the performance implications on Cloudflare Workers?

**Recommendation:** Create a follow-up spike. Options:
1. Validate in `fetchRequest` (catches all malformed responses but couples the generic fetch to Zod)
2. Validate in each `CMSClient` method (most control, but requires passing schema types)
3. Validate in the future mapping layer (cleanest separation, but deferred until mapping package exists)

### Item 22: Hardcoded `next.revalidate: 360`

**Question:** Should this be configurable via `CMSClient` constructor, or moved to the app layer entirely?

**Recommendation:** Make it an optional parameter on `ClientOptions` with a default. But this touches the `fetchRequest` function signature and `CMSClient` constructor — warrants its own small plan.

---

## Parallel Execution Summary

| Phase | Tasks | Parallel Agents | Depends On |
|-------|-------|-----------------|------------|
| 1: Bug Fixes | 1.1, 1.2, 1.3 | 3 | — |
| 2: Turbo Pipeline | 2.1 | 1 | Phase 1 |
| 3: Dead Code Removal | 3.1, 3.2, 3.3, 3.4, 3.5 | 5 | Phase 2 |
| 4: Build Restructuring | 4.1, 4.2, 4.3 | 3 | Phase 3 |
| 5: Code Quality | 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 | 6 | Phase 4 |
| 6: Config Consistency | 6.1–6.8 | 8 | Phase 5 |
| 7: Deferred Research | — | — | Separate planning |

**Total tasks:** 26 executable tasks (items 21 and 22 deferred)
**Maximum parallelism:** 8 agents (Phase 6)
