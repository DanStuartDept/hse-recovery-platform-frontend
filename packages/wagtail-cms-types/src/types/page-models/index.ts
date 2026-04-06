import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "../blocks";
import { CMSPageContentSchema } from "../core";

export * from "./hsebase";

export const CMSPageWithBlocksSchema = CMSPageContentSchema.extend({
	header: z.array(BaseCMSBlockTypeSchema),
	body: z.array(BaseCMSBlockTypeSchema),
});
export type CMSPageWithBlocks = z.infer<typeof CMSPageWithBlocksSchema>;

export type CMSPageProps =
	| import("./hsebase").CMSContentPageProps
	| import("./hsebase").CMSLandingPageProps
	| import("./hsebase").CMSCuratedHubPageProps
	| import("./hsebase").CMSOrganisationListingPageProps
	| import("./hsebase").CMSOrganisationLandingPageProps;
