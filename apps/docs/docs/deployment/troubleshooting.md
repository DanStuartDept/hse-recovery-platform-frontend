---
sidebar_position: 5
---

# Troubleshooting

## 401 or 403 when installing `@hseireland` packages

**Symptoms:** `pnpm install` fails with a 401 Unauthorized or 403 Forbidden error, usually mentioning `npm.pkg.github.com` or `@hseireland/hse-frontend`.

**Cause:** The `@hseireland` packages are hosted on GitHub Packages, which requires authentication even for read access.

**Fix:**

1. Confirm you have a GitHub Personal Access Token (classic) with the `read:packages` scope.
2. Set it in your environment before running `pnpm install`:
   ```bash
   export NPM_TOKEN=ghp_your_token_here
   pnpm install
   ```
3. For Docker builds, pass it as a BuildKit secret:
   ```bash
   docker build --secret id=NPM_TOKEN ...
   ```
4. For CI, ensure the `NPM_TOKEN` repository secret is set in **Settings → Secrets and variables → Actions**.

If the token is set but you are still seeing 403, the token may have expired or the scope may be `read:org` instead of `read:packages`. Generate a new token with the correct scope.

---

## `NEXT_PUBLIC_*` variables are undefined at runtime

**Symptoms:** The app starts but CMS requests fail, the environment name is wrong, or analytics do not fire. Inspecting the compiled JavaScript shows the variable as `undefined` or empty string.

**Cause:** `NEXT_PUBLIC_*` variables are **inlined by Next.js at build time**. Passing them as runtime environment variables (e.g., `-e NEXT_PUBLIC_CMS_API_ENDPOINT=...` at `docker run`) has no effect — the values are already baked into the bundle.

**Fix:** Pass all `NEXT_PUBLIC_*` variables as `--build-arg` during `docker build`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_CMS_API_ENDPOINT=https://cms.hse.ie \
  --build-arg NEXT_PUBLIC_API_PATH=/api/v2 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT_NAME=prod \
  --build-arg NEXT_PUBLIC_SITEURL=https://www.hse.ie \
  -f apps/hse-multisite-template/Dockerfile \
  ...
```

Only `PREVIEW_TOKEN` and `REVALIDATE_TOKEN` (which lack the `NEXT_PUBLIC_` prefix) should be passed at `docker run` time.

---

## Docker build fails: "cannot find module" or missing workspace package

**Symptoms:** The build fails during `pnpm install` or `turbo run build` with an error about a missing internal package (`@repo/wagtail-api-client`, `@repo/app-config`, etc.).

**Cause:** The Docker build was run from inside the app directory (`apps/hse-multisite-template/`) rather than the repo root. The build context does not include the workspace packages.

**Fix:** Always run `docker build` from the **repo root** with `-f` pointing at the Dockerfile:

```bash
# Correct — run from repo root
docker build -f apps/hse-multisite-template/Dockerfile .

# Wrong — missing workspace packages
cd apps/hse-multisite-template && docker build .
```

The trailing `.` must be the repo root. The `turbo prune` step in the Dockerfile depends on the full monorepo being present in the build context.

---

## Standalone output is missing static assets or public files

**Symptoms:** The container starts but CSS, images, or fonts return 404. The app renders without styles.

**Cause:** Next.js standalone output intentionally excludes the `.next/static/` directory and the `public/` directory to keep the output minimal. The Dockerfile copies them explicitly, but if you replicate the standalone pattern yourself you may miss this step.

**Fix:** Ensure the runner stage of your Dockerfile copies both directories:

```dockerfile
# Standalone server (includes pruned node_modules)
COPY --from=builder /app/apps/hse-multisite-template/.next/standalone ./

# Static assets — NOT included in standalone output
COPY --from=builder /app/apps/hse-multisite-template/.next/static \
     ./apps/hse-multisite-template/.next/static

# Public directory — NOT included in standalone output
COPY --from=builder /app/apps/hse-multisite-template/public \
     ./apps/hse-multisite-template/public
```

The path inside the runner must preserve the monorepo layout (`apps/hse-multisite-template/`) because the generated `server.js` references files using paths relative to the monorepo root.

---

## On-demand cache revalidation is not working

**Symptoms:** Content published in Wagtail does not appear on the site until the 1-hour ISR revalidation kicks in. Requests to `/api/revalidate/` return 401 or the path is not being invalidated.

**Possible causes and fixes:**

1. **`REVALIDATE_TOKEN` mismatch** — The token configured in Wagtail's webhook settings must exactly match the `REVALIDATE_TOKEN` environment variable in the running container. Check both ends. The variable is validated at startup (a blank token causes a startup error), but a value that does not match what Wagtail sends will result in a 401.

2. **Wrong path in revalidation request** — The webhook payload must include the correct page path. Check the Wagtail webhook configuration and the logs from the `/api/revalidate/` route handler.

3. **`REVALIDATE_TOKEN` not passed at runtime** — This is a runtime secret (no `NEXT_PUBLIC_` prefix). It must be passed as `-e REVALIDATE_TOKEN=...` to `docker run`, not as a build arg.

---

## `pnpm install` fails with lockfile mismatch

**Symptoms:** `pnpm install --frozen-lockfile` fails with an error saying the lockfile is out of date.

**Cause:** The `pnpm-lock.yaml` file does not match the current `package.json` files. This typically happens after merging a branch that updated dependencies without regenerating the lockfile.

**Fix:** Run `pnpm install` locally (without `--frozen-lockfile`) to update the lockfile, then commit the result:

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
```

In CI the `--frozen-lockfile` flag is intentional — it ensures that the installed tree exactly matches what was reviewed and committed. If the CI install fails with this error, the fix belongs in source control, not in the CI configuration.

---

## BuildKit not enabled / `--secret` flag not recognised

**Symptoms:** `docker build --secret id=NPM_TOKEN ...` fails with `unknown flag: --secret`.

**Cause:** The Docker CLI is using the legacy builder, which does not support BuildKit features like `--secret` or `--mount=type=cache`.

**Fix:** Enable BuildKit:

```bash
export DOCKER_BUILDKIT=1
docker build --secret id=NPM_TOKEN ...
```

BuildKit is enabled by default in Docker Desktop >= 20.10 and Docker Engine >= 23.0. If you are on an older version, upgrade Docker or set the environment variable as shown above.
