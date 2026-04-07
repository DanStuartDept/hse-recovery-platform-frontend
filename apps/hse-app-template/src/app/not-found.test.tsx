import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("not-found", () => {
	it("renders the page not found heading", () => {
		render(<NotFound />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Page not found" }),
		).toBeInTheDocument();
	});

	it("renders helpful copy", () => {
		render(<NotFound />);
		expect(
			screen.getByText("We cannot find the page you are looking for."),
		).toBeInTheDocument();
		expect(screen.getByText(/The link may be broken/)).toBeInTheDocument();
		expect(
			screen.getByText("Check the URL you entered is correct."),
		).toBeInTheDocument();
	});

	it("renders the secondary heading", () => {
		render(<NotFound />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "If you still cannot find what you're looking for",
			}),
		).toBeInTheDocument();
	});

	it("renders popular links", () => {
		render(<NotFound />);
		expect(
			screen.getByRole("link", { name: "health conditions and symptoms" }),
		).toHaveAttribute("href", "https://www2.hse.ie/conditions/");
		expect(
			screen.getByRole("link", { name: "HSE staff news and information" }),
		).toHaveAttribute("href", "https://healthservice.hse.ie/staff/");
		expect(
			screen.getByRole("link", { name: "HSE job search" }),
		).toHaveAttribute("href", "https://about.hse.ie/jobs/job-search/");
		expect(
			screen.getByRole("link", { name: "information and news about the HSE" }),
		).toHaveAttribute("href", "https://about.hse.ie/");
	});

	it("renders the contact link", () => {
		render(<NotFound />);
		expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute(
			"href",
			"https://www2.hse.ie/contact/",
		);
	});
});
