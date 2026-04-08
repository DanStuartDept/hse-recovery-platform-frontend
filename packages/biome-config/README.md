# @repo/biome-config

Shared Biome v2 configuration presets for the monorepo.

## Usage

Add the package as a dev dependency in a workspace package:

```
"@repo/biome-config": "workspace:^"
```

Then extend the appropriate preset in `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "root": false,
  "extends": ["@repo/biome-config/base"]
}
```

## Available presets

| File                 | Use for                                                        |
| -------------------- | -------------------------------------------------------------- |
| `base.json`          | Any TypeScript package — core lint rules, formatter settings   |
| `next.json`          | Next.js apps — adds Next.js and React domain rules             |
| `react-internal.json`| Internal React libraries — recommended rules with React support|

All presets enforce tabs (indent-width 2), double quotes, and import organisation via Biome Assist.

Run `pnpm lint` from the repo root to auto-fix across all packages.
