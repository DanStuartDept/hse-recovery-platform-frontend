import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type DetailsValue = { title: string; body: CMSBlockType[] };

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
