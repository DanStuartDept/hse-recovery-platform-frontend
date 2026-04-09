import type { NotFoundContents } from "@repo/wagtail-cms-types/core";

/**
 * Type guard that checks whether a CMS response is a `NotFoundContents` error.
 * Matches the shape `{ message: string, data: unknown }` returned by `CMSClient`
 * when a fetch fails or a resource is not found.
 */
export function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null &&
		typeof response === "object" &&
		"message" in response &&
		typeof (response as Record<string, unknown>).message === "string" &&
		"data" in response
	);
}
