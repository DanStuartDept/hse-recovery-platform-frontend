import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "./base";

/**
 * Content block values schema for referencing reusable content snippets.
 * Used to embed shared content blocks that are managed separately in the CMS.
 */
export const BlockContentBlockValuesPropsSchema = z.object({
	/** Unique identifier of the content block to embed */
	content_block: z.number(),
});

export type BlockContentBlockValuesProps = z.infer<
	typeof BlockContentBlockValuesPropsSchema
>;

/**
 * Complete content block schema combining CMS block structure with content reference.
 * Used for rendering reusable content snippets within page layouts.
 */
export const BlockContentBlockPropsSchema = BaseCMSBlockTypeSchema.extend({
	type: z.literal("content_block_chooser"),
	value: BlockContentBlockValuesPropsSchema,
});

export type BlockContentBlockProps = z.infer<
	typeof BlockContentBlockPropsSchema
>;
