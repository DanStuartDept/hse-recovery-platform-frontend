# @repo/typescript-config

Shared tsconfig base files for the monorepo.

## Usage

Add the package as a dev dependency in a workspace package:

```
"@repo/typescript-config": "workspace:^"
```

Then extend the appropriate base in `tsconfig.json`:

```json
{ "extends": "@repo/typescript-config/base.json" }
```

## Available configs

| File                | Use for                                                       |
| ------------------- | ------------------------------------------------------------- |
| `base.json`         | Any TypeScript package — strict mode, `noEmit`, ESNext module |
| `nextjs.json`       | Next.js App Router apps — adds `jsx: preserve`, `dom` libs, incremental |
| `react-library.json`| React component libraries — adds `jsx: react-jsx`, ES2015 lib |

All configs enable `strict`, `strictNullChecks`, `isolatedModules`, and `skipLibCheck`.
