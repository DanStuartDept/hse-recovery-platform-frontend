import { afterEach, describe, expect, it, vi } from "vitest";
import { toggleOneTrustDisplay } from "./one-trust";

describe("toggleOneTrustDisplay", () => {
	afterEach(() => {
		delete window.OneTrust;
	});

	it("calls OneTrust.ToggleInfoDisplay when SDK is loaded", () => {
		const mockToggle = vi.fn();
		window.OneTrust = { ToggleInfoDisplay: mockToggle };

		toggleOneTrustDisplay();
		expect(mockToggle).toHaveBeenCalledOnce();
	});

	it("does not throw when OneTrust is not on window", () => {
		expect(() => toggleOneTrustDisplay()).not.toThrow();
	});
});
