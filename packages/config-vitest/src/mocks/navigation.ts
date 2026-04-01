import { type Mock, vi } from "vitest";

interface NavigationMockObject {
	notFound: Mock;
	redirect: Mock;
	useRouter: Mock;
	usePathname: Mock;
	useSearchParams: Mock;
}

/**
 * Creates the standard Next.js navigation mock object
 * Centralized to eliminate duplication
 */
function createNavigationMockObject(): NavigationMockObject {
	return {
		notFound: vi.fn(),
		redirect: vi.fn(),
		useRouter: vi.fn(() => ({
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			prefetch: vi.fn(),
		})),
		usePathname: vi.fn(() => "/"),
		useSearchParams: vi.fn(() => new URLSearchParams()),
	};
}

/**
 * Mock for Next.js navigation functions
 * Use this in vi.mock() calls
 */
export function mockNextNavigation() {
	return vi.mock("next/navigation", () => createNavigationMockObject());
}

/**
 * Creates mock navigation functions that can be imported and used in tests
 * Use this when you need direct access to the mock functions
 */
export function createNavigationMocks() {
	return createNavigationMockObject();
}
