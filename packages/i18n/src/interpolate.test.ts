import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate";

describe("interpolate", () => {
	it("replaces a single placeholder", () => {
		expect(interpolate("Hello, {name}", { name: "Dan" })).toBe("Hello, Dan");
	});

	it("replaces multiple placeholders", () => {
		expect(interpolate("{greeting}, {name}!", { greeting: "Hi", name: "Dan" })).toBe("Hi, Dan!");
	});

	it("leaves unmatched placeholders as-is", () => {
		expect(interpolate("Hello, {name}", {})).toBe("Hello, {name}");
	});

	it("returns the string unchanged when there are no placeholders", () => {
		expect(interpolate("Hello world", { name: "Dan" })).toBe("Hello world");
	});

	it("handles empty string", () => {
		expect(interpolate("", { name: "Dan" })).toBe("");
	});

	it("replaces repeated placeholders", () => {
		expect(interpolate("{x} and {x}", { x: "a" })).toBe("a and a");
	});
});
