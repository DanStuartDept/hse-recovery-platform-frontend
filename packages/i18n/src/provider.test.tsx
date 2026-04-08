import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DictionaryProvider, useDictionary } from "./provider";

function TestConsumer() {
	const dict = useDictionary<{ greeting: string }>();
	return <p>{dict.greeting}</p>;
}

function PluralConsumer() {
	const dict = useDictionary<{ items: { count: (n: number) => string } }>();
	return <p>{dict.items.count(5)}</p>;
}

describe("DictionaryProvider", () => {
	it("renders children", () => {
		render(
			<DictionaryProvider flat={{}} locale="en-ie">
				<p>child</p>
			</DictionaryProvider>,
		);
		expect(screen.getByText("child")).toBeInTheDocument();
	});
});

describe("useDictionary", () => {
	it("returns the unflattened dictionary", () => {
		render(
			<DictionaryProvider flat={{ greeting: "Hello" }} locale="en-ie">
				<TestConsumer />
			</DictionaryProvider>,
		);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("supports plural functions from unflattened dict", () => {
		const flat = {
			"items.count_one": "1 item",
			"items.count_other": "{count} items",
		};
		render(
			<DictionaryProvider flat={flat} locale="en-ie">
				<PluralConsumer />
			</DictionaryProvider>,
		);
		expect(screen.getByText("5 items")).toBeInTheDocument();
	});

	it("throws when used outside provider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<TestConsumer />)).toThrow("useDictionary must be used within a DictionaryProvider");
		spy.mockRestore();
	});
});
