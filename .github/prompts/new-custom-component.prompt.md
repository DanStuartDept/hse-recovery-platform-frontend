---
name: "New Custom Component"
description: "Create a net-new component in @repo/hse-custom-ui using design system SCSS tokens"
mode: "agent"
---

# New Custom Component

Create a net-new component that doesn't exist in the HSE design system, using `@hseireland/hse-frontend` SCSS tokens for visual consistency.

> **Note:** The `@repo/hse-custom-ui` package does not exist yet. You may need to scaffold it first.

## Variables

- `COMPONENT_NAME`: PascalCase component name
- `PURPOSE`: What the component does

## Step 1: Check it doesn't exist

1. Search `.github/skills/hse-design-system/SKILL.md` for existing components
2. Check Storybook MCP at `http://localhost:6006/mcp`
3. Only create a custom component if nothing in the design system serves the purpose

## Step 2: Ensure package exists

**Directory:** `packages/hse-custom-ui/`

If the package doesn't exist, scaffold it:

```bash
mkdir -p packages/hse-custom-ui/src
```

Create `packages/hse-custom-ui/package.json`:
```json
{
  "name": "@repo/hse-custom-ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@hseireland/hse-frontend": "catalog:",
    "@hseireland/hse-frontend-react": "catalog:",
    "react": "catalog:"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*"
  }
}
```

Add to `pnpm-workspace.yaml` packages list if not already there.

## Step 3: Create the component

**File:** `packages/hse-custom-ui/src/{ComponentName}/{ComponentName}.tsx`

```typescript
// Import SCSS tokens from @hseireland/hse-frontend for visual consistency
// Import design system elements from @hseireland/hse-frontend-react to compose from
// Never hardcode colours, spacing, or breakpoints

export interface {ComponentName}Props {
  // Define props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // Build the component using design system foundations
  );
}
```

## Step 4: Create test file

**File:** `packages/hse-custom-ui/src/{ComponentName}/{ComponentName}.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { {ComponentName} } from "./{ComponentName}";

describe("{ComponentName}", () => {
  it("renders correctly", () => {
    render(<{ComponentName} /* required props */ />);
    // Assert key elements
  });
});
```

## Step 5: Export from package

**File:** `packages/hse-custom-ui/src/index.ts`

```typescript
export { {ComponentName} } from "./{ComponentName}/{ComponentName}";
export type { {ComponentName}Props } from "./{ComponentName}/{ComponentName}";
```
