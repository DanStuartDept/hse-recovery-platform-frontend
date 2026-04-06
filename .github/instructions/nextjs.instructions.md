---
description: "Next.js 16 App Router conventions — Server Components, async params, Wagtail CMS integration, HSE design system."
applyTo: "apps/**"
---

# Next.js App Router Conventions

## IMPORTANT: Read the bundled docs first

**Before writing Next.js code, check `node_modules/next/dist/docs/01-app/` for current API documentation.** Training data may not reflect Next.js 16 changes. Also check `AGENTS.md` in the app root for version-specific deprecation warnings.

## Server vs Client Components

- **Server Components by default.** Only add `"use client"` when the component needs interactivity, hooks, browser APIs, or event handlers.
- No Node.js runtime APIs in edge/serverless functions.

## Breaking Change: Async Params (Next.js 16)

`params` and `searchParams` are now **async** — you must `await` them:

```typescript
// Correct (Next.js 16)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
}

// Wrong — will error
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // Error: params is a Promise
}
```

## CMS Integration

- Use `CMSClient` from `@repo/wagtail-api-client` for all CMS data fetching.
- Validate responses with Zod schemas from `@repo/wagtail-cms-types`.
- Fetch in Server Components — never in Client Components.

## UI Components

- Use `@hseireland/hse-frontend-react` components before building custom.
- Use `@hseireland/hse-frontend` SCSS tokens for any custom styling.
- Layout: `<Container>` → `<Row>` → `<Col>`.

## Conventions

- `next/image` for all images with `width`, `height`, `alt`.
- `next/font` for font loading at the layout level.
- `<Suspense>` boundaries and `loading.tsx` for streaming/loading states.
- `error.tsx` for error boundaries at route segments.
- Server Actions for form mutations, not API routes.

## Tooling

- **Biome** for linting (not ESLint). Run `pnpm lint`.
- **Vitest** for testing (not Jest). Run `turbo run test --filter=<app>`.
