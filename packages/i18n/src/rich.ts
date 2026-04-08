import { createElement, Fragment, type ReactNode } from "react";
import type { RichTagFactory } from "./types";

/**
 * Parse `<tag>...</tag>` patterns in a template string and replace them
 * with React nodes using the provided tag factory functions.
 * Returns an array of `ReactNode` (strings and elements) for direct JSX rendering.
 * Tags that have no matching factory are left as plain text.
 * Each item in the returned array is wrapped in a keyed Fragment to avoid
 * React "missing key" warnings when the array is rendered in JSX.
 */
export function rich(template: string, tags: Record<string, RichTagFactory>): ReactNode[] {
	const tagNames = Object.keys(tags);
	if (tagNames.length === 0) return [template];

	const pattern = new RegExp(`<(${tagNames.join("|")})>(.*?)</\\1>`, "g");

	const result: ReactNode[] = [];
	let lastIndex = 0;
	let keyIndex = 0;

	for (const match of template.matchAll(pattern)) {
		const [fullMatch, tagName, innerText] = match;
		const matchIndex = match.index;

		if (matchIndex > lastIndex) {
			result.push(createElement(Fragment, { key: keyIndex++ }, template.slice(lastIndex, matchIndex)));
		}

		result.push(createElement(Fragment, { key: keyIndex++ }, tags[tagName](innerText)));
		lastIndex = matchIndex + fullMatch.length;
	}

	if (lastIndex < template.length) {
		result.push(createElement(Fragment, { key: keyIndex++ }, template.slice(lastIndex)));
	}

	if (result.length === 0) {
		return [template];
	}

	return result;
}
