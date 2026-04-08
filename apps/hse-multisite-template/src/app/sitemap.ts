import { config } from "@repo/app-config";
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

/**
 * Requested page size. The Wagtail API may return fewer items if
 * `WAGTAILAPI_LIMIT_MAX` is set lower — pagination handles this
 * by advancing by the actual number of items received.
 */
const PAGE_SIZE = 20;

/**
 * Returns one sitemap per locale.
 *
 * Next.js generates a sitemap index at `/sitemap.xml` pointing to
 * `/sitemap/[locale].xml` for each locale.
 */
export async function generateSitemaps() {
	return i18nConfig.locales.map((locale) => ({ id: locale }));
}

/** Paginates through the Wagtail pages API for a given locale. */
async function fetchAllPages(locale: string): Promise<CMSPageContent[]> {
	const allItems: CMSPageContent[] = [];
	let offset = 0;

	for (;;) {
		const batch = await cmsClient.fetchPages<CMSPageContents>({
			locale,
			limit: PAGE_SIZE,
			offset,
		});

		allItems.push(...batch.items);

		if (allItems.length >= batch.meta.total_count || batch.items.length === 0) {
			break;
		}

		offset += batch.items.length;
	}

	return allItems;
}

/** Extracts the path portion from a Wagtail `html_url`. */
function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		return "/";
	}
}

export default async function sitemap(props: {
	id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
	const locale = await props.id;
	const isDefaultLocale = locale === i18nConfig.defaultLocale;
	const pages = await fetchAllPages(locale);

	return pages.map((page) => {
		const path = extractPath(page.meta.html_url);
		const prefix = isDefaultLocale ? "" : `/${locale}`;

		return {
			url: `${config.siteUrl}${prefix}${path}`,
			lastModified: page.meta.last_published_at,
		};
	});
}
