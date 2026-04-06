import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type DetailsGroupValue = { expanders: Array<{ title: string; body: CMSBlockType[] }> };

export function BlockDetailsGroup({ value, renderBlocks }: BlockComponentProps<DetailsGroupValue>) {
	return (
		<Details.ExpanderGroup>
			{value.expanders.map((item) => (
				<Details expander key={item.title}>
					<Details.Summary>{item.title}</Details.Summary>
					<Details.Text>{renderBlocks ? renderBlocks(item.body) : null}</Details.Text>
				</Details>
			))}
		</Details.ExpanderGroup>
	);
}
