import type { DictionaryLoaders } from "@repo/i18n";

// TODO(task-6): remove cast once app dictionaries are migrated to categorized format
export const dictionaryLoaders = {
	en: () => import("@/dictionaries/en.json"),
	ga: () => import("@/dictionaries/ga.json"),
} as unknown as DictionaryLoaders;
