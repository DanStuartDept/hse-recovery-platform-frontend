import { z } from "zod";

/**
 * Display settings schema that control how blocks are rendered and positioned within layouts.
 * Used to customize block presentation without changing their core content structure.
 */
export const BlockDisplaySettingsTypeSchema = z.object({
	fluid: z.boolean().optional(),
	fullWidth: z.boolean().optional(),
	inRow: z.boolean().optional(),
});

export type BlockDisplaySettingsType = z.infer<
	typeof BlockDisplaySettingsTypeSchema
>;

/**
 * Union schema of all available block component identifiers in the CMS.
 * Maps to the actual block type names used by Wagtail CMS for block identification.
 */
export const CMSBlockComponentsKeysSchema = z.enum([
	"text",
	"rich_text_block",
	"richtext",
	"image",
	"inset_text",
	"quote",
	"top_tasks",
	"top_task",
	"links_list_group_v2",
	"action_link",
	"expander",
	"expander_group",
	"details",
	"button_list",
	"content_block_chooser",
	"brightcove_video",
	"related_information",
	"section",
	"teaser_links",
]);

export type CMSBlockComponentsKeys = z.infer<
	typeof CMSBlockComponentsKeysSchema
>;

/**
 * Base CMS block schema for all block types.
 * Defines the common structure shared by all blocks in the CMS system.
 */
export const BaseCMSBlockTypeSchema = z.object({
	id: z.string(),
	type: CMSBlockComponentsKeysSchema,
	value: z.unknown(),
	settings: BlockDisplaySettingsTypeSchema.optional(),
	client: z.unknown().optional(),
});

/**
 * Generic CMS block schema that can be used for any block type.
 */
export const CMSBlockTypeSchema = BaseCMSBlockTypeSchema;

/**
 * Generic CMS block type with optional client data.
 * Can be extended with specific block type information.
 */
export type CMSBlockType<TClient = unknown> = Omit<
	z.infer<typeof BaseCMSBlockTypeSchema>,
	"client"
> & {
	client?: TClient;
};
