import type { ClientOptions, CMSQueries } from "@repo/wagtail-cms-types/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CMSClient } from "./index.js";
import * as libModule from "./lib/index.js";

// Mock the lib module
vi.mock("./lib");

const mockFetchRequest = vi.mocked(libModule.fetchRequest);
const mockFetchContent = vi.mocked(libModule.fetchContent);

describe("CMSClient", () => {
	beforeEach(() => {
		mockFetchRequest.mockClear();
		mockFetchContent.mockClear();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("constructor", () => {
		it("should create a CMSClient instance with valid options", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};

			const client = new CMSClient(options);
			expect(client).toBeInstanceOf(CMSClient);
		});

		it("should accept mediaBaseURL option", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				mediaBaseURL: "https://media.example.com",
				apiPath: "/api/v2",
			};

			const client = new CMSClient(options);
			expect(client).toBeInstanceOf(CMSClient);
		});

		it("should accept init option", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
				init: { method: "GET" },
			};

			const client = new CMSClient(options);
			expect(client).toBeInstanceOf(CMSClient);
		});

		it("should throw error if baseURL ends with slash", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com/",
				apiPath: "/api/v2",
			};

			expect(() => new CMSClient(options)).toThrow(
				'baseURL, mediaBaseURL or apiPath must not end with "/"',
			);
		});

		it("should throw error if apiPath ends with slash", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2/",
			};

			expect(() => new CMSClient(options)).toThrow(
				'baseURL, mediaBaseURL or apiPath must not end with "/"',
			);
		});

		it("should throw error if mediaBaseURL ends with slash", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				mediaBaseURL: "https://media.example.com/",
				apiPath: "/api/v2",
			};

			expect(() => new CMSClient(options)).toThrow(
				'baseURL, mediaBaseURL or apiPath must not end with "/"',
			);
		});
	});

	describe("fetchEndpoint", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch an endpoint successfully", async () => {
			const mockResponse = { data: "test" };
			mockFetchRequest.mockResolvedValue(mockResponse);

			const result = await client.fetchEndpoint("test-endpoint");

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/v2/test-endpoint",
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should throw error for empty path", async () => {
			await expect(client.fetchEndpoint("")).rejects.toThrow(
				"Path is required to find an endpoint. Please provide a valid path.",
			);

			expect(mockFetchRequest).not.toHaveBeenCalled();
		});

		it("should handle FetchError and return NotFoundContents", async () => {
			const fetchError = new libModule.FetchError(
				"Not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchRequest.mockRejectedValue(fetchError);

			const result = await client.fetchEndpoint("test-endpoint");

			expect(result).toEqual({
				message: "Path not found",
				data: fetchError,
			});
		});

		it("should handle unknown errors and return NotFoundContents", async () => {
			const unknownError = new Error("Unknown error");
			mockFetchRequest.mockRejectedValue(unknownError);

			const result = await client.fetchEndpoint("test-endpoint");

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});
	});

	describe("fetchContent", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
				init: { method: "GET" },
			};
			client = new CMSClient(options);
		});

		it("should call fetchContent with correct parameters", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 10 };
			const customInit = { method: "POST" as const };

			const result = await client.fetchContent("pages", queries, customInit);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				queries,
				customInit,
			);
			expect(result).toBe(mockResponse);
		});

		it("should use client init when no custom init provided", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 10 };

			await client.fetchContent("pages", queries);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				queries,
				{ method: "GET" },
			);
		});
	});

	describe("getMediaSrc", () => {
		it("should construct URL for relative download_url (images)", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			const client = new CMSClient(options);

			const media = {
				type: "image",
				detail_url: "/api/v2/images/1/",
				download_url: "/media/images/test.jpg",
			};

			const result = client.getMediaSrc(media);
			expect(result).toBe("https://api.example.com/media/images/test.jpg");
		});

		it("should construct URL for absolute download_url (documents)", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			const client = new CMSClient(options);

			const media = {
				type: "document",
				detail_url: "/api/v2/documents/1/",
				download_url: "https://external.example.com/media/documents/test.pdf",
			};

			const result = client.getMediaSrc(media);
			expect(result).toBe("https://api.example.com/media/documents/test.pdf");
		});

		it("should use mediaBaseURL when provided", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				mediaBaseURL: "https://media.example.com",
				apiPath: "/api/v2",
			};
			const client = new CMSClient(options);

			const media = {
				type: "image",
				detail_url: "/api/v2/images/1/",
				download_url: "/media/images/test.jpg",
			};

			const result = client.getMediaSrc(media);
			expect(result).toBe("https://media.example.com/media/images/test.jpg");
		});

		it("should handle non-HTTP URLs as relative paths", () => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			const client = new CMSClient(options);

			const media = {
				type: "image",
				detail_url: "/api/v2/images/1/",
				download_url: "invalid-url-format",
			};

			const result = client.getMediaSrc(media);
			expect(result).toBe("https://api.example.cominvalid-url-format");
		});
	});

	describe("fetchPage", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch page by ID", async () => {
			const mockResponse = { id: 1, title: "Test Page", meta: {} };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchPage(1);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages/1",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch page by slug and return first item", async () => {
			const mockPage = { id: 1, title: "Test Page", meta: {} };
			const mockResponse = { items: [mockPage], meta: { total_count: 1 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchPage("test-slug");

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				{ slug: "test-slug" },
				undefined,
			);
			expect(result).toBe(mockPage);
		});

		it("should return NotFoundContents when page by slug is not found", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchPage("non-existent-slug");

			expect(result).toEqual({
				message: "Page not found: non-existent-slug",
				data: mockResponse,
			});
		});

		it("should handle FetchError for ID-based fetch", async () => {
			const fetchError = new libModule.FetchError(
				"Not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchContent.mockRejectedValue(fetchError);

			const result = await client.fetchPage(999);

			expect(result).toEqual({
				message: "Page not found: 999",
				data: fetchError,
			});
		});

		it("should handle unknown error for ID-based fetch", async () => {
			const unknownError = new Error("Database connection failed");
			mockFetchContent.mockRejectedValue(unknownError);

			const result = await client.fetchPage(999);

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});

		it("should merge queries when fetching by slug", async () => {
			const mockPage = { id: 1, title: "Test Page", meta: {} };
			const mockResponse = { items: [mockPage], meta: { total_count: 1 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 5 };
			const result = await client.fetchPage("test-slug", queries);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				{ slug: "test-slug", limit: 5 },
				undefined,
			);
			expect(result).toBe(mockPage);
		});
	});

	describe("fetchPages", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch all pages", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchPages();

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch pages with queries", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 5, type: "blog.BlogPage" };

			const result = await client.fetchPages(queries);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"pages",
				queries,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});
	});

	describe("findPageByPath", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should find page by path successfully", async () => {
			const mockResponse = { id: 1, title: "Test Page", meta: {} };
			mockFetchRequest.mockResolvedValue(mockResponse);

			const result = await client.findPageByPath("/test-path/");

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/v2/pages/find/?html_path=/test-path/",
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should throw error for empty path", async () => {
			await expect(client.findPageByPath("")).rejects.toThrow(
				"Path is required to find a page. Please provide a valid path.",
			);

			expect(mockFetchRequest).not.toHaveBeenCalled();
		});

		it("should handle FetchError and return NotFoundContents", async () => {
			const fetchError = new libModule.FetchError(
				"Not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchRequest.mockRejectedValue(fetchError);

			const result = await client.findPageByPath("/non-existent/");

			expect(result).toEqual({
				message: "Page not found: /non-existent/",
				data: fetchError,
			});
		});

		it("should handle unknown error and return NotFoundContents", async () => {
			const unknownError = new Error("Network timeout");
			mockFetchRequest.mockRejectedValue(unknownError);

			const result = await client.findPageByPath("/test-path/");

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});
	});

	describe("fetchPagePreview", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch page preview successfully", async () => {
			const mockResponse = { id: 1, title: "Preview Page", meta: {} };
			mockFetchRequest.mockResolvedValue(mockResponse);

			const result = await client.fetchPagePreview(
				"blog.BlogPage",
				"preview-token-123",
				"42",
			);

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/v2/page-preview/?content_type=blog.BlogPage&token=preview-token-123&id=42",
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should throw error when contentType is missing", async () => {
			await expect(client.fetchPagePreview("", "token", "1")).rejects.toThrow(
				"contentType, token and id are all required params",
			);

			expect(mockFetchRequest).not.toHaveBeenCalled();
		});

		it("should throw error when token is missing", async () => {
			await expect(
				client.fetchPagePreview("blog.BlogPage", "", "1"),
			).rejects.toThrow("contentType, token and id are all required params");
		});

		it("should throw error when id is missing", async () => {
			await expect(
				client.fetchPagePreview("blog.BlogPage", "token", ""),
			).rejects.toThrow("contentType, token and id are all required params");
		});

		it("should handle FetchError and return NotFoundContents", async () => {
			const fetchError = new libModule.FetchError(
				"Preview not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchRequest.mockRejectedValue(fetchError);

			const result = await client.fetchPagePreview(
				"blog.BlogPage",
				"token",
				"1",
			);

			expect(result).toEqual({
				message: "Preview not found",
				data: fetchError,
			});
		});

		it("should handle unknown error and return NotFoundContents", async () => {
			const unknownError = new Error("Server error");
			mockFetchRequest.mockRejectedValue(unknownError);

			const result = await client.fetchPagePreview(
				"blog.BlogPage",
				"token",
				"1",
			);

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});
	});

	describe("fetchImage", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch image successfully", async () => {
			const mockResponse = { id: 1, title: "Test Image", meta: {} };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchImage(1);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"images/1",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch image with queries and init", async () => {
			const mockResponse = { id: 1, title: "Test Image", meta: {} };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { fields: ["title", "meta"] };
			const init = { method: "GET" as const };

			const result = await client.fetchImage(1, queries, init);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"images/1",
				queries,
				init,
			);
			expect(result).toBe(mockResponse);
		});

		it("should handle FetchError and return NotFoundContents", async () => {
			const fetchError = new libModule.FetchError(
				"Image not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchContent.mockRejectedValue(fetchError);

			const result = await client.fetchImage(999);

			expect(result).toEqual({
				message: "Image not found",
				data: fetchError,
			});
		});

		it("should handle unknown error and return NotFoundContents", async () => {
			const unknownError = new Error("Database error");
			mockFetchContent.mockRejectedValue(unknownError);

			const result = await client.fetchImage(1);

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});
	});

	describe("fetchDocument", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch document successfully", async () => {
			const mockResponse = { id: 1, title: "Test Document", meta: {} };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchDocument(1);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"documents/1",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch document with queries and init", async () => {
			const mockResponse = { id: 1, title: "Test Document", meta: {} };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { fields: ["title", "meta"] };
			const init = { method: "GET" as const };

			const result = await client.fetchDocument(1, queries, init);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"documents/1",
				queries,
				init,
			);
			expect(result).toBe(mockResponse);
		});

		it("should handle FetchError and return NotFoundContents", async () => {
			const fetchError = new libModule.FetchError(
				"Document not found",
				"REQUEST_FAILED",
				404,
			);
			mockFetchContent.mockRejectedValue(fetchError);

			const result = await client.fetchDocument(999);

			expect(result).toEqual({
				message: "Document not found",
				data: fetchError,
			});
		});

		it("should handle unknown error and return NotFoundContents", async () => {
			const unknownError = new Error("Storage error");
			mockFetchContent.mockRejectedValue(unknownError);

			const result = await client.fetchDocument(1);

			expect(result).toEqual({
				message: "An unknown error occurred:",
				data: unknownError,
			});
		});
	});

	describe("fetchImages", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch all images", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchImages();

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"images",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch images with queries and init", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 5, type: "wagtailimages.Image" };
			const init = { method: "GET" as const };

			const result = await client.fetchImages(queries, init);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"images",
				queries,
				init,
			);
			expect(result).toBe(mockResponse);
		});
	});

	describe("fetchDocuments", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should fetch all documents", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const result = await client.fetchDocuments();

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"documents",
				undefined,
				undefined,
			);
			expect(result).toBe(mockResponse);
		});

		it("should fetch documents with queries and init", async () => {
			const mockResponse = { items: [], meta: { total_count: 0 } };
			mockFetchContent.mockResolvedValue(mockResponse);

			const queries: CMSQueries = { limit: 10, search: "pdf" };
			const init = { method: "GET" as const };

			const result = await client.fetchDocuments(queries, init);

			expect(mockFetchContent).toHaveBeenCalledWith(
				"https://api.example.com",
				"/api/v2",
				"documents",
				queries,
				init,
			);
			expect(result).toBe(mockResponse);
		});
	});

	describe("fetchHeader", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should return the first header from the API response", async () => {
			const headerData = {
				id: 1,
				name: "Org Header",
				service_name: "",
				service_long_name: false,
				transactional: false,
				logo_aria: null,
				show_search: false,
				search_prompt_text: "Search",
				navigation_text: "Main navigation",
				locale: 1,
				logo_link: null,
				navigation_links: [],
				navigation_secondary_links: [],
				header_mobile_links: [],
			};
			mockFetchRequest.mockResolvedValue([headerData]);

			const result = await client.fetchHeader();

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/headers/",
				undefined,
			);
			expect(result).toEqual(headerData);
		});

		it("should return NotFoundContents when the API returns an empty array", async () => {
			mockFetchRequest.mockResolvedValue([]);

			const result = await client.fetchHeader();

			expect(result).toEqual({
				message: "Header not found",
				data: [],
			});
		});

		it("should return NotFoundContents when the fetch fails", async () => {
			mockFetchRequest.mockRejectedValue(
				new libModule.FetchError("Server error", "REQUEST_FAILED", 500),
			);

			const result = await client.fetchHeader();

			expect(result).toEqual({
				message: "Header not found",
				data: expect.any(libModule.FetchError),
			});
		});

		it("should pass init options to fetchRequest", async () => {
			const headerData = {
				id: 1,
				name: "Org Header",
				service_name: "",
				service_long_name: false,
				transactional: false,
				logo_aria: null,
				show_search: false,
				search_prompt_text: "Search",
				navigation_text: "Main navigation",
				locale: 1,
				logo_link: null,
				navigation_links: [],
				navigation_secondary_links: [],
				header_mobile_links: [],
			};
			const init = { next: { revalidate: 3600 } } as RequestInit;
			mockFetchRequest.mockResolvedValue([headerData]);

			await client.fetchHeader(init);

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/headers/",
				init,
			);
		});
	});

	describe("fetchFooter", () => {
		let client: CMSClient;

		beforeEach(() => {
			const options: ClientOptions = {
				baseURL: "https://api.example.com",
				apiPath: "/api/v2",
			};
			client = new CMSClient(options);
		});

		it("should return the first footer from the API response", async () => {
			const footerData = {
				id: 1,
				name: "Org Footer",
				locale: 1,
				footer_links: [],
				footer_secondary_links: [],
			};
			mockFetchRequest.mockResolvedValue([footerData]);

			const result = await client.fetchFooter();

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/footers/",
				undefined,
			);
			expect(result).toEqual(footerData);
		});

		it("should return NotFoundContents when the API returns an empty array", async () => {
			mockFetchRequest.mockResolvedValue([]);

			const result = await client.fetchFooter();

			expect(result).toEqual({
				message: "Footer not found",
				data: [],
			});
		});

		it("should return NotFoundContents when the fetch fails", async () => {
			mockFetchRequest.mockRejectedValue(
				new libModule.FetchError("Server error", "REQUEST_FAILED", 500),
			);

			const result = await client.fetchFooter();

			expect(result).toEqual({
				message: "Footer not found",
				data: expect.any(libModule.FetchError),
			});
		});

		it("should pass init options to fetchRequest", async () => {
			const footerData = {
				id: 1,
				name: "Org Footer",
				locale: 1,
				footer_links: [],
				footer_secondary_links: [],
			};
			const init = { next: { revalidate: 3600 } } as RequestInit;
			mockFetchRequest.mockResolvedValue([footerData]);

			await client.fetchFooter(init);

			expect(mockFetchRequest).toHaveBeenCalledWith(
				"https://api.example.com/api/footers/",
				init,
			);
		});
	});
});
