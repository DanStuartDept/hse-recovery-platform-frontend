import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { generateRichText } from "./generate-rich-text";

describe("generateRichText", () => {
	it("renders plain HTML string", () => {
		const result = generateRichText("<p>Hello world</p>");
		render(<>{result}</>);
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});

	it("renders nested HTML elements", () => {
		const result = generateRichText("<ul><li>Item one</li></ul>");
		render(<>{result}</>);
		expect(screen.getByText("Item one")).toBeInTheDocument();
	});

	it("returns empty fragment for empty string", () => {
		const result = generateRichText("");
		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe("");
	});
});
