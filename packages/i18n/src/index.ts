// Types

// Proxy factory
export { createI18nProxy } from "./create-i18n-proxy";
// Dictionary loading
export { flattenCategorized } from "./flatten-categorized";
export { getDictionary, loadDictionary } from "./get-dictionary";
// String utilities
export { interpolate } from "./interpolate";
export type { PluralGroup } from "./plural";
export { plural } from "./plural";
// React provider
export { DictionaryProvider, useDictionary } from "./provider";
export { rich } from "./rich";
export type {
	CategorizedDictionary,
	DictionaryLoaders,
	FlattenCategorized,
	I18nConfig,
	MergedDictionary,
	RichTagFactory,
	Unflatten,
} from "./types";
export { unflatten } from "./unflatten";
