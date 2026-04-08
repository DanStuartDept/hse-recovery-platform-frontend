# Error Handling Design — Error Pages for hse-multisite-template

**Date:** 2026-04-07
**Backlog item:** #7 — Error Handling and Resilience (partial — error pages only)
**Status:** Approved

---

## Goal

Add `not-found.tsx`, `error.tsx`, and `global-error.tsx` to the template app so that 404s, runtime errors, and root-layout errors show user-friendly pages matching the HSE design system — instead of Next.js defaults.

## Scope

Error pages only. Out of scope for this ticket:

- CMS fallback / degraded mode (CMS unavailable = 404)
- Zod validation error surfacing
- loading.tsx / Suspense boundaries

## Files

All in `apps/hse-multisite-template/src/app/`:

| File               | Type             | Purpose                          |
| ------------------ | ---------------- | -------------------------------- |
| `not-found.tsx`    | Server Component | 404 page matching hse.ie pattern |
| `error.tsx`        | Client Component | Route-segment error boundary     |
| `global-error.tsx` | Client Component | Root-layout error fallback       |

---

## `not-found.tsx`

Server component (no `"use client"`). Mirrors the live hse.ie 404 page.

**Layout:** `Container` > `Row` > `Col width="two-thirds"` from `@hseireland/hse-frontend-react`.

**Content (matching hse.ie):**

- h1: "Page not found"
- "We cannot find the page you are looking for."
- "The link may be broken, or the page may have been moved or deleted."
- "Check the URL you entered is correct."
- h2: "If you still cannot find what you're looking for"
- "The information may be in a popular section, for example:"
- Links: health conditions and symptoms, HSE staff news and information, HSE job search, information and news about the HSE
- "Contact us if you have a question or want to give feedback."

**HSE utility classes** for spacing and typography: `hse-u-margin-bottom-6`, `hse-u-text-color_hse-grey-900`, `hse-u-margin-top-4`, `hse-body-reg-m` — applied via `className` props.

**Metadata:** Exports `metadata` with `title: "Page not found"`.

**Popular links** are hardcoded. Each app can customise when they fork the template.

---

## `error.tsx`

Client component (`"use client"`). React error boundary for route segments.

**Props:** `{ error: Error & { digest?: string }; reset: () => void }`

**Behaviour:**

- Shows "Something went wrong" heading with a brief message and a "Try again" button that calls `reset()`.
- Uses `Container` > `Row` > `Col width="two-thirds"` layout, same as 404.
- On mount, logs the error via `@repo/logger` (`log`) when `config.isLocalhost` is `true` (from `@repo/app-config`). Uses `useEffect` for the logging side effect.

**No metadata export** — client components can't export `metadata`.

---

## `global-error.tsx`

Client component (`"use client"`). Catches errors in the root layout itself.

**Props:** Same as `error.tsx`: `{ error: Error & { digest?: string }; reset: () => void }`

**Key difference:** Must render its own `<html>` and `<body>` tags since the root layout errored. Imports `@hseireland/hse-frontend/packages/hse.scss` directly for styling.

**Behaviour:**

- Same "Something went wrong" UI as `error.tsx`.
- Same dev-only logging via `@repo/logger` + `@repo/app-config`.
- Same "Try again" button calling `reset()`.

---

## Dependencies Used

| Package                          | Import                    | Used in                                                                |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `@hseireland/hse-frontend-react` | `Container`, `Row`, `Col` | All three files                                                        |
| `@hseireland/hse-frontend`       | SCSS import               | `global-error.tsx` only (layout.tsx already imports it for the others) |
| `@repo/logger`                   | `log`                     | `error.tsx`, `global-error.tsx`                                        |
| `@repo/app-config`               | `config`                  | `error.tsx`, `global-error.tsx` (for `isLocalhost` check)              |

## Testing

- `not-found.tsx`: Snapshot or render test — verify heading, copy, and links render correctly.
- `error.tsx`: Render test — verify heading, "Try again" button renders, and `reset` callback fires on click. Verify `log` is called in localhost environment.
- `global-error.tsx`: Render test — same as error.tsx plus verify it renders its own `<html>` and `<body>`.
