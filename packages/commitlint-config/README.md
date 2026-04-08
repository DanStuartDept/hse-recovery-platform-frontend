# @repo/commitlint-config

Shared commitlint configuration for the monorepo, extending `@commitlint/config-conventional`.

## Usage

The root `.commitlintrc.js` references this package directly — no per-package setup needed:

```js
// .commitlintrc.js (repo root)
module.exports = require("@repo/commitlint-config");
```

Commits are validated automatically via the Husky `commit-msg` hook.

## Rules

Extends [Conventional Commits](https://www.conventionalcommits.org/) with two overrides:

| Rule           | Setting                                              |
| -------------- | ---------------------------------------------------- |
| `subject-case` | Disabled — any case is accepted                      |
| `scope-enum`   | Required — must be one of the scopes below           |

### Allowed scopes

`apps`, `packages`, `configs`, `gh-actions`, `deps`, `deps-dev`

### Commit format

```
<type>(<scope>): <subject>

feat(apps): add Irish language support
fix(packages): handle missing CMS response fields
chore(deps): upgrade Next.js to 16.3
```
