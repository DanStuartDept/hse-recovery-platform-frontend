# @repo/app-config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a source-only package that centralises env var reading, Zod validation, and typed config access for all monorepo apps.

**Architecture:** Source-only package with two entry points — `@repo/app-config` (client-safe NEXT*PUBLIC*\* config) and `@repo/app-config/server` (server-only secrets). Zod validates at import time; throws on missing required vars, returns `undefined` for missing optional vars. Test escape hatch provides a stub config when `NODE_ENV=test`.

**Tech Stack:** TypeScript, Zod 4.3.6, Vitest

---

### Task 1: Scaffold the package

**Files:**

- Create: `packages/app-config/package.json`
- Create: `packages/app-config/tsconfig.json`
- Create: `packages/app-config/biome.json`
- Create: `packages/app-config/vitest.config.mts`

- [ ] **Step 1: Create `packages/app-config/package.json`**

```json
{
  "name": "@repo/app-config",
  "version": "0.0.0",
  "private": true,
  "description": "Centralised environment variable validation and typed config for all apps",
  "exports": {
    ".": "./src/index.ts",
    "./server": "./src/server.ts"
  },
  "scripts": {
    "build": "echo 'Source-only package — no build step'",
    "lint": "biome check --write",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:ci": "vitest run --coverage",
    "clean": "rm -rf node_modules"
  },
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*",
    "@types/node": "catalog:",
    "@vitest/coverage-v8": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "vitest-sonar-reporter": "catalog:"
  }
}
```

- [ ] **Step 2: Create `packages/app-config/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "lib": ["ES2015"],
    "sourceMap": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["."],
  "exclude": ["dist", "build", "node_modules"]
}
```

Note: Uses `base.json` (not `react-library.json`) since this package has no JSX.

- [ ] **Step 3: Create `packages/app-config/biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "root": false,
  "extends": ["@repo/biome-config/base"]
}
```

- [ ] **Step 4: Create `packages/app-config/vitest.config.mts`**

```typescript
import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
  include: ["src/**/*.ts"],
  exclude: ["src/index.ts"],
  environment: "node",
});
```

Note: Uses `environment: "node"` since this package reads `process.env` — no DOM needed.

- [ ] **Step 5: Install dependencies**

Run: `pnpm install`
Expected: Resolves successfully, new lockfile entries for `packages/app-config`.

- [ ] **Step 6: Commit**

```bash
git add packages/app-config/package.json packages/app-config/tsconfig.json packages/app-config/biome.json packages/app-config/vitest.config.mts pnpm-lock.yaml
git commit -m "chore(app-config): scaffold source-only package"
```

---

### Task 2: Zod schemas

**Files:**

- Create: `packages/app-config/src/schemas.ts`
- Create: `packages/app-config/src/schemas.test.ts`

- [ ] **Step 1: Write failing tests for schemas**

Create `packages/app-config/src/schemas.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { clientSchema, gtmSchema, oneTrustSchema, piwikSchema, serverSchema } from "./schemas";

describe("clientSchema", () => {
  const validInput = {
    cms: { baseURL: "https://cms.hse.ie", apiPath: "/api/v2" },
    environment: "dev" as const,
    siteUrl: "https://dev.hse.ie",
  };

  it("accepts valid input", () => {
    expect(clientSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects missing cms.baseURL", () => {
    const input = { ...validInput, cms: { baseURL: "", apiPath: "/api/v2" } };
    expect(() => clientSchema.parse(input)).toThrow();
  });

  it("rejects missing cms.apiPath", () => {
    const input = { ...validInput, cms: { baseURL: "https://cms.hse.ie", apiPath: "" } };
    expect(() => clientSchema.parse(input)).toThrow();
  });

  it("rejects invalid environment value", () => {
    const input = { ...validInput, environment: "staging" };
    expect(() => clientSchema.parse(input)).toThrow();
  });

  it("rejects invalid siteUrl (not a URL)", () => {
    const input = { ...validInput, siteUrl: "not-a-url" };
    expect(() => clientSchema.parse(input)).toThrow();
  });

  it("accepts all valid environment values", () => {
    for (const env of ["localhost", "dev", "pre-prod", "prod"] as const) {
      const input = { ...validInput, environment: env };
      expect(clientSchema.parse(input).environment).toBe(env);
    }
  });
});

describe("gtmSchema", () => {
  it("accepts a non-empty string", () => {
    expect(gtmSchema.safeParse("GTM-XXXX").success).toBe(true);
  });

  it("returns undefined when input is undefined", () => {
    const result = gtmSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("rejects an empty string", () => {
    expect(gtmSchema.safeParse("").success).toBe(false);
  });
});

describe("oneTrustSchema", () => {
  it("accepts a non-empty string", () => {
    expect(oneTrustSchema.safeParse("domain-id-123").success).toBe(true);
  });

  it("returns undefined when input is undefined", () => {
    const result = oneTrustSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("rejects an empty string", () => {
    expect(oneTrustSchema.safeParse("").success).toBe(false);
  });
});

describe("piwikSchema", () => {
  it("accepts both fields present", () => {
    const result = piwikSchema.safeParse({
      containerId: "abc-123",
      containerUrl: "https://hse.piwik.pro",
    });
    expect(result.success).toBe(true);
  });

  it("returns undefined when input is undefined", () => {
    const result = piwikSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("rejects missing containerUrl", () => {
    const result = piwikSchema.safeParse({ containerId: "abc-123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing containerId", () => {
    const result = piwikSchema.safeParse({ containerUrl: "https://hse.piwik.pro" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid containerUrl", () => {
    const result = piwikSchema.safeParse({
      containerId: "abc-123",
      containerUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("serverSchema", () => {
  it("accepts valid input", () => {
    const input = { previewToken: "token-1", revalidateToken: "token-2" };
    expect(serverSchema.parse(input)).toEqual(input);
  });

  it("rejects missing previewToken", () => {
    expect(() => serverSchema.parse({ previewToken: "", revalidateToken: "token-2" })).toThrow();
  });

  it("rejects missing revalidateToken", () => {
    expect(() => serverSchema.parse({ previewToken: "token-1", revalidateToken: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/app-config && pnpm vitest run src/schemas.test.ts`
