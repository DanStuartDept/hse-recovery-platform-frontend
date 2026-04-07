# CI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions PR workflow that runs lint, typecheck, test, and build in parallel, then posts a single consolidated CI report as a PR comment with per-package coverage breakdowns.

**Architecture:** A reusable composite action (`.github/actions/setup`) handles checkout/pnpm/Node/install. Four parallel check jobs each produce a markdown fragment artifact. A final report job concatenates all fragments and posts/updates a single PR comment via a hidden HTML marker.

**Tech Stack:** GitHub Actions, Turborepo (`--affected`), Vitest coverage, Node.js scripts

---

### Task 1: Commit `.nvmrc` and add `json-summary` coverage reporter

**Files:**
- Stage: `.nvmrc` (already exists, untracked)
- Modify: `packages/config-vitest/src/index.ts:51`

- [ ] **Step 1: Add `json-summary` to the coverage reporters**

In `packages/config-vitest/src/index.ts`, change line 51 from:

```typescript
reporter: ["text", "text-summary", "json", "html", "lcov"],
```

to:

```typescript
reporter: ["text", "text-summary", "json", "json-summary", "html", "lcov"],
```

- [ ] **Step 2: Verify `coverage-summary.json` is produced**

Run: `cd packages/app-config && pnpm test:ci`

Then check: `ls packages/app-config/coverage/coverage-summary.json`

Expected: File exists.

Run: `node -e "const d = JSON.parse(require('fs').readFileSync('packages/app-config/coverage/coverage-summary.json','utf8')); console.log(d.total.statements.pct, d.total.branches.pct, d.total.functions.pct, d.total.lines.pct)"`

Expected: Prints four percentage numbers (e.g., `100 91.66 100 100`).

- [ ] **Step 3: Commit**

```bash
git add .nvmrc packages/config-vitest/src/index.ts
git commit -m "chore: add .nvmrc and json-summary coverage reporter"
```

---

### Task 2: Coverage report script

**Files:**
- Create: `scripts/ci/coverage-report.mjs`

- [ ] **Step 1: Create `scripts/ci/coverage-report.mjs`**

```javascript
#!/usr/bin/env node

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../../", import.meta.url).pathname;

function findCoveragePackages() {
	const results = [];

	for (const dir of ["packages", "apps"]) {
		const base = join(rootDir, dir);
		if (!existsSync(base)) continue;

		for (const name of readdirSync(base, { withFileTypes: true })) {
			if (!name.isDirectory()) continue;

			const coveragePath = join(base, name.name, "coverage", "coverage-summary.json");
			const pkgPath = join(base, name.name, "package.json");

			if (!existsSync(coveragePath) || !existsSync(pkgPath)) continue;

			const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

			results.push({
				name: pkg.name,
				statements: coverage.total.statements.pct,
				branches: coverage.total.branches.pct,
				functions: coverage.total.functions.pct,
				lines: coverage.total.lines.pct,
			});
		}
	}

	return results.sort((a, b) => a.name.localeCompare(b.name));
}

const packages = findCoveragePackages();

if (packages.length === 0) {
	console.log("No test coverage data found.");
	process.exit(0);
}

console.log("| Package | Stmts | Branch | Funcs | Lines |");
console.log("|---------|-------|--------|-------|-------|");

for (const pkg of packages) {
	console.log(
		`| ${pkg.name} | ${pkg.statements}% | ${pkg.branches}% | ${pkg.functions}% | ${pkg.lines}% |`,
	);
}
```

- [ ] **Step 2: Verify the script works**

First, generate coverage data:

Run: `pnpm test:ci 2>&1 | tail -5`

Then run the script:

Run: `node scripts/ci/coverage-report.mjs`

Expected: A markdown table with rows for each package that has tests (at least `@repo/app-config`, `@repo/wagtail-cms-mapping`, `@repo/wagtail-cms-types`).

- [ ] **Step 3: Commit**

```bash
git add scripts/ci/coverage-report.mjs
git commit -m "feat(ci): add per-package coverage report script"
```

---

### Task 3: Composite setup action

**Files:**
- Create: `.github/actions/setup/action.yml`

- [ ] **Step 1: Create `.github/actions/setup/action.yml`**

```yaml
name: "Setup"
description: "Checkout, install pnpm, setup Node.js, install dependencies"

runs:
  using: "composite"
  steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 2

    - name: Install pnpm
      uses: pnpm/action-setup@v5

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version-file: ".nvmrc"
        cache: "pnpm"

    - name: Install dependencies
      shell: bash
      run: pnpm install --frozen-lockfile
```

Note: `pnpm/action-setup@v5` auto-reads the pnpm version from `packageManager` in `package.json`. `setup-node@v6` reads Node version from `.nvmrc` (`lts/krypton` = Node 24).

- [ ] **Step 2: Commit**

```bash
git add .github/actions/setup/action.yml
git commit -m "feat(ci): add reusable setup composite action"
```

---

### Task 4: PR workflow

**Files:**
- Create: `.github/workflows/pr.yml`

