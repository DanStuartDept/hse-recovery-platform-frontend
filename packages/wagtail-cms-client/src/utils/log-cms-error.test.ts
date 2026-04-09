import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { describe, expect, it, vi } from "vitest";
import { FetchError } from "../lib/fetch.js";
import { logCmsError } from "./log-cms-error.js";

vi.mock("@repo/logger", () => ({
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}));

import * as logger from "@repo/logger";

describe("logCmsError", () => {
	it("should log at info level for 404 errors", () => {
		const response: NotFoundContents = {
			message: "Not found",
			data: new FetchError("Not found", "REQUEST_FAILED", 404),
		};

		logCmsError("/about/", response);

		expect(logger.log).toHaveBeenCalledWith("[CMS] Page not found: /about/");
	});

	it("should log at error level for 5xx errors", () => {
		const fetchError = new FetchError("Internal error", "REQUEST_FAILED", 500);
		const response: NotFoundContents = {
			message: "Server error",
			data: fetchError,
		};

		logCmsError("/about/", response);

		expect(logger.error).toHaveBeenCalledWith(
			"[CMS] Server error 500 fetching /about/:",
			"Internal error",
		);
	});

	it("should log at error level for network errors (status 0)", () => {
		const fetchError = new FetchError("Network error", "UNEXPECTED_ERROR", 0);
		const response: NotFoundContents = {
			message: "Unreachable",
			data: fetchError,
		};

		logCmsError("/about/", response);

		expect(logger.error).toHaveBeenCalledWith(
			"[CMS] Unreachable — network error fetching /about/:",
			"Network error",
		);
	});

	it("should log at warn level for other HTTP errors", () => {
		const fetchError = new FetchError("Forbidden", "REQUEST_FAILED", 403);
		const response: NotFoundContents = {
			message: "Forbidden",
			data: fetchError,
		};

		logCmsError("/admin/", response);

		expect(logger.warn).toHaveBeenCalledWith(
			"[CMS] HTTP 403 fetching /admin/:",
			"Forbidden",
		);
	});

	it("should log at info level when data is not a FetchError and no status", () => {
		const response: NotFoundContents = {
			message: "Not found",
			data: null,
		};

		logCmsError("/missing/", response);

		expect(logger.log).toHaveBeenCalledWith("[CMS] Page not found: /missing/");
	});
});
