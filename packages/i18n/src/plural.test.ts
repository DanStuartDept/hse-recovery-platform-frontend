import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
	it("selects 'one' for count 1 in English", () => {
		const group = { one: "1 result", other: "{count} results" };
		expect(plural(group, 1, "en")).toBe("1 result");
	});

	it("selects 'other' for count > 1 in English", () => {
		const group = { one: "1 result", other: "{count} results" };
		expect(plural(group, 5, "en")).toBe("5 results");
	});

	it("selects 'zero' when available and count is 0", () => {
		const group = { zero: "No results", one: "1 result", other: "{count} results" };
		expect(plural(group, 0, "en")).toBe("No results");
	});

	it("falls back to 'other' when 'zero' is not defined and count is 0", () => {
		const group = { one: "1 result", other: "{count} results" };
		expect(plural(group, 0, "en")).toBe("0 results");
	});

	it("interpolates {count} in the selected template", () => {
		const group = { one: "{count} item", other: "{count} items" };
		expect(plural(group, 42, "en")).toBe("42 items");
	});

	it("handles Irish 'two' category", () => {
		const group = { one: "1 rud", two: "2 rud", other: "{count} rud" };
		expect(plural(group, 2, "ga")).toBe("2 rud");
	});

	it("returns empty string when no matching rule and no 'other'", () => {
		expect(plural({}, 5, "en")).toBe("");
	});
});
