import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "../blocks";
import { CMSPageContentSchema } from "../core";

// Re-export all page types
export * from "./appbase";
export * from "./news";

/**
 * Base interface for pages that support block-based content structure.
 */
export const CMSPageWithBlocksSchema = CMSPageContentSchema.extend({
	header: z.array(BaseCMSBlockTypeSchema),
	body: z.array(BaseCMSBlockTypeSchema),
});

export type CMSPageWithBlocks = z.infer<typeof CMSPageWithBlocksSchema>;

/**
 * Union type of all page model props interfaces.
 */
export type CMSPageProps =
	| import("./appbase").CMSAppBaseHomePageProps
	| import("./appbase").CMSAppBaseContentPageProps
	| import("./appbase").CMSAppBaseLandingPageProps
	| import("./appbase").CMSAppBaseSearchPageProps
	| import("./news").CMSNewsContentPageProps
	| import("./news").CMSNewsListingPageProps;
