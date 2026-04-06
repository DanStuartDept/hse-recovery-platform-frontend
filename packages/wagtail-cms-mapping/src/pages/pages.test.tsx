import { CMSPageTypeSchema } from "@repo/wagtail-cms-types/core";
import { describe, expect, it } from "vitest";
import { defaultPageRegistry } from "./index";

describe("defaultPageRegistry completeness", () => {
	const allPageTypes = CMSPageTypeSchema.options;

	it("has a layout mapped for every CMSPageType value", () => {
		for (const type of allPageTypes) {
			expect(
				defaultPageRegistry[type],
				`Missing page registry entry for "${type}"`,
			).toBeDefined();
		}
	});

	it("maps all 5 page types", () => {
		expect(allPageTypes).toHaveLength(5);
		expect(Object.keys(defaultPageRegistry)).toHaveLength(5);
	});
});
