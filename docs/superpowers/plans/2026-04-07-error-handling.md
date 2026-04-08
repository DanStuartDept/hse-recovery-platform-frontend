# Error Handling — Error Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `not-found.tsx`, `error.tsx`, and `global-error.tsx` to the hse-multisite-template so 404s and runtime errors show user-friendly pages matching the HSE design system.

**Architecture:** Three files in `apps/hse-multisite-template/src/app/`. `not-found.tsx` is a Server Component matching the live hse.ie 404 page. `error.tsx` and `global-error.tsx` are Client Components (React error boundaries) that log errors via `@repo/logger` in local dev. All use `Container`, `Row`, `Col` from the HSE design system.

**Tech Stack:** Next.js 16 App Router, `@hseireland/hse-frontend-react`, `@repo/logger`, `@repo/app-config`, Vitest, Testing Library

**IMPORTANT — Next.js 16 breaking change:** `error.tsx` receives `unstable_retry` (not `reset`) as the retry callback prop.

---

## File Map

| File                                                        | Action | Responsibility                            |
| ----------------------------------------------------------- | ------ | ----------------------------------------- |
| `apps/hse-multisite-template/package.json`                  | Modify | Add `@repo/logger` dep, testing devDeps   |
| `apps/hse-multisite-template/vitest.config.mts`             | Modify | Switch to `createVitestConfig` with jsdom |
| `apps/hse-multisite-template/src/vitest.setup.ts`           | Create | Import jest-dom matchers                  |
| `apps/hse-multisite-template/src/app/not-found.tsx`         | Create | 404 page matching hse.ie                  |
| `apps/hse-multisite-template/src/app/not-found.test.tsx`    | Create | Render test for 404 page                  |
| `apps/hse-multisite-template/src/app/error.tsx`             | Create | Route-segment error boundary              |
| `apps/hse-multisite-template/src/app/error.test.tsx`        | Create | Render + behaviour test                   |
| `apps/hse-multisite-template/src/app/global-error.tsx`      | Create | Root-layout error fallback                |
| `apps/hse-multisite-template/src/app/global-error.test.tsx` | Create | Render + behaviour test                   |

---

### Task 1: Set up dependencies and React testing infrastructure

**Files:**

- Modify: `apps/hse-multisite-template/package.json`
- Modify: `apps/hse-multisite-template/vitest.config.mts`
- Create: `apps/hse-multisite-template/src/vitest.setup.ts`

- [ ] **Step 1: Add @repo/logger as an app dependency**

```bash
cd apps/hse-multisite-template && pnpm add @repo/logger@"workspace:*"
```

- [ ] **Step 2: Add React testing libraries as devDependencies**

```bash
cd apps/hse-multisite-template && pnpm add -D @testing-library/react@^16.2.0 @testing-library/jest-dom@"catalog:" @repo/vitest-config@"workspace:*"
```

- [ ] **Step 3: Create vitest.setup.ts**

Create `apps/hse-multisite-template/src/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Replace vitest.config.mts with shared factory**

Replace the contents of `apps/hse-multisite-template/vitest.config.mts` with:

```ts
import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
  include: ["src/**/*.{ts,tsx}"],
  exclude: ["src/vitest.setup.ts"],
  setupFile: "src/vitest.setup.ts",
});
```

This switches from raw `defineConfig` to the shared factory, which provides jsdom environment, React plugin, tsconfig paths, and coverage configuration.

- [ ] **Step 5: Verify existing tests still pass**

```bash
cd apps/hse-multisite-template && pnpm vitest run
```

Expected: The existing `security-headers.test.ts` passes. The environment change from `node` to `jsdom` should not affect it.

- [ ] **Step 6: Commit**

```bash
git add apps/hse-multisite-template/package.json apps/hse-multisite-template/vitest.config.mts apps/hse-multisite-template/src/vitest.setup.ts pnpm-lock.yaml
git commit -m "chore(apps): add logger dep and React testing infrastructure to app template"
```

---

### Task 2: Create not-found.tsx

**Files:**

- Create: `apps/hse-multisite-template/src/app/not-found.test.tsx`
- Create: `apps/hse-multisite-template/src/app/not-found.tsx`

- [ ] **Step 1: Write the test**

Create `apps/hse-multisite-template/src/app/not-found.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("not-found", () => {
  it("renders the page not found heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  });

  it("renders helpful copy", () => {
    render(<NotFound />);
    expect(screen.getByText("We cannot find the page you are looking for.")).toBeInTheDocument();
    expect(screen.getByText(/The link may be broken/)).toBeInTheDocument();
    expect(screen.getByText("Check the URL you entered is correct.")).toBeInTheDocument();
  });

  it("renders the secondary heading", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { level: 2, name: "If you still cannot find what you're looking for" }),
    ).toBeInTheDocument();
  });

  it("renders popular links", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "health conditions and symptoms" })).toHaveAttribute(
      "href",
      "https://www2.hse.ie/conditions/",
    );
    expect(screen.getByRole("link", { name: "HSE staff news and information" })).toHaveAttribute(
      "href",
      "https://healthservice.hse.ie/staff/",
    );
    expect(screen.getByRole("link", { name: "HSE job search" })).toHaveAttribute(
      "href",
      "https://about.hse.ie/jobs/job-search/",
    );
    expect(screen.getByRole("link", { name: "information and news about the HSE" })).toHaveAttribute(
      "href",
      "https://about.hse.ie/",
    );
  });

  it("renders the contact link", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "https://www2.hse.ie/contact/");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/not-found.test.tsx
