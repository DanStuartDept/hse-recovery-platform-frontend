import { z } from "zod";
import { FieldTypeImageSchema } from "../fields";
import { type CMSPageWithBlocks, CMSPageWithBlocksSchema } from "./index";

/**
 * News listing page model schema.
 */
export const CMSNewsListingPagePropsSchema = CMSPageWithBlocksSchema;
export type CMSNewsListingPageProps = CMSPageWithBlocks;

/**
 * News content page model schema.
 */
export const CMSNewsContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string(),
	published_date: z.string(),
	featured_image: FieldTypeImageSchema,
});

export type CMSNewsContentPageProps = z.infer<
	typeof CMSNewsContentPagePropsSchema
>;

/**
 * News listing API response schema.
 */
export const CMSNewsListingContentSchema = z.object({
	meta: z.object({
		total_count: z.number(),
	}),
	items: z.array(CMSNewsContentPagePropsSchema),
});

export type CMSNewsListingContent = z.infer<typeof CMSNewsListingContentSchema>;