Expected: FAIL — `Cannot find module './schemas'`

- [ ] **Step 3: Implement schemas**

Create `packages/app-config/src/schemas.ts`:

```typescript
import { z } from "zod";

/** Schema for required client-side environment variables. */
export const clientSchema = z.object({
  cms: z.object({
    baseURL: z.string().min(1),
    apiPath: z.string().min(1),
  }),
  environment: z.enum(["localhost", "dev", "pre-prod", "prod"]),
  siteUrl: z.string().url(),
});

/** Schema for optional GTM ID. */
export const gtmSchema = z.string().min(1).optional();

/** Schema for optional OneTrust domain ID. */
export const oneTrustSchema = z.string().min(1).optional();

/** Schema for optional Piwik Pro settings — both fields required if either is set. */
export const piwikSchema = z
  .object({
    containerId: z.string().min(1),
    containerUrl: z.string().url(),
  })
  .optional();

/** Schema for required server-only secrets. */
export const serverSchema = z.object({
  previewToken: z.string().min(1),
  revalidateToken: z.string().min(1),
});
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/app-config && pnpm vitest run src/schemas.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/app-config/src/schemas.ts packages/app-config/src/schemas.test.ts
git commit -m "feat(app-config): add Zod validation schemas"
```

---

### Task 3: Client config with test escape hatch

**Files:**

- Create: `packages/app-config/src/client.ts`
- Create: `packages/app-config/src/client.test.ts`

- [ ] **Step 1: Write failing tests for client config**

