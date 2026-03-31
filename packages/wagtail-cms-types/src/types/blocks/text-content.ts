import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "./base";

export const BlockTextContentValuesPropsSchema = z.object({
	title: z.string().optional(),
	text: z.string(),
});

export type BlockTextContentValuesProps = z.infer<
	typeof BlockTextContentValuesPropsSchema
>;

export const BlockTextContentPropsSchema = BaseCMSBlockTypeSchema.extend({
	type: z.literal("text"),
	value: BlockTextContentValuesPropsSchema,
});

export type BlockTextContentProps = z.infer<typeof BlockTextContentPropsSchema>;
