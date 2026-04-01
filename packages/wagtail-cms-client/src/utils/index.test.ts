import type { CMSQueries } from "@repo/wagtail-cms-types/core";
import { buildQueryString } from "./index.js";

describe("buildQueryString", () => {
	it("should return an empty string for undefined queries", () => {
		const queries: CMSQueries | undefined = undefined;
		const queryString = buildQueryString(queries);
		expect(queryString).toBe("");
	});

	it("should build a valid query string with various query parameters", () => {
		const queries: CMSQueries = {
			type: "article",
			limit: 10,
			search: "example",
			fields: ["title", "content"],
		};

		const queryString = buildQueryString(queries);
		expect(queryString).toBe(
			"type=article&limit=10&search=example&fields=title%2Ccontent",
		);
	});

	it("should handle undefined query parameters", () => {
		const queries: CMSQueries = {
			type: "article",
			limit: undefined,
			search: "example",
			fields: ["title", "content"],
		};

		const queryString = buildQueryString(queries);
		expect(queryString).toBe(
			"type=article&search=example&fields=title%2Ccontent",
		);
	});

	it("should handle empty string query parameters", () => {
		const queries: CMSQueries = {
			type: "article",
			test: "",
			search: "example",
			fields: ["title", "content"],
		};

		const queryString = buildQueryString(queries);
		expect(queryString).toBe(
			"type=article&search=example&fields=title%2Ccontent",
		);
	});

	it("should handle array query parameters", () => {
		const queries: CMSQueries = {
			type: "article",
			tags: ["tag1", "tag2", "tag3"],
		};

		const queryString = buildQueryString(queries);
		expect(queryString).toBe("type=article&tags=tag1%2Ctag2%2Ctag3");
	});

	it("should encode special characters in values", () => {
		const queries: CMSQueries = { search: "foo bar&baz=qux" };
		const result = buildQueryString(queries);
		expect(result).toBe("search=foo+bar%26baz%3Dqux");
	});

	it("should encode special characters in array values", () => {
		const queries: CMSQueries = { fields: ["title&id", "body content"] };
		const result = buildQueryString(queries);
		expect(result).toBe("fields=title%26id%2Cbody+content");
	});
});
