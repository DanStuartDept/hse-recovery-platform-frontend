/**
 * Extracts the pathname from a Wagtail `html_url` field.
 * Returns `"/"` if the URL is malformed.
 *
 * @example
 * extractPath("https://cms.example.com/about/")  // "/about/"
 * extractPath("invalid")                          // "/"
 */
export function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		return "/";
	}
}
