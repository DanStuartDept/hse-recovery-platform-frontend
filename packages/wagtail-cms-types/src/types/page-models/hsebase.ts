import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "../blocks";
import { CMSPageContentSchema } from "../core";
import { NavItemSchema } from "../fields";
import { CMSPageWithBlocksSchema } from "./index";

export const CMSContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	side_nav: z.array(NavItemSchema).optional(),
});
export type CMSContentPageProps = z.infer<typeof CMSContentPagePropsSchema>;

export const CMSLandingPagePropsSchema = CMSPageContentSchema.extend({
	lead_text: z.string().optional(),
	top_content: z.array(BaseCMSBlockTypeSchema).optional(),
	content: z.array(BaseCMSBlockTypeSchema).optional(),
	bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
});
export type CMSLandingPageProps = z.infer<typeof CMSLandingPagePropsSchema>;

export const CMSCuratedHubPagePropsSchema = CMSPageContentSchema.extend({
	lead_text: z.string().optional(),
	content: z.array(BaseCMSBlockTypeSchema).optional(),
	bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
});
export type CMSCuratedHubPageProps = z.infer<
	typeof CMSCuratedHubPagePropsSchema
>;

export const CMSOrganisationLandingPagePropsSchema =
	CMSPageContentSchema.extend({
		lead_text: z.string().optional(),
		content: z.array(BaseCMSBlockTypeSchema).optional(),
		bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
	});
export type CMSOrganisationLandingPageProps = z.infer<
	typeof CMSOrganisationLandingPagePropsSchema
>;

export const CMSOrganisationListingPagePropsSchema =
	CMSPageContentSchema.extend({
		lead_text: z.string().optional(),
		organisation_links: z.array(BaseCMSBlockTypeSchema),
		organisation_links_count: z.number(),
	});
export type CMSOrganisationListingPageProps = z.infer<
	typeof CMSOrganisationListingPagePropsSchema
>;