```

Expected: FAIL — `./not-found` module not found.

- [ ] **Step 3: Implement not-found.tsx**

Create `apps/hse-multisite-template/src/app/not-found.tsx`:

```tsx
import type { Metadata } from "next";
import { Col, Container, Row } from "@hseireland/hse-frontend-react";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Container>
      <Row>
        <Col width="two-thirds">
          <h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">Page not found</h1>
          <p className="hse-body-reg-m">We cannot find the page you are looking for.</p>
          <p className="hse-body-reg-m">The link may be broken, or the page may have been moved or deleted.</p>
          <p className="hse-body-reg-m">Check the URL you entered is correct.</p>
        </Col>
      </Row>
      <Row>
        <Col width="two-thirds">
          <h2 className="hse-u-text-color_hse-grey-900 hse-u-margin-top-4">
            If you still cannot find what you&apos;re looking for
          </h2>
          <p className="hse-body-reg-m">The information may be in a popular section, for example:</p>
          <ul>
            <li>
              <a href="https://www2.hse.ie/conditions/">health conditions and symptoms</a>
            </li>
            <li>
              <a href="https://healthservice.hse.ie/staff/">HSE staff news and information</a>
            </li>
            <li>
              <a href="https://about.hse.ie/jobs/job-search/">HSE job search</a>
            </li>
            <li>
              <a href="https://about.hse.ie/">information and news about the HSE</a>
            </li>
          </ul>
          <p className="hse-body-reg-m">
            <a href="https://www2.hse.ie/contact/">Contact us</a> if you have a question or want to give feedback.
          </p>
        </Col>
      </Row>
    </Container>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/not-found.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hse-multisite-template/src/app/not-found.tsx apps/hse-multisite-template/src/app/not-found.test.tsx
git commit -m "feat(apps): add 404 not-found page matching hse.ie design"
```

---

### Task 3: Create error.tsx

**Files:**

- Create: `apps/hse-multisite-template/src/app/error.test.tsx`
- Create: `apps/hse-multisite-template/src/app/error.tsx`

- [ ] **Step 1: Write the test**

Create `apps/hse-multisite-template/src/app/error.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

vi.mock("@repo/logger", () => ({ log: vi.fn() }));
vi.mock("@repo/app-config", () => ({ config: { isLocalhost: true } }));

import { log } from "@repo/logger";

const testError = new Error("test error");

