import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for content blocks — wraps a nested array of child blocks. */
type ContentBlockValue = { body?: CMSBlockType[] };

/**
 * Renders a CMS content-block chooser by delegating to {@link BlockComponentProps.renderBlocks}.
 *
 * Acts as a pass-through container for nested StreamField blocks.
 */
export function BlockContentBlock({
	value,
	renderBlocks,
}: BlockComponentProps<ContentBlockValue>) {
	if (!value.body || !renderBlocks) return null;
	return <>{renderBlocks(value.body)}</>;
}
