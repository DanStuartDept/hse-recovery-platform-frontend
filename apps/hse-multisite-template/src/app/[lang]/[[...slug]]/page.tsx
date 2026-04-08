import { config } from "@repo/app-config";
import {
	createCMSRenderer,
	generatePageMetadata,
} from "@repo/wagtail-cms-mapping";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { cmsClient } from "@/lib/cms/client";

/** ISR revalidation interval in seconds (6 minutes). */
const REVALIDATE_SECONDS = 360;

function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null && typeof response === "object" && "message" in response
	);
}

function slugToPath(slug?: string[]): string {
	return slug ? `/${slug.join("/")}/` : "/";
}

export async function generateMetadata(
	props: PageProps<"/[lang]/[[...slug]]">,
): Promise<Metadata> {
	const { slug } = await props.params;
	const path = slugToPath(slug);
	const response = await cmsClient.findPageByPath(path, {
		next: { revalidate: REVALIDATE_SECONDS },
	});

	if (isNotFound(response)) {
		return {};
	}

	return generatePageMetadata(response as CMSPageProps, {
		siteUrl: config.siteUrl,
		path,
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
		notFound();
	}

	const renderer = createCMSRenderer({
		apiClient: cmsClient,
		debug: config.isLocalhost,
	});
	return renderer.renderPage(response as CMSPageProps);
}
