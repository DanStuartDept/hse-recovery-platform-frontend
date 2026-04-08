import { config } from "@repo/app-config";
import { loadDictionary } from "@repo/i18n";
import { log, error as logError, warn } from "@repo/logger";
import { FetchError } from "@repo/wagtail-api-client";
import {
	createCMSRenderer,
	generatePageMetadata,
} from "@repo/wagtail-cms-mapping";
import type {
	CMSPageContents,
	NotFoundContents,
} from "@repo/wagtail-cms-types/core";
import { CMSPageContentSchema } from "@repo/wagtail-cms-types/core";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { cmsClient } from "@/lib/cms/client";
import { i18nConfig } from "@/lib/i18n/config";
import { dictionaryLoaders } from "@/lib/i18n/loaders";

/**
 * Allow pages not returned by generateStaticParams to be rendered on-demand.
 * New pages published after the last build are server-rendered on first visit, then cached.
 */
export const dynamicParams = true;

/** ISR revalidation interval in seconds (1 hour). On-demand revalidation via webhook handles real-time updates. */
const REVALIDATE_SECONDS = 3600;

function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null && typeof response === "object" && "message" in response
	);
}

function slugToPath(slug?: string[]): string {
	return slug ? `/${slug.join("/")}/` : "/";
}

/** Extracts the path portion from a Wagtail `html_url`. */
function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		warn("[CMS] Malformed html_url, defaulting to /:", htmlUrl);
		return "/";
	}
}

/**
 * Pre-renders all published CMS pages at build time for every configured locale.
 * Pages are served as static HTML with ISR revalidation as a safety net.
 */
export async function generateStaticParams(): Promise<
	Array<{ lang: string; slug?: string[] }>
> {
	const params: Array<{ lang: string; slug?: string[] }> = [];

	for (const locale of i18nConfig.locales) {
		let offset = 0;
		const PAGE_SIZE = 20;

		try {
			for (;;) {
				const batch = await cmsClient.fetchPages<CMSPageContents>({
					locale,
					limit: PAGE_SIZE,
					offset,
				});

				for (const page of batch.items) {
					const path = extractPath(page.meta.html_url);
					const segments = path.split("/").filter(Boolean);

					params.push({
						lang: locale,
						slug: segments.length > 0 ? segments : undefined,
					});
				}

				if (
					batch.items.length === 0 ||
					offset + batch.items.length >= batch.meta.total_count
				) {
					break;
				}

				offset += batch.items.length;
			}
		} catch (err) {
			warn("[generateStaticParams] CMS fetch failed for locale", locale, err);
		}
	}

	return params;
}

function logCmsError(path: string, response: NotFoundContents): void {
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

export async function generateMetadata(
	props: PageProps<"/[lang]/[[...slug]]">,
): Promise<Metadata> {
	const { lang, slug } = await props.params;
	const path = slugToPath(slug);
	const response = await cmsClient.findPageByPath(path, {
		next: { revalidate: REVALIDATE_SECONDS },
	});

	if (isNotFound(response)) {
		logCmsError(path, response);
		return {};
	}

	let defaultDescription: string | undefined;
	try {
		const flat = await loadDictionary(
			lang,
			dictionaryLoaders,
			i18nConfig.defaultLocale,
		);
		defaultDescription = flat["meta.defaultDescription"];
	} catch (err) {
		warn(
			"[i18n] Dictionary loading failed in generateMetadata for locale:",
			lang,
			err,
		);
	}

	return generatePageMetadata(response as CMSPageProps, {
		siteUrl: config.siteUrl,
		path,
		defaultDescription,
	});
}

export default async function CatchAllPage(
	props: PageProps<"/[lang]/[[...slug]]">,
) {
	const { slug } = await props.params;
	const path = slugToPath(slug);

	const response = await cmsClient.findPageByPath(path, {
		next: { revalidate: REVALIDATE_SECONDS },
	});

	if (isNotFound(response)) {
		logCmsError(path, response);
		notFound();
	}

	const result = CMSPageContentSchema.safeParse(response);
	if (!result.success) {
		warn("[CMS] Validation issues for", path, result.error.issues);
	}

	const renderer = createCMSRenderer({
		apiClient: cmsClient,
		debug: config.isLocalhost,
	});
	return renderer.renderPage(response as CMSPageProps);
}
