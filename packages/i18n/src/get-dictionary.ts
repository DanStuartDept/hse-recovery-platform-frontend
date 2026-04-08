import { sharedLoaders } from "./shared-loaders";
import type { DictionaryLoaders } from "./types";
import { unflatten } from "./unflatten";

/**
 * Load and merge flat dictionaries for a locale (shared + app layers).
 * Returns the flat merged `Record<string, string>`.
 *
 * Merge order (last wins):
 * 1. Default locale shared dict (fallback base, if `defaultLocale` provided and differs)
 * 2. Default locale app dict (fallback base)
 * 3. Requested locale shared dict
 * 4. Requested locale app dict
 */
export async function loadDictionary(
	locale: string,
	loaders: DictionaryLoaders,
	defaultLocale?: string,
): Promise<Record<string, string>> {
	let base: Record<string, string> = {};

	if (defaultLocale && locale !== defaultLocale) {
		const defaultShared = sharedLoaders[defaultLocale] ? await sharedLoaders[defaultLocale]() : {};
		const defaultApp = loaders[defaultLocale] ? (await loaders[defaultLocale]()).default : {};
		base = { ...defaultShared, ...defaultApp };
	}

	const shared = sharedLoaders[locale] ? await sharedLoaders[locale]() : {};
	const app = (await loaders[locale]()).default;

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
