# CI Pipeline Design

## Overview

A GitHub Actions CI pipeline for the HSE monorepo that runs lint, typecheck, test, and build checks on every pull request. Results are reported as a single consolidated PR comment with per-package breakdowns.

**Motivation:** No CI exists. Quality gates (lint, typecheck, tests) are unenforced. As the team grows and apps multiply, regressions will slip through without automated checks.

**Constraint:** No deployment workflows yet — the project has no production apps. This pipeline covers PR validation only. Deployment will be added when the app template is production-ready.

## Architecture

### File structure

```
.github/
├── actions/
│   └── setup/
│       └── action.yml          # Composite: checkout + pnpm + Node 24 + install
└── workflows/
    └── pr.yml                  # PR workflow: lint, typecheck, test, build → report
scripts/
└── ci/
    └── coverage-report.mjs     # Parses per-package coverage JSON → markdown table
```

### Workflow topology

```
PR opened / synchronize / reopened
  ├── lint ──────────→ lint.md artifact
  ├── typecheck ─────→ typecheck.md artifact
  ├── test ──────────→ coverage.md artifact (per-package table)
  ├── build ─────────→ build.md artifact
  └── report (needs: all above, runs always)
       → downloads all *.md artifacts
       → concatenates into single PR comment
       → posts/updates via hidden marker
```

All check jobs run in parallel. The report job waits for all of them (`if: always()`).

## Composite action: `.github/actions/setup/action.yml`

Reusable setup sequence shared by every job. No inputs — reads configuration from the repo.

### Steps

1. `actions/checkout@v4` with `fetch-depth: 2` (required for `turbo --affected` to compare against the base branch)
2. `pnpm/action-setup@v5` — auto-reads pnpm version from the `packageManager` field in `package.json` (currently `pnpm@10.33.0`)
3. `actions/setup-node@v6` with `node-version: 24` and `cache: "pnpm"`
4. `pnpm install --frozen-lockfile`

### Why a composite action

Every job in the PR workflow needs the same 4 steps. Without the composite action, that's 4 jobs x 4 steps = 16 lines of duplicated YAML. The composite action reduces each job's setup to a single `uses: ./.github/actions/setup` line. When a new action (e.g., deploy) is added later, it reuses the same setup.

## PR workflow: `.github/workflows/pr.yml`

### Trigger

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
```

### Environment variables

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

These enable Turborepo remote caching. If not configured in GitHub, Turbo runs without remote cache (no error). Ready for when Vercel remote caching is set up.

### Jobs

All check jobs follow the same pattern:

1. Run `.github/actions/setup`
2. Run `turbo run <task> --affected`
3. Capture exit code and output
4. Format a markdown fragment
5. Upload fragment via `actions/upload-artifact@v7`
6. Exit with the original exit code (so the GitHub check fails if the command failed)

#### `lint` job

```bash
turbo run lint --affected
```

Artifact `lint.md`: pass/fail per package. On failure, error output in a collapsible `<details>` block.

#### `typecheck` job

```bash
turbo run typecheck --affected
```

Artifact `typecheck.md`: pass/fail per package. On failure, TypeScript errors in a collapsible `<details>` block.

#### `test` job

```bash
turbo run test:ci --affected
```

Then runs:

```bash
node scripts/ci/coverage-report.mjs > coverage.md
```

Artifact `coverage.md`: per-package coverage table (statements, branches, functions, lines).

The `test:ci` task in `turbo.json` depends on `^build`, so upstream packages are built automatically. Turbo caching means if the `build` job already built them, the test job hits cache.

#### `build` job

```bash
turbo run build --affected
```

Artifact `build.md`: pass/fail per app. On failure, build errors in a collapsible `<details>` block.

#### `report` job

Runs with `if: always()` — even if check jobs fail. Needs all 4 check jobs.

1. Downloads all `*.md` artifacts via `actions/download-artifact@v8`
2. Concatenates them in order: lint, typecheck, test, build
3. Wraps in a `## CI Report` header
4. Posts or updates a single PR comment via `peter-evans/create-or-update-comment@v5`

The comment is identified by a hidden HTML marker `<!-- ci-report -->` so it updates the same comment on subsequent pushes rather than creating new ones.

### Permissions

```yaml
permissions:
  contents: read
  pull-requests: write   # for posting PR comments
```

## PR comment format

### All checks pass

