# Git Hooks Design — Husky + lint-staged + commitlint

**Date:** 2026-04-07
**Backlog item:** #14 — Git Hooks (Husky + commitlint)
**Status:** Approved

---

## Goal

Enforce Conventional Commits and catch lint/type/test issues locally before code reaches the remote. Fast feedback loop for developers, with CI as the safety net for build and full validation.

## Approach

Husky + lint-staged. Industry-standard, portable across editors and terminals, works for the full team regardless of AI tooling.

## Git Hooks

### `commit-msg`

Runs commitlint against the commit message using `@repo/commitlint-config`. Rejects non-Conventional Commits.

```sh
pnpm commitlint --edit $1
```

### `pre-commit`

Runs three checks in sequence:

1. **lint-staged** — `biome check --write` on staged `.ts`/`.tsx` files only. Auto-fixes formatting and lint issues, re-stages fixed files.
2. **turbo typecheck** — TypeScript `--noEmit` across affected packages. Turbo caching keeps unchanged packages near-instant.
3. **turbo test** — Vitest across affected packages. Cached when source hasn't changed.

```sh
pnpm lint-staged
turbo run typecheck test
```

## New Dependencies

| Package | Where | Purpose |
|---------|-------|---------|
| `husky` | root devDependencies | Git hook management |
| `lint-staged` | root devDependencies | Run commands on staged files only |

Existing dependencies stay as-is: `@commitlint/cli`, `@repo/commitlint-config`, `@biomejs/biome`.

## File Changes

| File | Change |
|------|--------|
| `package.json` | Add `husky`, `lint-staged` to devDeps. Add `"prepare": "husky"` script. Add `lint-staged` config section. |
| `.husky/commit-msg` | Shell script: `pnpm commitlint --edit $1` |
| `.husky/pre-commit` | Shell script: `pnpm lint-staged` then `turbo run typecheck test` |

## lint-staged Configuration

In root `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["biome check --write --no-errors-on-unmatched"]
}
```

Biome runs on only the staged TypeScript files. `--write` auto-fixes; lint-staged automatically re-stages any modified files.

## Scope — What the Hooks Do NOT Do

- **No build** in the hook — build validation is CI's job.
- **No Markdown/JSON formatting** — Prettier for Markdown stays a manual `pnpm format` call.
- **No `--no-verify` encouragement** — if a hook fails, fix the issue.

## Existing Config (No Changes Needed)

- **`@repo/commitlint-config`** (`packages/commitlint-config/.commitlintrc.js`) — extends `@commitlint/config-conventional`, enforces scope enum (`apps`, `packages`, `configs`, `gh-actions`, `deps`, `deps-dev`), relaxes subject-case.
- **Root `.commitlintrc.js`** — extends `@repo/commitlint-config`.
- **Root `biome.json`** and `@repo/biome-config` package — already configured with linting rules and formatting (tabs, indent-width 2, line-width 120).
- **`turbo.json`** — `typecheck` and `test` tasks already defined with correct `dependsOn` and inputs.

## Developer Experience

- `pnpm install` automatically sets up hooks via the `prepare` script (Husky v9+ convention).
- Turbo caching means repeat commits touching the same code are fast.
- Developers see lint auto-fixes applied to their staged files before the commit completes.
- Commit messages are validated against Conventional Commits — bad messages are rejected with a clear error.
