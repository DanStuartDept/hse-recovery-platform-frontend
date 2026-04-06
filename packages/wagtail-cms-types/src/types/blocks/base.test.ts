import { describe, expect, it } from "vitest";
import { CMSBlockComponentsKeysSchema } from "./base";

describe("CMSBlockComponentsKeysSchema", () => {
	it("accepts all valid block types", () => {
		const validKeys = [
			"text", "rich_text_block", "richtext", "image", "inset_text", "quote",
			"top_tasks", "top_task", "links_list_group_v2", "action_link",
			"expander", "expander_group", "details", "button_list",
			"content_block_chooser", "brightcove_video", "related_information", "teaser_links",
		];
		for (const key of validKeys) {
			expect(CMSBlockComponentsKeysSchema.safeParse(key).success).toBe(true);
		}
	});

	it("rejects removed block types", () => {
		const removedKeys = [
			"content_block", "alert", "page_header", "text_picture", "picture",
			"group", "title_and_text", "row", "accordion", "cta", "cta_panel",
			"card", "text_and_icon", "cover", "section_listing", "hero_image_banner",
			"youtube", "team_member", "timeline", "demo_ui_banner",
		];
		for (const key of removedKeys) {
			expect(CMSBlockComponentsKeysSchema.safeParse(key).success).toBe(false);
		}
	});
});
