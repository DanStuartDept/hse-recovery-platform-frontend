import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

/** Block value shape — accepts either a raw HTML string or an object with a `body` field. */
type BlockTextValue = string | { body: string };

/**
 * Renders a CMS rich-text block as parsed HTML.
 *
 * Handles both the legacy string format and the `{ body }` object format.
 * Internal links are rewritten to Next.js `<Link>` via {@link generateRichText}.
 */
export function BlockText({ value }: BlockComponentProps<BlockTextValue>) {
	const html = typeof value === "string" ? value : value.body;
	return <>{generateRichText(html)}</>;
}
