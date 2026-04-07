import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for details/expander — a title and nested body blocks. */
type DetailsValue = { title: string; body: CMSBlockType[] };

/**
 * Renders a collapsible details/expander block using the HSE design system `Details` component.
 *
 * Maps to both `details` and `expander` block types. When `type` is `"expander"`,
 * the component renders in expander mode.
 */
export function BlockDetails({
	type,
	value,
	renderBlocks,
}: BlockComponentProps<DetailsValue>) {
	return (
		<Details expander={type === "expander"}>
			<Details.Summary>{value.title}</Details.Summary>
			<Details.Text>{renderBlocks(value.body)}</Details.Text>
		</Details>
	);
}
