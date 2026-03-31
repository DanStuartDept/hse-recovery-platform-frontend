import { z } from "zod";
import { type CMSPageWithBlocks, CMSPageWithBlocksSchema } from "./index";

/**
 * Basic navigation item schema.
 */
export const NavigationItemSchema = z.object({
	title: z.string(),
	url: z.string(),
});

export type NavigationItem = z.infer<typeof NavigationItemSchema>;

/**
 * Home page model schema.
 */
export const CMSAppBaseHomePagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseHomePageProps = CMSPageWithBlocks;

/**
 * Landing page model schema.
 */
export const CMSAppBaseLandingPagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseLandingPageProps = CMSPageWithBlocks;

/**
 * Content page model schema.
 */
export const CMSAppBaseContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	disable_navigation: z.boolean().optional(),
	side_nav: z.array(NavigationItemSchema).optional(),
});

export type CMSAppBaseContentPageProps = z.infer<
	typeof CMSAppBaseContentPagePropsSchema
>;

/**
 * Search page model schema.
 */
export const CMSAppBaseSearchPagePropsSchema = CMSPageWithBlocksSchema;
export type CMSAppBaseSearchPageProps = CMSPageWithBlocks;