Create `packages/app-config/src/client.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Helper: sets all required NEXT_PUBLIC_* env vars. */
function setRequiredEnv(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    NEXT_PUBLIC_CMS_API_ENDPOINT: "https://cms.hse.ie",
    NEXT_PUBLIC_API_PATH: "/api/v2",
    NEXT_PUBLIC_ENVIRONMENT_NAME: "dev",
    NEXT_PUBLIC_SITEURL: "https://dev.hse.ie",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    process.env[key] = value;
  }
}

/** Helper: clears all NEXT_PUBLIC_* env vars used by client config. */
function clearEnv() {
  for (const key of [
    "NEXT_PUBLIC_CMS_API_ENDPOINT",
    "NEXT_PUBLIC_API_PATH",
    "NEXT_PUBLIC_ENVIRONMENT_NAME",
    "NEXT_PUBLIC_SITEURL",
    "NEXT_PUBLIC_GTM_ID",
    "NEXT_PUBLIC_ONETRUST_DOMAIN_ID",
    "NEXT_PUBLIC_PIWIK_CONTAINER_ID",
    "NEXT_PUBLIC_PIWIK_CONTAINER_URL",
    "NODE_ENV",
  ]) {
    delete process.env[key];
  }
}

describe("client config — test escape hatch", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
  });

  afterEach(() => {
    clearEnv();
  });

  it("exports stub config when NODE_ENV is test", async () => {
    process.env.NODE_ENV = "test";
    const { config } = await import("./client");
    expect(config.cms).toEqual({ baseURL: "", apiPath: "" });
    expect(config.environment).toBe("localhost");
    expect(config.siteUrl).toBe("http://localhost:3000");
    expect(config.isLocalhost).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.analyticsEnabled).toBe(false);
  });
});

describe("client config — validation", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    clearEnv();
  });

  it("returns typed AppConfig when all required vars are present", async () => {
    setRequiredEnv();
    const { config } = await import("./client");
    expect(config.cms.baseURL).toBe("https://cms.hse.ie");
    expect(config.cms.apiPath).toBe("/api/v2");
    expect(config.environment).toBe("dev");
    expect(config.siteUrl).toBe("https://dev.hse.ie");
  });

  it("throws when NEXT_PUBLIC_CMS_API_ENDPOINT is missing", async () => {
    setRequiredEnv();
    delete process.env.NEXT_PUBLIC_CMS_API_ENDPOINT;
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_API_PATH is missing", async () => {
    setRequiredEnv();
    delete process.env.NEXT_PUBLIC_API_PATH;
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_ENVIRONMENT_NAME is missing", async () => {
    setRequiredEnv();
    delete process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_ENVIRONMENT_NAME is invalid", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "staging" });
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_SITEURL is missing", async () => {
    setRequiredEnv();
    delete process.env.NEXT_PUBLIC_SITEURL;
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("throws when NEXT_PUBLIC_SITEURL is not a URL", async () => {
    setRequiredEnv({ NEXT_PUBLIC_SITEURL: "not-a-url" });
    await expect(() => import("./client")).rejects.toThrow();
  });

  it("config object is frozen", async () => {
    setRequiredEnv();
    const { config } = await import("./client");
    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe("client config — optional variables", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    clearEnv();
  });

  it("gtmId is undefined when NEXT_PUBLIC_GTM_ID is not set", async () => {
    setRequiredEnv();
    const { config } = await import("./client");
    expect(config.gtmId).toBeUndefined();
  });

  it("gtmId is the value when NEXT_PUBLIC_GTM_ID is set", async () => {
    setRequiredEnv();
    process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
    const { config } = await import("./client");
    expect(config.gtmId).toBe("GTM-XXXX");
  });

  it("oneTrustDomainId is undefined when not set", async () => {
    setRequiredEnv();
    const { config } = await import("./client");
    expect(config.oneTrustDomainId).toBeUndefined();
  });

  it("oneTrustDomainId is the value when set", async () => {
    setRequiredEnv();
    process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID = "domain-123";
    const { config } = await import("./client");
    expect(config.oneTrustDomainId).toBe("domain-123");
  });

  it("piwik is undefined when neither Piwik var is set", async () => {
    setRequiredEnv();
    const { config } = await import("./client");
    expect(config.piwik).toBeUndefined();
  });

  it("piwik is undefined when only PIWIK_CONTAINER_ID is set (missing URL)", async () => {
    setRequiredEnv();
    process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID = "abc-123";
    const { config } = await import("./client");
    expect(config.piwik).toBeUndefined();
  });

  it("piwik is populated when both Piwik vars are set", async () => {
    setRequiredEnv();
    process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID = "abc-123";
    process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL = "https://hse.piwik.pro";
    const { config } = await import("./client");
    expect(config.piwik).toEqual({
      containerId: "abc-123",
      containerUrl: "https://hse.piwik.pro",
    });
  });
});

describe("client config — derived helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    clearEnv();
  });

  it("environment localhost → isLocalhost: true, isProduction: false", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "localhost" });
    const { config } = await import("./client");
    expect(config.isLocalhost).toBe(true);
    expect(config.isProduction).toBe(false);
  });

  it("environment prod → isLocalhost: false, isProduction: true", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "prod" });
    const { config } = await import("./client");
    expect(config.isLocalhost).toBe(false);
    expect(config.isProduction).toBe(true);
  });

  it("environment dev with GTM configured → analyticsEnabled: true", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "dev" });
    process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
    const { config } = await import("./client");
    expect(config.analyticsEnabled).toBe(true);
  });

  it("environment localhost with GTM configured → analyticsEnabled: false", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "localhost" });
    process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
    const { config } = await import("./client");
    expect(config.analyticsEnabled).toBe(false);
  });

  it("environment dev with no analytics vars → analyticsEnabled: false", async () => {
    setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "dev" });
    const { config } = await import("./client");
    expect(config.analyticsEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/app-config && pnpm vitest run src/client.test.ts`
Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 3: Implement client config**

Create `packages/app-config/src/client.ts`:

