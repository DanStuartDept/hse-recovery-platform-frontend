import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageTitle } from "./page-title";

describe("PageTitle", () => {
	it("renders the title as an h1", () => {
		render(<PageTitle title="Hello World" />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Hello World" }),
		).toBeInTheDocument();
	});

	it("renders plain-text lead when provided", () => {
		render(<PageTitle title="Title" lead="A lead paragraph" />);
		expect(screen.getByText("A lead paragraph")).toBeInTheDocument();
	});

	it("renders rich-text lead when provided", () => {
		render(
			<PageTitle title="Title" richLead="<p>Rich <strong>lead</strong></p>" />,
		);
		expect(screen.getByText("lead")).toBeInTheDocument();
	});

	it("does not render lead elements when neither lead nor richLead is provided", () => {
		const { container } = render(<PageTitle title="Title Only" />);
		expect(container.querySelector(".hse-lede-text")).toBeNull();
	});

	it("renders both lead and richLead when both are provided", () => {
		render(
			<PageTitle title="Title" lead="Plain lead" richLead="<p>Rich lead</p>" />,
		);
		expect(screen.getByText("Plain lead")).toBeInTheDocument();
		expect(screen.getByText("Rich lead")).toBeInTheDocument();
	});
});
