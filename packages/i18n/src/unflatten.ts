import type { PluralGroup } from "./plural";
import { plural } from "./plural";

const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"] as const;

type PluralSuffixString = (typeof PLURAL_SUFFIXES)[number];

function findPluralSuffix(key: string): PluralSuffixString | undefined {
	return PLURAL_SUFFIXES.find((s) => key.endsWith(s));
}

function setNested(obj: Record<string, unknown>, path: string[], value: unknown): void {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i];
		if (!(segment in current) || typeof current[segment] !== "object" || current[segment] === null) {
			current[segment] = {};
		}
		current = current[segment] as Record<string, unknown>;
	}
	current[path[path.length - 1]] = value;
}

/**
 * Convert a flat dotted-key dictionary into a nested object.
 * Keys ending in `_zero`, `_one`, `_two`, `_few`, `_many`, or `_other`
 * are grouped into a function: `(count: number) => string`.
 */
export function unflatten(flat: Record<string, string>, locale: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const pluralGroups = new Map<string, PluralGroup>();

	for (const [key, value] of Object.entries(flat)) {
		const suffix = findPluralSuffix(key);
		if (suffix) {
			const baseKey = key.slice(0, -suffix.length);
			const rule = suffix.slice(1) as Intl.LDMLPluralRule;
			const group = pluralGroups.get(baseKey) ?? {};
			group[rule] = value;
			pluralGroups.set(baseKey, group);
		} else {
			setNested(result, key.split("."), value);
		}
	}

	for (const [baseKey, group] of pluralGroups) {
		const fn = (count: number) => plural(group, count, locale);
		setNested(result, baseKey.split("."), fn);
	}

	return result;
}
