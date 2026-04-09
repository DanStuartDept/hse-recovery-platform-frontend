import { describe, expect, it } from "vitest";
import { extractPath } from "./extract-path.js";

describe("extractPath", () => {
	it("should extract the pathname from a valid URL", () => {
		expect(extractPath("https://cms.example.com/about/")).toBe("/about/");
	});

	it("should extract the root path", () => {
		expect(extractPath("https://cms.example.com/")).toBe("/");
	});

	it("should extract a deep nested path", () => {
		expect(
			extractPath("https://cms.example.com/services/mental-health/supports/"),
		).toBe("/services/mental-health/supports/");
	});

	it("should return '/' for a malformed URL", () => {
		expect(extractPath("not-a-url")).toBe("/");
	});

	it("should return '/' for an empty string", () => {
		expect(extractPath("")).toBe("/");
	});

	it("should strip query parameters", () => {
		expect(extractPath("https://cms.example.com/about/?draft=true")).toBe(
			"/about/",
		);
	});
});