```markdown
<!-- ci-report -->
## CI Report

### Lint
✅ All packages passed

### Typecheck
✅ All packages passed

### Test Coverage
| Package | Stmts | Branch | Funcs | Lines |
|---------|-------|--------|-------|-------|
| @repo/app-config | 92% | 85% | 100% | 92% |
| @repo/wagtail-cms-mapping | 78% | 65% | 80% | 78% |
| @repo/wagtail-cms-types | 100% | 100% | 100% | 100% |

### Build
✅ All apps built successfully
```

### On failure

Failed sections expand with error details:

```markdown
### Typecheck
❌ 1 package failed

<details><summary>@repo/wagtail-cms-mapping</summary>

\`\`\`
src/blocks/text.tsx(12,5): error TS2345: Argument of type 'string' is not assignable...
\`\`\`

</details>
```

### Extensibility

The fragment-based approach is designed for future checks. To add a new check (e.g., SonarCloud, Lighthouse):

1. Add a new job that runs `.github/actions/setup`, runs its check, and uploads a `<name>.md` artifact
2. Add the job to the report job's `needs` list

The report job doesn't need to know what each check does — it concatenates all downloaded markdown fragments.

## Prerequisite: add `json-summary` coverage reporter

The current `createVitestConfig()` in `@repo/vitest-config` configures coverage reporters as `["text", "text-summary", "json", "html", "lcov"]`. The `json` reporter produces `coverage-final.json` (Istanbul raw per-file data), which is complex to parse for summary percentages.

Add `"json-summary"` to the coverage reporters list. This produces `coverage-summary.json` with pre-computed percentages — the clean input format the CI script needs.

**Change in `packages/config-vitest/src/index.ts`:**

Add `"json-summary"` to the `reporter` array in the `coverage` config:

```typescript
reporter: ["text", "text-summary", "json", "json-summary", "html", "lcov"],
```

This is a one-line change. All packages that use `createVitestConfig()` will then produce `coverage-summary.json` alongside their existing coverage files.

## Coverage report script: `scripts/ci/coverage-report.mjs`

A standalone Node.js script with no external dependencies (uses `node:fs` and `node:path` only).

### Behaviour

1. Walks `packages/*/coverage/coverage-summary.json` and `apps/*/coverage/coverage-summary.json`
2. For each file, reads the `total` entry which contains `{ statements, branches, functions, lines }` each with a `pct` (percentage) field
3. Reads the package name from the corresponding `package.json`
4. Outputs a markdown table to stdout sorted by package name
5. Skips packages that have no `coverage-summary.json` (didn't run tests or were cached)
6. If no coverage files are found at all, outputs a "No test coverage data" message

### Output format

```markdown
| Package | Stmts | Branch | Funcs | Lines |
|---------|-------|--------|-------|-------|
| @repo/app-config | 92% | 85% | 100% | 92% |
| @repo/wagtail-cms-mapping | 78% | 65% | 80% | 78% |
```

### Coverage summary JSON format

Adding `"json-summary"` to the V8 coverage reporters produces `coverage-summary.json` with this shape:

```json
{
  "total": {
    "statements": { "total": 100, "covered": 92, "pct": 92 },
    "branches": { "total": 20, "covered": 17, "pct": 85 },
    "functions": { "total": 15, "covered": 15, "pct": 100 },
    "lines": { "total": 100, "covered": 92, "pct": 92 }
  }
}
```

## Action version pinning

| Action | Version | Notes |
|--------|---------|-------|
| `actions/checkout` | `v4` | `fetch-depth: 2` for `--affected` |
| `pnpm/action-setup` | `v5` | Auto-reads `packageManager` field |
| `actions/setup-node` | `v6` | Node 24, pnpm cache |
| `actions/upload-artifact` | `v7` | |
| `actions/download-artifact` | `v8` | |
| `peter-evans/create-or-update-comment` | `v5` | Hidden marker for idempotent updates |

Pinning to major versions means Dependabot only alerts on major bumps.

## Turbo configuration

The existing `turbo.json` task graph is correct for CI:

- `build` depends on `^build` (topological)
- `test` and `test:ci` depend on `^build`
- `lint` and `typecheck` have no dependencies (run immediately)
- `--affected` filters to changed packages and their dependents

No changes to `turbo.json` are needed.

## Out of scope

- Deployment workflows (no Azure/Vercel push — no production apps yet)
- Coverage thresholds or enforcement (backlog item #15)
- SonarCloud, Lighthouse, or other integrations (the fragment pattern makes them easy to add later)
- Branch protection rules (GitHub repo settings, not a workflow concern)
- Husky / git hooks (backlog item #14, separate concern)
