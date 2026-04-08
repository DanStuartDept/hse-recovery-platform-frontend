import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

vi.mock("@repo/logger", () => ({ error: vi.fn() }));

import { error } from "@repo/logger";

const testError = new Error("global test error");

describe("global-error", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the error heading", () => {
		render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
		).toBeInTheDocument();
	});

	it("renders its own html and body tags", () => {
		render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
		expect(document.querySelector("html")).toBeInTheDocument();
		expect(document.querySelector("body")).toBeInTheDocument();
	});

	it("renders a try again button that calls unstable_retry", async () => {
		const retry = vi.fn();
		render(<GlobalError error={testError} unstable_retry={retry} />);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
	});

	it("logs the error", () => {
		render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
		expect(error).toHaveBeenCalledWith("[GlobalError]", testError);
	});
});
