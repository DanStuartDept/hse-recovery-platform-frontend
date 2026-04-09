import type { DictionaryLoaders } from "@repo/i18n";

export const dictionaryLoaders: DictionaryLoaders = {
	en: () => import("@/dictionaries/en.json"),
	ga: () => import("@/dictionaries/ga.json"),
};
