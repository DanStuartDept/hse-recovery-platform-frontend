import { InsetText } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

/** Block value shape for inset text — a single `body` HTML string. */
type BlockInsetTextValue = { body: string };

/** Renders a CMS inset-text block using the HSE design system {@link InsetText} component. */
export function BlockInsetText({
	value,
}: BlockComponentProps<BlockInsetTextValue>) {
	return <InsetText>{generateRichText(value.body)}</InsetText>;
}
