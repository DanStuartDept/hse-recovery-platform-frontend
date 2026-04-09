import { describe, expect, it } from "vitest";
import { slugToPath } from "./slug-to-path.js";

describe("slugToPath", () => {
	it("should return '/' when slug is undefined", () => {
		expect(slugToPath(undefined)).toBe("/");
	});

	it("should return '/' when slug is an empty array", () => {
		expect(slugToPath([])).toBe("/");
	});

	it("should convert a single-segment slug", () => {
		expect(slugToPath(["about"])).toBe("/about/");
	});

	it("should convert a multi-segment slug", () => {
		expect(slugToPath(["services", "mental-health", "supports"])).toBe(
			"/services/mental-health/supports/",
		);
	});

	it("should handle a slug with one segment", () => {
		expect(slugToPath(["contact"])).toBe("/contact/");
	});
});
