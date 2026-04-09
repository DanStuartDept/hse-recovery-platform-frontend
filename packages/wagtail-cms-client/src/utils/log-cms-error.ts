import { log, error as logError, warn } from "@repo/logger";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { FetchError } from "../lib/fetch.js";

/**
 * Classifies a CMS error by HTTP status and logs at the appropriate severity.
 *
 * - 404 or non-FetchError → `log` (expected, page doesn't exist)
 * - 5xx → `error` (server problem)
 * - status 0 → `error` (network unreachable)
 * - other → `warn` (unexpected client error)
 */
export function logCmsError(path: string, response: NotFoundContents): void {
	const fetchError = response.data instanceof FetchError ? response.data : null;

	if (!fetchError || fetchError.status === 404) {
		log(`[CMS] Page not found: ${path}`);
	} else if (fetchError.status >= 500) {
		logError(
			`[CMS] Server error ${fetchError.status} fetching ${path}:`,
			fetchError.message,
		);
	} else if (fetchError.status === 0) {
		logError(
			`[CMS] Unreachable — network error fetching ${path}:`,
			fetchError.message,
		);
	} else {
		warn(
			`[CMS] HTTP ${fetchError.status} fetching ${path}:`,
			fetchError.message,
		);
	}
}
