import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { describe, expect, it } from "vitest";
import { isNotFound } from "./is-not-found.js";

describe("isNotFound", () => {
	it("should return true for a valid NotFoundContents object", () => {
		const response: NotFoundContents = { message: "Not found", data: null };
		expect(isNotFound(response)).toBe(true);
	});

	it("should return true when data is an Error", () => {
		const response = { message: "Server error", data: new Error("fail") };
		expect(isNotFound(response)).toBe(true);
	});

	it("should return false for null", () => {
		expect(isNotFound(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isNotFound(undefined)).toBe(false);
	});

	it("should return false for a string", () => {
		expect(isNotFound("not found")).toBe(false);
	});

	it("should return false for an object with only message (no data)", () => {
		expect(isNotFound({ message: "oops" })).toBe(false);
	});

	it("should return false for an object with only data (no message)", () => {
		expect(isNotFound({ data: 123 })).toBe(false);
	});

	it("should return false for an object where message is not a string", () => {
		expect(isNotFound({ message: 42, data: null })).toBe(false);
	});

	it("should return false for a CMS page object", () => {
		const page = { id: 1, title: "Home", meta: { slug: "home" } };
		expect(isNotFound(page)).toBe(false);
	});
});
