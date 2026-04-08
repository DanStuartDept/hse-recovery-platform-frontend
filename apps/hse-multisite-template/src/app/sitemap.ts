import { config } from "@repo/app-config";
import { warn } from "@repo/logger";
import type {
	CMSPageContent,
	CMSPageContents,
} from "@repo/wagtail-cms-types/core";
import type { MetadataRoute } from "next";

import { cmsClient } from "@/lib/cms/client";
import { i18nConfig } from "@/lib/i18n/config";

/** Revalidate the sitemap every hour — not generated at build time. */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const PAGE_SIZE = 20;

/** Paginates through the Wagtail pages API for a given locale. */
async function fetchAllPages(locale: string): Promise<CMSPageContent[]> {
	const allItems: CMSPageContent[] = [];
	let offset = 0;

	try {
		for (;;) {
			const batch = await cmsClient.fetchPages<CMSPageContents>({
				locale,
				limit: PAGE_SIZE,
				offset,
			});

			allItems.push(...batch.items);

			if (
				allItems.length >= batch.meta.total_count ||
				batch.items.length === 0
			) {
				break;
			}

			offset += batch.items.length;
		}
	} catch (err) {
		warn("[Sitemap] CMS fetch failed, returning partial results:", err);
		return allItems;
	}

	return allItems;
}

/** Extracts the path portion from a Wagtail `html_url`. */
function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		warn("[Sitemap] Malformed URL, defaulting to /:", htmlUrl);
		return "/";
	}
}

/**
 * Generates a single `/sitemap.xml` with entries for all configured locales.
 *
 * Default locale pages have no URL prefix; non-default locales are prefixed
 * (e.g. `/ga/about/`). Pages are fetched per-locale from the Wagtail API.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const entries: MetadataRoute.Sitemap = [];

	for (const locale of i18nConfig.locales) {
		const isDefaultLocale = locale === i18nConfig.defaultLocale;
		const pages = await fetchAllPages(locale);

		for (const page of pages) {
			const path = extractPath(page.meta.html_url);
			const prefix = isDefaultLocale ? "" : `/${locale}`;

			entries.push({
				url: `${config.siteUrl}${prefix}${path}`,
				lastModified: page.meta.last_published_at,
			});
		}
	}

	return entries;
}
