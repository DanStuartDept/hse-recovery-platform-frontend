import { flattenCategorized } from "./flatten-categorized";
import { sharedLoaders } from "./shared-loaders";
import type { DictionaryLoaders } from "./types";
import { unflatten } from "./unflatten";

/**
 * Load and merge dictionaries for a locale (shared + app layers).
 * Each dictionary (categorized JSON) is flattened before merging.
 * Returns the flat merged `Record<string, string>`.
 *
 * Merge order (last wins):
 * 1. Default locale shared dict (flattened)
 * 2. Default locale app dict (flattened)
 * 3. Requested locale shared dict (flattened)
 * 4. Requested locale app dict (flattened)
 */
export async function loadDictionary(
	locale: string,
	loaders: DictionaryLoaders,
	defaultLocale?: string,
): Promise<Record<string, string>> {
	let base: Record<string, string> = {};

	if (defaultLocale && locale !== defaultLocale) {
		const defaultShared = sharedLoaders[defaultLocale] ? flattenCategorized(await sharedLoaders[defaultLocale]()) : {};
		const defaultApp = loaders[defaultLocale] ? flattenCategorized((await loaders[defaultLocale]()).default) : {};
		base = { ...defaultShared, ...defaultApp };
	}

	if (!loaders[locale]) {
		throw new Error(`No dictionary loader for locale "${locale}"`);
	}

	const shared = sharedLoaders[locale] ? flattenCategorized(await sharedLoaders[locale]()) : {};
	const app = flattenCategorized((await loaders[locale]()).default);

	return { ...base, ...shared, ...app };
}

/**
 * Load, merge, and unflatten dictionaries for a locale.
 * Returns a nested object with string values and plural functions.
 */
export async function getDictionary<T = Record<string, unknown>>(
	locale: string,
	loaders: DictionaryLoaders,
	defaultLocale?: string,
): Promise<T> {
	const flat = await loadDictionary(locale, loaders, defaultLocale);
	return unflatten(flat, locale) as T;
}
