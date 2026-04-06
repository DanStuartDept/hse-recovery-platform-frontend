import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

type BlockTextValue = string | { body: string };

export function BlockText({ value }: BlockComponentProps<BlockTextValue>) {
	const html = typeof value === "string" ? value : value.body;
	return <>{generateRichText(html)}</>;
}
