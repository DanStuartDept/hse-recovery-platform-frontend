/**
 * Flatten a categorized dictionary (`Record<string, Record<string, string>>`)
 * into a flat dotted-key dictionary (`Record<string, string>`).
 *
 * Example: `{ footer: { "social.fb": "FB" } }` → `{ "footer.social.fb": "FB" }`
 */
export function flattenCategorized(categorized: Record<string, Record<string, string>>): Record<string, string> {
	const flat: Record<string, string> = {};
	for (const [category, entries] of Object.entries(categorized)) {
		for (const [key, value] of Object.entries(entries)) {
			flat[`${category}.${key}`] = value;
		}
	}
	return flat;
}
