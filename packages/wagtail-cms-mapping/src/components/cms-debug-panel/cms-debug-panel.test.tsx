import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CmsDebugPanel } from "./cms-debug-panel";

describe("CmsDebugPanel", () => {
	it("renders a details element with summary", () => {
		render(<CmsDebugPanel data={{ title: "Test" }} />);
		expect(screen.getByText("CMS Debug — Raw Response")).toBeInTheDocument();
	});

	it("renders the data as formatted JSON", () => {
		const data = { id: 1, title: "Test Page" };
		render(<CmsDebugPanel data={data} />);
		const pre = screen.getByRole("group").querySelector("pre");
		expect(pre?.textContent).toContain('"id": 1');
		expect(pre?.textContent).toContain('"title": "Test Page"');
	});

	it("handles null data", () => {
		render(<CmsDebugPanel data={null} />);
		const pre = screen.getByRole("group").querySelector("pre");
		expect(pre?.textContent).toContain("null");
	});

	it("handles deeply nested data", () => {
		const data = { a: { b: { c: "deep" } } };
		render(<CmsDebugPanel data={data} />);
		const pre = screen.getByRole("group").querySelector("pre");
		expect(pre?.textContent).toContain('"c": "deep"');
	});
});
