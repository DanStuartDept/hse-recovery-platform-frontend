---
name: "New Local Component"
description: "Create a custom composite component in the app, built from design system elements, with tests"
mode: "agent"
---

# New Local Component

Create a custom composite component local to the app, composed from `@hseireland/hse-frontend-react` elements.

## Variables

- `COMPONENT_NAME`: PascalCase component name (e.g., `ServiceCard`)
- `PURPOSE`: What the component does

## Step 1: Check the design system first

Before creating a custom component, verify it doesn't already exist:

1. Check the component catalogue in `.github/skills/hse-design-system/SKILL.md`
2. Use the Storybook MCP at `http://localhost:6006/mcp` to search for similar components
3. Only proceed if no existing component serves the purpose

## Step 2: Create the component

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/{ComponentName}.tsx`

```typescript
import { Container, Row, Col } from "@hseireland/hse-frontend-react";
// Import other design system components as needed

export interface {ComponentName}Props {
  // Define props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // Compose from design system elements
    // Use SCSS tokens from @hseireland/hse-frontend for any custom styling
    // Do NOT add inline CSS or customize design system components
  );
}
```

If the component needs interactivity, add `"use client"` directive at the top.

## Step 3: Create test file

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/{ComponentName}.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { {ComponentName} } from "./{ComponentName}";

describe("{ComponentName}", () => {
  it("renders correctly", () => {
    render(<{ComponentName} /* required props */ />);
    // Test key elements are present
  });
});
```

Run: `cd apps/hse-multisite-template && pnpm vitest run src/components/{ComponentName}/{ComponentName}.test.tsx`

## Step 4: Export from index

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/index.ts`

```typescript
export { {ComponentName} } from "./{ComponentName}";
export type { {ComponentName}Props } from "./{ComponentName}";
```
