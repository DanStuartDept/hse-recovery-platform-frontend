import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for section — a title and nested body blocks. */
type SectionValue = { title: string; body: CMSBlockType[] };

/**
 * Renders a section block with a heading and nested child blocks.
 *
 * Maps to the `section` block type from `hsebase.blocks.Section`.
 * Used on landing pages to group content under titled sections
 * (e.g. "Services and information", "Activity").
 */
export function BlockSection({
	value,
	renderBlocks,
}: BlockComponentProps<SectionValue>) {
	return (
		<section>
			{value.title && <h2>{value.title}</h2>}
			{renderBlocks(value.body)}
		</section>
	);
}
