// Internal module — loads shared dictionaries from the package.
// Mocked in tests via vi.mock.
export const sharedLoaders: Record<string, () => Promise<Record<string, string>>> = {
	"en-ie": () => import("../dictionaries/en-ie.json").then((m) => m.default as Record<string, string>),
	ga: () => import("../dictionaries/ga.json").then((m) => m.default as Record<string, string>),
};
