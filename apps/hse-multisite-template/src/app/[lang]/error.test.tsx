import { DictionaryProvider } from "@repo/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

vi.mock("@repo/logger", () => ({ error: vi.fn() }));

import { error } from "@repo/logger";

const testError = new Error("test error");

const flat = {
	"error.heading": "Something went wrong",
	"error.body": "There was a problem loading this page. Please try again.",
	"error.tryAgain": "Try again",
};

function renderWithProvider(ui: React.ReactElement) {
	return render(
		<DictionaryProvider flat={flat} locale="en">
			{ui}
		</DictionaryProvider>,
	);
}

describe("error", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the error heading", () => {
		renderWithProvider(
			<ErrorPage error={testError} unstable_retry={vi.fn()} />,
		);
		expect(
			screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
		).toBeInTheDocument();
	});

	it("renders a try again button that calls unstable_retry", async () => {
		const retry = vi.fn();
		renderWithProvider(<ErrorPage error={testError} unstable_retry={retry} />);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
	});

	it("logs the error", () => {
		renderWithProvider(
			<ErrorPage error={testError} unstable_retry={vi.fn()} />,
		);
		expect(error).toHaveBeenCalledWith("[ErrorPage]", testError);
	});
});
