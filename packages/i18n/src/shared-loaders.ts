// Internal module — loads shared dictionaries from the package.
// Mocked in tests via vi.mock.
import type { CategorizedDictionary } from "./types";

export const sharedLoaders: Record<string, () => Promise<CategorizedDictionary>> = {
	en: () => import("../dictionaries/en.json").then((m) => m.default as CategorizedDictionary),
	ga: () => import("../dictionaries/ga.json").then((m) => m.default as CategorizedDictionary),
};
