# @repo/vitest-config

Shared Vitest configuration for the monorepo.

## Usage

Add the package as a dev dependency in a workspace package:

```
"@repo/vitest-config": "workspace:^"
```

Then compose it in `vitest.config.ts`:

```ts
import { createVitestConfig } from '@repo/vitest-config'

export default createVitestConfig({
  include: [
    'src/**/*.{js,jsx,ts,tsx}', 
  ],
  setupFile: './vitest.setup.ts',
})

```

## Configuration Options

The `createVitestConfig` function accepts an options object with the following properties:

### `include?: string[]`
**Optional.** Array of glob patterns for files to include in coverage reporting.

```ts
include: ['src/**/*.{ts,tsx}']
```

### `exclude?: string[]`
**Optional.** Array of glob patterns for additional files to exclude from coverage (beyond the default exclusions).

```ts
exclude: ['src/legacy/**/*']
```

### `setupFile?: string`
**Optional.** Path to a setup file that runs before each test file.

```ts
setupFile: './vitest.setup.ts'
```

### `environment?: 'jsdom' | 'node'`
**Optional.** Test environment to use. Defaults to `'jsdom'`.

```ts
environment: 'node' // for Node.js testing without DOM
```

## Features:

- React + tsconfig paths plugins
- jsdom environment
- globals enabled
- v8 coverage with text + lcov reporters
- standard exclusion patterns

Do not add `vitest`, `jsdom`, or `@vitest/coverage-v8` separately to consuming packages; they are provided here.
