import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "../blocks";

/**
 * Reusable content block snippet schema.
 */
export const SnippetContentBlockSchema = z.object({
	id: z.number(),
	title: z.string(),
	body: z.array(BaseCMSBlockTypeSchema),
});

export type SnippetContentBlock = z.infer<typeof SnippetContentBlockSchema>;
