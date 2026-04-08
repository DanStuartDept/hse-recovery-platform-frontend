import { DictionaryProvider } from "@repo/i18n";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

const flat = {
	"notFound.heading": "Page not found",
	"notFound.body": "We cannot find the page you are looking for.",
	"notFound.linkBroken":
		"The link may be broken, or the page may have been moved or deleted.",
	"notFound.checkUrl": "Check the URL you entered is correct.",
	"notFound.cantFindHeading":
		"If you still cannot find what you're looking for",
	"notFound.popularInfo":
		"The information may be in a popular section, for example:",
	"notFound.link.conditions": "health conditions and symptoms",
	"notFound.link.staff": "HSE staff news and information",
	"notFound.link.jobs": "HSE job search",
	"notFound.link.about": "information and news about the HSE",
	"notFound.contact":
		"Contact <contactLink>us</contactLink> if you have a question or want to give feedback.",
};

function renderWithProvider(ui: React.ReactElement) {
	return render(
		<DictionaryProvider flat={flat} locale="en-ie">
			{ui}
		</DictionaryProvider>,
	);
}

describe("not-found", () => {
	it("renders the page not found heading", () => {
		renderWithProvider(<NotFound />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Page not found" }),
		).toBeInTheDocument();
	});

	it("renders helpful copy", () => {
		renderWithProvider(<NotFound />);
		expect(
			screen.getByText("We cannot find the page you are looking for."),
		).toBeInTheDocument();
		expect(screen.getByText(/The link may be broken/)).toBeInTheDocument();
		expect(
			screen.getByText("Check the URL you entered is correct."),
		).toBeInTheDocument();
	});

	it("renders the secondary heading", () => {
		renderWithProvider(<NotFound />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "If you still cannot find what you're looking for",
			}),
		).toBeInTheDocument();
	});

	it("renders popular links", () => {
		renderWithProvider(<NotFound />);
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
		renderWithProvider(<NotFound />);
		expect(screen.getByRole("link", { name: /us/ })).toHaveAttribute(
			"href",
			"https://www2.hse.ie/contact/",
		);
	});
});