- [ ] **Step 1: Create `.github/workflows/pr.yml`**

```yaml
name: PR

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup

      - name: Run lint
        id: lint
        run: |
          set +e
          output=$(turbo run lint --affected 2>&1)
          exit_code=$?
          echo "$output"
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"

          {
            echo "### Lint"
            if [ $exit_code -eq 0 ]; then
              echo "✅ All packages passed"
            else
              echo "❌ Lint failed"
              echo ""
              echo "<details><summary>Output</summary>"
              echo ""
              echo '```'
              echo "$output"
              echo '```'
              echo ""
              echo "</details>"
            fi
          } > lint.md

      - name: Upload lint report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: lint-report
          path: lint.md

      - name: Exit with lint result
        if: steps.lint.outputs.exit_code != '0'
        run: exit 1

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup

      - name: Run typecheck
        id: typecheck
        run: |
          set +e
          output=$(turbo run typecheck --affected 2>&1)
          exit_code=$?
          echo "$output"
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"

          {
            echo "### Typecheck"
            if [ $exit_code -eq 0 ]; then
              echo "✅ All packages passed"
            else
              echo "❌ Typecheck failed"
              echo ""
              echo "<details><summary>Output</summary>"
              echo ""
              echo '```'
              echo "$output"
              echo '```'
              echo ""
              echo "</details>"
            fi
          } > typecheck.md

      - name: Upload typecheck report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: typecheck-report
          path: typecheck.md

      - name: Exit with typecheck result
        if: steps.typecheck.outputs.exit_code != '0'
        run: exit 1

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup

      - name: Run tests with coverage
        id: test
        run: |
          set +e
          output=$(turbo run test:ci --affected 2>&1)
          exit_code=$?
          echo "$output"
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"

          {
            echo "### Test Coverage"
            if [ $exit_code -eq 0 ]; then
              node scripts/ci/coverage-report.mjs
            else
              echo "❌ Tests failed"
              echo ""
              echo "<details><summary>Output</summary>"
              echo ""
              echo '```'
              echo "$output"
              echo '```'
              echo ""
              echo "</details>"
            fi
          } > coverage.md

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: coverage-report
          path: coverage.md

      - name: Exit with test result
        if: steps.test.outputs.exit_code != '0'
        run: exit 1

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup

      - name: Run build
        id: build
        run: |
          set +e
          output=$(turbo run build --affected 2>&1)
          exit_code=$?
          echo "$output"
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"

          {
            echo "### Build"
            if [ $exit_code -eq 0 ]; then
              echo "✅ All apps built successfully"
            else
              echo "❌ Build failed"
              echo ""
              echo "<details><summary>Output</summary>"
              echo ""
              echo '```'
              echo "$output"
              echo '```'
              echo ""
              echo "</details>"
            fi
          } > build.md

      - name: Upload build report
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: build-report
          path: build.md

      - name: Exit with build result
        if: steps.build.outputs.exit_code != '0'
        run: exit 1

  report:
    name: Report
    runs-on: ubuntu-latest
    if: always()
    needs: [lint, typecheck, test, build]
    steps:
      - name: Download lint report
        uses: actions/download-artifact@v8
        with:
          name: lint-report
        continue-on-error: true

      - name: Download typecheck report
        uses: actions/download-artifact@v8
        with:
          name: typecheck-report
        continue-on-error: true

      - name: Download coverage report
        uses: actions/download-artifact@v8
        with:
          name: coverage-report
        continue-on-error: true

      - name: Download build report
        uses: actions/download-artifact@v8
        with:
          name: build-report
        continue-on-error: true

      - name: Assemble report
        run: |
          {
            echo "<!-- ci-report -->"
            echo "## CI Report"
            echo ""
            for file in lint.md typecheck.md coverage.md build.md; do
              if [ -f "$file" ]; then
                cat "$file"
                echo ""
              fi
            done
          } > report.md

      - name: Post PR comment
        uses: peter-evans/create-or-update-comment@v5
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body-path: report.md
          body-includes: "<!-- ci-report -->"
          edit-mode: replace
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pr.yml'))" && echo "Valid YAML"`

Expected: `Valid YAML`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pr.yml
git commit -m "feat(ci): add PR workflow with lint, typecheck, test, build, and report"
```

---

### Task 5: Final verification

- [ ] **Step 1: Verify all files exist**

Run: `ls -la .nvmrc .github/actions/setup/action.yml .github/workflows/pr.yml scripts/ci/coverage-report.mjs`

Expected: All 4 files listed.

- [ ] **Step 2: Run lint on new files**

Run: `pnpm lint`

Expected: No errors for the vitest config change. (YAML and `.mjs` files are not linted by Biome unless configured.)

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: No type errors.

- [ ] **Step 4: Run full test suite to verify json-summary change**

Run: `pnpm test:ci`

Expected: All tests pass. Each package with tests now produces `coverage/coverage-summary.json`.

- [ ] **Step 5: Verify coverage report script**

Run: `node scripts/ci/coverage-report.mjs`

Expected: Markdown table output with per-package coverage data.
