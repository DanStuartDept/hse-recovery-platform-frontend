import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @repo/app-config/server before importing the route
vi.mock("@repo/app-config/server", () => ({
	serverConfig: { revalidateToken: "test-secret-token", previewToken: "" },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Mock @repo/logger
vi.mock("@repo/logger", () => ({
	log: vi.fn(),
	warn: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { GET } from "./route";

function createRequest(params: Record<string, string>): Request {
	const url = new URL("http://localhost:3000/api/revalidate/");
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return new Request(url);
}

describe("GET /api/revalidate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when token is missing", async () => {
		const request = createRequest({ path: "/about/" });
		const response = await GET(request);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid revalidation token");
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("returns 401 when token is invalid", async () => {
		const request = createRequest({ path: "/about/", token: "wrong-token" });
		const response = await GET(request);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid revalidation token");
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("returns 400 when path is missing", async () => {
		const request = createRequest({ token: "test-secret-token" });
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({
			revalidated: false,
			now: expect.any(Number),
			message: "Missing path to revalidate",
		});
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("revalidates the path and returns 200 on success", async () => {
		const request = createRequest({
			path: "/about/",
			token: "test-secret-token",
		});
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			revalidated: true,
			now: expect.any(Number),
		});
		expect(revalidatePath).toHaveBeenCalledWith("/about/");
	});

	it("sets Cache-Control: no-cache on all responses", async () => {
		const request = createRequest({
			path: "/about/",
			token: "test-secret-token",
		});
		const response = await GET(request);

		expect(response.headers.get("Cache-Control")).toBe("no-cache");
	});
});
