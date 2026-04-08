import type { ReactNode } from "react";
import type { RichTagFactory } from "./types";

/**
 * Parse `<tag>...</tag>` patterns in a template string and replace them
 * with React nodes using the provided tag factory functions.
 * Returns an array of `ReactNode` (strings and elements) for direct JSX rendering.
 * Tags that have no matching factory are left as plain text.
 */
export function rich(template: string, tags: Record<string, RichTagFactory>): ReactNode[] {
	const tagNames = Object.keys(tags);
	if (tagNames.length === 0) return [template];

	const pattern = new RegExp(`<(${tagNames.join("|")})>(.*?)</\\1>`, "g");

	const result: ReactNode[] = [];
	let lastIndex = 0;

	for (const match of template.matchAll(pattern)) {
		const [fullMatch, tagName, innerText] = match;
		const matchIndex = match.index;

		if (matchIndex > lastIndex) {
			result.push(template.slice(lastIndex, matchIndex));
		}

		result.push(tags[tagName](innerText));
		lastIndex = matchIndex + fullMatch.length;
	}

	if (lastIndex < template.length) {
		result.push(template.slice(lastIndex));
	}

	if (result.length === 0) {
		return [template];
	}

	return result;
}
