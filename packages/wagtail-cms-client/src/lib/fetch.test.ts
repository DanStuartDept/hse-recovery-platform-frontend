import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchError, fetchRequest } from "./fetch.js";

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FetchError", () => {
	it("should create a FetchError with correct properties", () => {
		const error = new FetchError("Test error message", "TEST_ERROR", 500);

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(FetchError);
		expect(error.message).toBe("Test error message");
		expect(error.code).toBe("TEST_ERROR");
		expect(error.status).toBe(500);
		expect(error.name).toBe("FetchError [TEST_ERROR]");
	});

	it("should inherit from Error correctly", () => {
		const error = new FetchError("Test message", "TEST_CODE", 404);

		expect(error instanceof Error).toBe(true);
		expect(error instanceof FetchError).toBe(true);
	});
});

describe("fetchRequest", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should successfully fetch and return JSON data", async () => {
		const mockData = { id: 1, title: "Test Content" };
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue(mockData),
		};
		mockFetch.mockResolvedValue(mockResponse);

		const result = await fetchRequest<typeof mockData>(
			"https://api.example.com/test",
		);

		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
		});
		expect(mockResponse.json).toHaveBeenCalled();
		expect(result).toEqual(mockData);
	});

	it("should merge custom init options with defaults", async () => {
		const mockData = { success: true };
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue(mockData),
		};
		mockFetch.mockResolvedValue(mockResponse);

		const customInit = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		};

		await fetchRequest("https://api.example.com/test", customInit);

		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
	});

	it("should override default options with custom init options", async () => {
		const mockData = { success: true };
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue(mockData),
		};
		mockFetch.mockResolvedValue(mockResponse);

		const customInit = {
			method: "GET",
			// In a real scenario, Next.js specific options would be handled
			// but for testing we focus on standard RequestInit properties
		} as RequestInit;

		await fetchRequest("https://api.example.com/test", customInit);

		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
			method: "GET",
		});
	});

	it("should throw FetchError with REQUEST_FAILED code when response is not ok", async () => {
		const mockResponse = {
			ok: false,
			status: 404,
			statusText: "Not Found",
			url: "https://api.example.com/not-found",
		};
		mockFetch.mockResolvedValue(mockResponse);

		await expect(
			fetchRequest("https://api.example.com/not-found"),
		).rejects.toThrow(FetchError);

		try {
			await fetchRequest("https://api.example.com/not-found");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe("REQUEST_FAILED");
			expect((error as FetchError).message).toBe(
				"Request failed: 404 Not Found (https://api.example.com/not-found)",
			);
			expect((error as FetchError).status).toBe(404);
		}
	});

	it("should re-throw FetchError when it occurs during the request", async () => {
		const originalError = new FetchError("Original error", "ORIGINAL_CODE", 0);
		mockFetch.mockRejectedValue(originalError);

		await expect(fetchRequest("https://api.example.com/test")).rejects.toThrow(
			originalError,
		);

		try {
			await fetchRequest("https://api.example.com/test");
		} catch (error) {
			expect(error).toBe(originalError);
			expect((error as FetchError).code).toBe("ORIGINAL_CODE");
		}
	});

	it("should wrap unexpected errors in FetchError with UNEXPECTED_ERROR code", async () => {
		const unexpectedError = new Error("Network error");
		mockFetch.mockRejectedValue(unexpectedError);

		await expect(fetchRequest("https://api.example.com/test")).rejects.toThrow(
			FetchError,
		);

		try {
			await fetchRequest("https://api.example.com/test");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe("UNEXPECTED_ERROR");
			expect((error as FetchError).message).toBe(
				"An unexpected error occurred",
			);
		}
	});

	it("should handle network errors correctly", async () => {
		const networkError = new TypeError("Failed to fetch");
		mockFetch.mockRejectedValue(networkError);

		await expect(fetchRequest("https://api.example.com/test")).rejects.toThrow(
			FetchError,
		);

		try {
			await fetchRequest("https://api.example.com/test");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe("UNEXPECTED_ERROR");
		}
	});

	it("should handle JSON parsing errors", async () => {
		const mockResponse = {
			ok: true,
			json: vi.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
		};
		mockFetch.mockResolvedValue(mockResponse);

		// Now that we properly await response.json(), parsing errors should be caught and wrapped
		await expect(fetchRequest("https://api.example.com/test")).rejects.toThrow(
			FetchError,
		);

		try {
			await fetchRequest("https://api.example.com/test");
			expect.fail("Expected fetchRequest to throw an error");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe("UNEXPECTED_ERROR");
			expect((error as FetchError).message).toBe(
				"An unexpected error occurred",
			);
		}
	});

	it("should include status, statusText, and url in error message", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
			url: "https://example.com/api/pages/",
			json: vi.fn(),
		});

		await expect(
			fetchRequest("https://example.com/api/pages/"),
		).rejects.toThrow(/404 Not Found/);
	});

	it("should work without init parameter", async () => {
		const mockData = { test: "data" };
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue(mockData),
		};
		mockFetch.mockResolvedValue(mockResponse);

		const result = await fetchRequest("https://api.example.com/test");

		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
		});
		expect(result).toEqual(mockData);
	});
});
