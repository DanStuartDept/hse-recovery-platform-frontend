import { InsetText } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

type BlockInsetTextValue = { body: string };

export function BlockInsetText({
	value,
}: BlockComponentProps<BlockInsetTextValue>) {
	return <InsetText>{generateRichText(value.body)}</InsetText>;
}
