import {
	BlockQuoteCaption,
	BlockQuoteHeading,
	BlockQuoteText,
	BlockQuote as DSBlockQuote,
} from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for quotes — title, body text, and attribution author. */
type BlockQuoteValue = { title: string; body: string; author: string };

/** Renders a CMS quote block using the HSE design system `BlockQuote` components. */
export function BlockQuote({ value }: BlockComponentProps<BlockQuoteValue>) {
	return (
		<DSBlockQuote>
			{value.title && <BlockQuoteHeading>{value.title}</BlockQuoteHeading>}
			{value.body && <BlockQuoteText>{value.body}</BlockQuoteText>}
			{value.author && <BlockQuoteCaption>{value.author}</BlockQuoteCaption>}
		</DSBlockQuote>
	);
}
