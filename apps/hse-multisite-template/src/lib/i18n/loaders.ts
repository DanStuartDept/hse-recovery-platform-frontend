import type { DictionaryLoaders } from "@repo/i18n";

export const dictionaryLoaders: DictionaryLoaders = {
	"en-ie": () => import("@/dictionaries/en-ie.json"),
	ga: () => import("@/dictionaries/ga.json"),
};
