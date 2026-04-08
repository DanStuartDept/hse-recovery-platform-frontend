import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import type { Metadata } from "next";

export type PageMetadataOptions = {
	/** Public site URL for canonical links (e.g., `"https://www.hse.ie"`). No trailing slash. */
	siteUrl: string;
	/** Request path including leading slash (e.g., `"/about/"`). */
	path: string;
	/** Fallback description when the CMS page has no `search_description`. */
	defaultDescription?: string;
};

/**
 * Translates CMS page fields into a Next.js `Metadata` object.
 *
 * Designed for use inside `generateMetadata` in a catch-all route.
 * Returns page-level overrides that Next.js merges with layout defaults
 * (title template, metadataBase, etc.).
 *
 * @example
 * ```ts
 * export async function generateMetadata(props) {
 *   const page = await fetchPage(props);
 *   return generatePageMetadata(page, { siteUrl: config.siteUrl, path });
 * }
 * ```
 */
export function generatePageMetadata(
	page: CMSPageProps,
	options: PageMetadataOptions,
): Metadata {
	const { siteUrl, path, defaultDescription } = options;
	const description = page.meta.search_description || defaultDescription;

	return {
		title: page.meta.seo_title || page.title,
		...(description && { description }),
		alternates: {
			canonical: `${siteUrl}${path}`,
		},
	};
}