```typescript
import { clientSchema, gtmSchema, oneTrustSchema, piwikSchema } from "./schemas";

/** Client-safe configuration from NEXT_PUBLIC_* env vars. */
export type AppConfig = {
  /** CMS connection settings — shape compatible with ClientOptions from `@repo/wagtail-api-client`. */
  cms: {
    /** Wagtail CMS base URL (e.g., `"https://cms.hse.ie"`). */
    baseURL: string;
    /** API version path (e.g., `"/api/v2"`). */
    apiPath: string;
  };
  /** Current deployment environment. */
  environment: "localhost" | "dev" | "pre-prod" | "prod";
  /** Public site URL for canonical links, sitemap, and OG tags. */
  siteUrl: string;
  /** Google Tag Manager container ID. `undefined` if not configured. */
  gtmId?: string;
  /** OneTrust cookie consent domain ID. `undefined` if not configured. */
  oneTrustDomainId?: string;
  /** Piwik Pro analytics settings. `undefined` if not configured. Both fields required if present. */
  piwik?: {
    /** Piwik Pro container ID. */
    containerId: string;
    /** Piwik Pro instance URL. */
    containerUrl: string;
  };
  /** `true` when environment is `"localhost"`. */
  isLocalhost: boolean;
  /** `true` when environment is `"prod"`. */
  isProduction: boolean;
  /** `true` when not localhost and at least one analytics integration is configured. */
  analyticsEnabled: boolean;
};

const TEST_CONFIG: AppConfig = {
  cms: { baseURL: "", apiPath: "" },
  environment: "localhost",
  siteUrl: "http://localhost:3000",
  isLocalhost: true,
  isProduction: false,
  analyticsEnabled: false,
};

function createConfig(): AppConfig {
  if (process.env.NODE_ENV === "test") {
    return TEST_CONFIG;
  }

  // Required — throws on missing/invalid
  const client = clientSchema.parse({
    cms: {
      baseURL: process.env.NEXT_PUBLIC_CMS_API_ENDPOINT,
      apiPath: process.env.NEXT_PUBLIC_API_PATH,
    },
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT_NAME,
    siteUrl: process.env.NEXT_PUBLIC_SITEURL,
  });

  // Optional — undefined if missing/invalid
  const gtmResult = gtmSchema.safeParse(process.env.NEXT_PUBLIC_GTM_ID);
  const gtmId = gtmResult.success ? gtmResult.data : undefined;

  const oneTrustResult = oneTrustSchema.safeParse(process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID);
  const oneTrustDomainId = oneTrustResult.success ? oneTrustResult.data : undefined;

  // Piwik: only validate if at least one env var is set
  const rawPiwikId = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID;
  const rawPiwikUrl = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL;
  const piwikInput = rawPiwikId || rawPiwikUrl ? { containerId: rawPiwikId, containerUrl: rawPiwikUrl } : undefined;
  const piwikResult = piwikSchema.safeParse(piwikInput);
  const piwik = piwikResult.success ? piwikResult.data : undefined;

  // Derived helpers
  const isLocalhost = client.environment === "localhost";
  const isProduction = client.environment === "prod";
  const hasAnalytics = gtmId !== undefined || oneTrustDomainId !== undefined || piwik !== undefined;
  const analyticsEnabled = !isLocalhost && hasAnalytics;

  return {
    ...client,
    gtmId,
    oneTrustDomainId,
    piwik,
    isLocalhost,
    isProduction,
    analyticsEnabled,
  };
}

/** Client-safe app configuration. Validated at import time. */
export const config: AppConfig = Object.freeze(createConfig());
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/app-config && pnpm vitest run src/client.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/app-config/src/client.ts packages/app-config/src/client.test.ts
git commit -m "feat(app-config): add client config with validation and test escape hatch"
```

---

### Task 4: Server config

**Files:**

- Create: `packages/app-config/src/server.ts`
- Create: `packages/app-config/src/server.test.ts`

- [ ] **Step 1: Write failing tests for server config**

