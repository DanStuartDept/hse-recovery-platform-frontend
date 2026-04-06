import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type ContentBlockValue = { body?: CMSBlockType[] };

export function BlockContentBlock({ value, renderBlocks }: BlockComponentProps<ContentBlockValue>) {
	if (!value.body || !renderBlocks) return null;
	return <>{renderBlocks(value.body)}</>;
}
