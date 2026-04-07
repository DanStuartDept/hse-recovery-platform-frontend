import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for a group of expander items. */
type DetailsGroupValue = {
	expanders: Array<{ title: string; body: CMSBlockType[] }>;
};

/**
 * Renders a group of collapsible expanders using the HSE design system `Details.ExpanderGroup`.
 *
 * Each expander's body is rendered via {@link BlockComponentProps.renderBlocks}.
 */
export function BlockDetailsGroup({
	value,
	renderBlocks,
}: BlockComponentProps<DetailsGroupValue>) {
	return (
		<Details.ExpanderGroup>
			{value.expanders.map((item) => (
				<Details expander key={item.title}>
					<Details.Summary>{item.title}</Details.Summary>
					<Details.Text>{renderBlocks(item.body)}</Details.Text>
				</Details>
			))}
		</Details.ExpanderGroup>
	);
}
