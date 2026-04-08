# @repo/logger

Thin console wrapper that prefixes all output with `LOGGER: `.

## Usage

```typescript
import { log, warn, error } from "@repo/logger";

log("Server started");        // console.log("LOGGER: ", "Server started")
warn("Cache miss", path);     // console.warn("LOGGER: ", "Cache miss", path)
error("Fetch failed", err);   // console.error("LOGGER: ", "Fetch failed", err)
```

Each function accepts any number of arguments and forwards them to the corresponding `console.*` method after the prefix. The API mirrors `console.log` / `console.warn` / `console.error` exactly.

## Architecture

Built with **bunchee** to dual ESM + CJS output. TypeScript imports use `.js` extensions.
