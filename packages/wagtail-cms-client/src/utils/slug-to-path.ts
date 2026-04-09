/**
 * Converts a Next.js catch-all route slug array into the trailing-slash path
 * format expected by `CMSClient.findPageByPath()`.
 *
 * @example
 * slugToPath(undefined)                        // "/"
 * slugToPath(["about"])                        // "/about/"
 * slugToPath(["services", "mental-health"])    // "/services/mental-health/"
 */
export function slugToPath(slug?: string[]): string {
	if (!slug || slug.length === 0) {
		return "/";
	}
	return `/${slug.join("/")}/`;
}
