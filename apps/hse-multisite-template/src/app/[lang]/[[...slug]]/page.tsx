import { config } from "@repo/app-config";
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { notFound } from "next/navigation";

import { cmsClient } from "@/lib/cms/client";

function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null && typeof response === "object" && "message" in response
	);
}

export default async function CatchAllPage(
	props: PageProps<"/[lang]/[[...slug]]">,
) {
	const { slug } = await props.params;
	const path = slug ? `/${slug.join("/")}/` : "/";

	const response = await cmsClient.findPageByPath(path);

	if (isNotFound(response)) {
		notFound();
	}

	const renderer = createCMSRenderer({
		apiClient: cmsClient,
		debug: config.isLocalhost,
	});
	return renderer.renderPage(response as CMSPageProps);
}