describe("error", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the error heading", () => {
    render(<ErrorPage error={testError} unstable_retry={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  });

  it("renders a try again button that calls unstable_retry", async () => {
    const retry = vi.fn();
    render(<ErrorPage error={testError} unstable_retry={retry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("logs the error in localhost environment", () => {
    render(<ErrorPage error={testError} unstable_retry={vi.fn()} />);
    expect(log).toHaveBeenCalledWith("ErrorPage:", testError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/error.test.tsx
```

Expected: FAIL — `./error` module not found.

- [ ] **Step 3: Implement error.tsx**

Create `apps/hse-multisite-template/src/app/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { config } from "@repo/app-config";
import { log } from "@repo/logger";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (config.isLocalhost) {
      log("ErrorPage:", error);
    }
  }, [error]);

  return (
    <Container>
      <Row>
        <Col width="two-thirds">
          <h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">Something went wrong</h1>
          <p className="hse-body-reg-m">There was a problem loading this page. Please try again.</p>
          <button type="button" className="hse-button" onClick={() => unstable_retry()}>
            Try again
          </button>
        </Col>
      </Row>
    </Container>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/error.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Add @testing-library/user-event if not already installed**

Check if `userEvent` is available. If the test fails with a missing module error for `@testing-library/user-event`:

```bash
cd apps/hse-multisite-template && pnpm add -D @testing-library/user-event@^14.4.0
```

- [ ] **Step 6: Commit**

```bash
git add apps/hse-multisite-template/src/app/error.tsx apps/hse-multisite-template/src/app/error.test.tsx
git commit -m "feat(apps): add error boundary page with dev logging"
```

If `@testing-library/user-event` was added, also stage `package.json` and `pnpm-lock.yaml`.

---

### Task 4: Create global-error.tsx

**Files:**

- Create: `apps/hse-multisite-template/src/app/global-error.test.tsx`
- Create: `apps/hse-multisite-template/src/app/global-error.tsx`

- [ ] **Step 1: Write the test**

Create `apps/hse-multisite-template/src/app/global-error.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

vi.mock("@repo/logger", () => ({ log: vi.fn() }));
vi.mock("@repo/app-config", () => ({ config: { isLocalhost: true } }));

import { log } from "@repo/logger";

const testError = new Error("global test error");

describe("global-error", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the error heading", () => {
    render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  });

  it("renders its own html and body tags", () => {
    const { container } = render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
    expect(container.querySelector("html")).toBeInTheDocument();
    expect(container.querySelector("body")).toBeInTheDocument();
  });

  it("renders a try again button that calls unstable_retry", async () => {
    const retry = vi.fn();
    render(<GlobalError error={testError} unstable_retry={retry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("logs the error in localhost environment", () => {
    render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
    expect(log).toHaveBeenCalledWith("GlobalError:", testError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/global-error.test.tsx
```

Expected: FAIL — `./global-error` module not found.

- [ ] **Step 3: Implement global-error.tsx**

Create `apps/hse-multisite-template/src/app/global-error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { config } from "@repo/app-config";
import { log } from "@repo/logger";
import "@hseireland/hse-frontend/packages/hse.scss";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (config.isLocalhost) {
      log("GlobalError:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <Container>
          <Row>
            <Col width="two-thirds">
              <h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">Something went wrong</h1>
              <p className="hse-body-reg-m">There was a problem loading this page. Please try again.</p>
              <button type="button" className="hse-button" onClick={() => unstable_retry()}>
                Try again
              </button>
            </Col>
          </Row>
        </Container>
      </body>
    </html>
  );
}
```

**Key difference from `error.tsx`:** Imports `hse.scss` directly and renders its own `<html>` and `<body>` because the root layout has errored and is unavailable.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/hse-multisite-template && pnpm vitest run src/app/global-error.test.tsx
```

Expected: All 4 tests PASS. If the SCSS import causes issues in the test environment (vitest may not handle `.scss` by default), add a mock in `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";

// Mock SCSS imports in tests
vi.mock("@hseireland/hse-frontend/packages/hse.scss", () => ({}));
```

- [ ] **Step 5: Run the full test suite**

```bash
cd apps/hse-multisite-template && pnpm vitest run
```

Expected: All tests pass — `security-headers.test.ts` plus the three new test files.

- [ ] **Step 6: Commit**

```bash
git add apps/hse-multisite-template/src/app/global-error.tsx apps/hse-multisite-template/src/app/global-error.test.tsx
git commit -m "feat(apps): add global-error boundary page with dev logging"
```

If `vitest.setup.ts` was modified to mock SCSS, also stage it.

---

### Task 5: Run full workspace checks and update backlog

**Files:**

- Modify: `docs/repo-backlog-and-improvements.md`

- [ ] **Step 1: Run typecheck across the workspace**

```bash
turbo run typecheck --filter=hse-multisite-template
```

Expected: PASS — no type errors.

- [ ] **Step 2: Run all tests across the workspace**

```bash
turbo run test --filter=hse-multisite-template
```

Expected: All tests pass.

- [ ] **Step 3: Run lint**

```bash
turbo run lint --filter=hse-multisite-template
```

Expected: PASS — Biome finds no issues (or auto-fixes them).

- [ ] **Step 4: Update the backlog doc**

In `docs/repo-backlog-and-improvements.md`, update item #7:

- In the summary table row for #7, change the "Depends on" column to indicate partial completion: `In progress`
- Add a note at the top of section 7 body: `**Partial.** Error pages (`not-found.tsx`, `error.tsx`, `global-error.tsx`) implemented. Remaining: CMS degraded mode, Zod validation error surfacing.`
- Keep existing bullets as-is.

```bash
git add docs/repo-backlog-and-improvements.md
git commit -m "docs: update backlog #7 with error pages progress"
```