Create `packages/app-config/src/server.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function clearEnv() {
  delete process.env.PREVIEW_TOKEN;
  delete process.env.REVALIDATE_TOKEN;
  delete process.env.NODE_ENV;
}

describe("server config — test escape hatch", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
  });

  afterEach(() => {
    clearEnv();
  });

  it("exports stub config when NODE_ENV is test", async () => {
    process.env.NODE_ENV = "test";
    const { serverConfig } = await import("./server");
    expect(serverConfig.previewToken).toBe("");
    expect(serverConfig.revalidateToken).toBe("");
  });
});

describe("server config — validation", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    clearEnv();
  });

  it("returns typed ServerConfig when both tokens are present", async () => {
    process.env.PREVIEW_TOKEN = "preview-secret";
    process.env.REVALIDATE_TOKEN = "revalidate-secret";
    const { serverConfig } = await import("./server");
    expect(serverConfig.previewToken).toBe("preview-secret");
    expect(serverConfig.revalidateToken).toBe("revalidate-secret");
  });

  it("throws when PREVIEW_TOKEN is missing", async () => {
    process.env.REVALIDATE_TOKEN = "revalidate-secret";
    await expect(() => import("./server")).rejects.toThrow();
  });

  it("throws when REVALIDATE_TOKEN is missing", async () => {
    process.env.PREVIEW_TOKEN = "preview-secret";
    await expect(() => import("./server")).rejects.toThrow();
  });

  it("config object is frozen", async () => {
    process.env.PREVIEW_TOKEN = "preview-secret";
    process.env.REVALIDATE_TOKEN = "revalidate-secret";
    const { serverConfig } = await import("./server");
    expect(Object.isFrozen(serverConfig)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/app-config && pnpm vitest run src/server.test.ts`
Expected: FAIL — `Cannot find module './server'`

- [ ] **Step 3: Implement server config**

Create `packages/app-config/src/server.ts`:

```typescript
import { serverSchema } from "./schemas";

/** Server-only secrets — never import in client components. */
export type ServerConfig = {
  /** Shared secret for CMS preview API route authentication. */
  previewToken: string;
  /** Shared secret for CMS revalidation webhook authentication. */
  revalidateToken: string;
};

const TEST_SERVER_CONFIG: ServerConfig = {
  previewToken: "",
  revalidateToken: "",
};

function createServerConfig(): ServerConfig {
  if (process.env.NODE_ENV === "test") {
    return TEST_SERVER_CONFIG;
  }

  return serverSchema.parse({
    previewToken: process.env.PREVIEW_TOKEN,
    revalidateToken: process.env.REVALIDATE_TOKEN,
  });
}

/** Server-only configuration. Validated at import time. */
export const serverConfig: ServerConfig = Object.freeze(createServerConfig());
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/app-config && pnpm vitest run src/server.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/app-config/src/server.ts packages/app-config/src/server.test.ts
git commit -m "feat(app-config): add server config with validation"
```

---

### Task 5: Index entry point

**Files:**

- Create: `packages/app-config/src/index.ts`

- [ ] **Step 1: Create `packages/app-config/src/index.ts`**

```typescript
export { config } from "./client";
export type { AppConfig } from "./client";
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd packages/app-config && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Run full test suite for the package**

Run: `cd packages/app-config && pnpm test`
Expected: All tests PASS.

- [ ] **Step 4: Run lint**

Run: `cd packages/app-config && pnpm lint`
Expected: No errors (auto-fixes applied if any).

- [ ] **Step 5: Commit**

```bash
git add packages/app-config/src/index.ts
git commit -m "feat(app-config): add index entry point re-exporting client config"
```

---

### Task 6: App template .env.example

**Files:**

- Create: `apps/hse-multisite-template/.env.example`

- [ ] **Step 1: Create `apps/hse-multisite-template/.env.example`**

```
# Required — CMS
NEXT_PUBLIC_CMS_API_ENDPOINT=https://dev.cms.hse.ie
NEXT_PUBLIC_API_PATH=/api/v2
NEXT_PUBLIC_ENVIRONMENT_NAME=localhost
NEXT_PUBLIC_SITEURL=https://dev.hse.ie

# Required — server secrets
PREVIEW_TOKEN=your-preview-token
REVALIDATE_TOKEN=your-revalidate-token

# Optional — analytics/consent (not loaded in localhost)
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_ID=
NEXT_PUBLIC_PIWIK_CONTAINER_ID=
NEXT_PUBLIC_PIWIK_CONTAINER_URL=
```

- [ ] **Step 2: Add `@repo/app-config` dependency to the app template**

In `apps/hse-multisite-template/package.json`, add to `dependencies`:

```json
"@repo/app-config": "workspace:*"
```

- [ ] **Step 3: Install to update lockfile**

Run: `pnpm install`
Expected: Resolves successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/hse-multisite-template/.env.example apps/hse-multisite-template/package.json pnpm-lock.yaml
git commit -m "feat(hse-multisite-template): add .env.example and app-config dependency"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full monorepo build**

Run: `pnpm build`
Expected: All packages build successfully (app-config echoes "Source-only package — no build step").

- [ ] **Step 2: Run full monorepo test suite**

Run: `pnpm test`
Expected: All tests pass across all packages.

- [ ] **Step 3: Run full monorepo typecheck**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 4: Run full monorepo lint**

Run: `pnpm lint`
Expected: No lint errors.
