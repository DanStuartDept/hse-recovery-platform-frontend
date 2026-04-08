import type { CMSPageBreadcrumb } from "@repo/wagtail-cms-types/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "./breadcrumb";

const mockItems: CMSPageBreadcrumb[] = [
	{ id: 1, title: "Home", slug: "home", url: "/" },
	{ id: 2, title: "About", slug: "about", url: "/about/" },
	{ id: 3, title: "Team", slug: "team", url: "/about/team/" },
];

describe("Breadcrumb", () => {
	it("returns null when items is undefined", () => {
		const { container } = render(<Breadcrumb />);
		expect(container.innerHTML).toBe("");
	});

	it("returns null when items is empty", () => {
		const { container } = render(<Breadcrumb items={[]} />);
		expect(container.innerHTML).toBe("");
	});

	it("renders all breadcrumb items", () => {
		render(<Breadcrumb items={mockItems} />);
		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("About")).toBeInTheDocument();
		// "Team" appears twice: once in the breadcrumb trail and once as the back link
		expect(screen.getAllByText("Team")).toHaveLength(2);
	});

	it("renders links with correct hrefs", () => {
		render(<Breadcrumb items={mockItems} />);
		const links = screen.getAllByRole("link");
		const hrefs = links.map((link) => link.getAttribute("href"));
		expect(hrefs).toContain("/");
		expect(hrefs).toContain("/about");
	});

	it("renders a back link", () => {
		render(<Breadcrumb items={mockItems} />);
		const backLink = screen
			.getAllByRole("link")
			.find((el) => el.classList.contains("hse-breadcrumb__backlink"));
		expect(backLink).toBeDefined();
	});
});
