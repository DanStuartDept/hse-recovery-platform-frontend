export { isNotFound } from "./is-not-found.js";
export { slugToPath } from "./slug-to-path.js";

import type { CMSQueries } from "@repo/wagtail-cms-types/core";

export function buildQueryString(queries: CMSQueries | undefined): string {
	if (!queries) {
		return "";
	}

	const params = new URLSearchParams();

	for (const key in queries) {
		if (Object.hasOwn(queries, key) && queries[key] !== undefined) {
			const value = queries[key];

			if (Array.isArray(value)) {
				params.set(key, value.join(","));
			} else if (value !== "") {
				params.set(key, String(value));
			}
		}
	}

	return params.toString();
}
