import type { CMSQueries } from "@repo/wagtail-cms-types/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as utilsModule from "../../utils/index.js";
import * as fetchModule from "../fetch.js";
import { fetchContent } from "./index.js";

// Mock the dependencies
vi.mock("../fetch");
vi.mock("../../utils");

const mockFetchRequest = vi.mocked(fetchModule.fetchRequest);
const mockBuildQueryString = vi.mocked(utilsModule.buildQueryString);

describe("fetchContent", () => {
	beforeEach(() => {
		mockFetchRequest.mockClear();
		mockBuildQueryString.mockClear();
		mockBuildQueryString.mockReturnValue("type=page&limit=10"); // Default mock return
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should build correct URL and call fetchRequest", async () => {
		const mockResponse = { items: [], meta: { total_count: 0 } };
		mockFetchRequest.mockResolvedValue(mockResponse);
		mockBuildQueryString.mockReturnValue("limit=5");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";
		const content = "pages";
		const queries: CMSQueries = { limit: 5 };
		const init = { method: "GET" as const };

		const result = await fetchContent(baseURL, apiPath, content, queries, init);

		expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/v2/pages/?limit=5",
			init,
		);
		expect(result).toBe(mockResponse);
	});

	it("should work without queries parameter", async () => {
		const mockResponse = { items: [], meta: { total_count: 0 } };
		mockFetchRequest.mockResolvedValue(mockResponse);
		mockBuildQueryString.mockReturnValue("");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";
		const content = "pages";

		const result = await fetchContent(baseURL, apiPath, content);

		expect(mockBuildQueryString).toHaveBeenCalledWith(undefined);
		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/v2/pages/?",
			undefined,
		);
		expect(result).toBe(mockResponse);
	});

	it("should work without init parameter", async () => {
		const mockResponse = { items: [], meta: { total_count: 0 } };
		mockFetchRequest.mockResolvedValue(mockResponse);
		mockBuildQueryString.mockReturnValue("type=image");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";
		const content = "images";
		const queries: CMSQueries = { type: "image" };

		const result = await fetchContent(baseURL, apiPath, content, queries);

		expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/v2/images/?type=image",
			undefined,
		);
		expect(result).toBe(mockResponse);
	});

	it("should handle specific content paths with IDs", async () => {
		const mockResponse = { id: 1, title: "Test Page" };
		mockFetchRequest.mockResolvedValue(mockResponse);
		mockBuildQueryString.mockReturnValue("fields=title,content");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";
		const content = "pages/123" as const;
		const queries: CMSQueries = { fields: ["title", "content"] };

		const result = await fetchContent(baseURL, apiPath, content, queries);

		expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/v2/pages/123/?fields=title,content",
			undefined,
		);
		expect(result).toBe(mockResponse);
	});

	describe("validation errors", () => {
		it("should throw error when random ordering is used with offset", async () => {
			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "pages";
			const queries: CMSQueries = { order: "random", offset: 10 };

			await expect(
				fetchContent(baseURL, apiPath, content, queries),
			).rejects.toThrow(
				"Random ordering with offset is not supported. Please remove either the 'order' or 'offset' query.",
			);

			// Ensure fetchRequest is not called when validation fails
			expect(mockFetchRequest).not.toHaveBeenCalled();
		});

		it("should allow random ordering without offset", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchRequest.mockResolvedValue(mockResponse);
			mockBuildQueryString.mockReturnValue("order=random");

			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "pages";
			const queries: CMSQueries = { order: "random" };

			const result = await fetchContent(baseURL, apiPath, content, queries);

			expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
			expect(mockFetchRequest).toHaveBeenCalled();
			expect(result).toBe(mockResponse);
		});

		it("should allow offset without random ordering", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchRequest.mockResolvedValue(mockResponse);
			mockBuildQueryString.mockReturnValue("offset=10");

			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "pages";
			const queries: CMSQueries = { offset: 10 };

			const result = await fetchContent(baseURL, apiPath, content, queries);

			expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
			expect(mockFetchRequest).toHaveBeenCalled();
			expect(result).toBe(mockResponse);
		});

		it("should throw error when tree position filters are used with non-pages content", async () => {
			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "images";
			const queries: CMSQueries = { child_of: 1 };

			await expect(
				fetchContent(baseURL, apiPath, content, queries),
			).rejects.toThrow(
				"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'decendant_of'  query.",
			);

			expect(mockFetchRequest).not.toHaveBeenCalled();
		});

		it("should throw error for ancestor_of with non-pages content", async () => {
			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "documents";
			const queries: CMSQueries = { ancestor_of: 1 };

			await expect(
				fetchContent(baseURL, apiPath, content, queries),
			).rejects.toThrow(
				"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'decendant_of'  query.",
			);
		});

		it("should throw error for decendant_of with non-pages content", async () => {
			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "images";
			const queries: CMSQueries = { decendant_of: 1 };

			await expect(
				fetchContent(baseURL, apiPath, content, queries),
			).rejects.toThrow(
				"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'decendant_of'  query.",
			);
		});

		it("should allow tree position filters with pages content", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchRequest.mockResolvedValue(mockResponse);
			mockBuildQueryString.mockReturnValue("child_of=1");

			const baseURL = "https://api.example.com";
			const apiPath = "/api/v2";
			const content = "pages";
			const queries: CMSQueries = { child_of: 1 };

			const result = await fetchContent(baseURL, apiPath, content, queries);

			expect(mockBuildQueryString).toHaveBeenCalledWith(queries);
			expect(mockFetchRequest).toHaveBeenCalled();
			expect(result).toBe(mockResponse);
		});
	});

	it("should propagate errors from fetchRequest", async () => {
		const error = new Error("Network error");
		mockFetchRequest.mockRejectedValue(error);
		mockBuildQueryString.mockReturnValue("");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";
		const content = "pages";

		await expect(fetchContent(baseURL, apiPath, content)).rejects.toThrow(
			"Network error",
		);
	});

	it("should handle all content types correctly", async () => {
		const mockResponse = { items: [], meta: { total_count: 0 } };
		mockFetchRequest.mockResolvedValue(mockResponse);
		mockBuildQueryString.mockReturnValue("");

		const baseURL = "https://api.example.com";
		const apiPath = "/api/v2";

		const contentTypes = ["pages", "images", "documents"] as const;

		for (const content of contentTypes) {
			await fetchContent(baseURL, apiPath, content);
			expect(mockFetchRequest).toHaveBeenCalledWith(
				`https://api.example.com/api/v2/${content}/?`,
				undefined,
			);
		}

		expect(mockFetchRequest).toHaveBeenCalledTimes(3);
	});
});
