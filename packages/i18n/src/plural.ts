import { interpolate } from "./interpolate";

/** Plural category group — keys match `Intl.PluralRules` categories. */
export type PluralGroup = Partial<Record<Intl.LDMLPluralRule, string>>;

/**
 * Select the correct plural form for `count` using `Intl.PluralRules`,
 * then interpolate `{count}` into the result.
 */
export function plural(group: PluralGroup, count: number, locale: string): string {
	// Honour an explicit "zero" entry even for locales whose plural rules don't
	// include a "zero" category (e.g. English maps 0 → "other" in CLDR).
	if (count === 0 && group.zero !== undefined) {
		return interpolate(group.zero, { count: String(count) });
	}
	const rule = new Intl.PluralRules(locale).select(count);
	const template = group[rule] ?? group.other ?? "";
	return interpolate(template, { count: String(count) });
}
