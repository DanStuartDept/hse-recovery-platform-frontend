import { config } from "@repo/app-config";
import type { MetadataRoute } from "next";

/** Revalidate daily — robots.txt rarely changes. */
export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${config.siteUrl}/sitemap.xml`,
	};
}
