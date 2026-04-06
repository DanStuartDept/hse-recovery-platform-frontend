import type { BlockRegistry } from "../types/index";
import { BlockText } from "./block-text";
import { BlockImage } from "./block-image";
import { BlockInsetText } from "./block-inset-text";
import { BlockQuote } from "./block-quote";
import { BlockPromo } from "./block-promo";
import { BlockLinksList } from "./block-links-list";
import { BlockActionLink } from "./block-action-link";
import { BlockDetails } from "./block-details";
import { BlockDetailsGroup } from "./block-details-group";
import { BlockButton } from "./block-button";
import { BlockContentBlock } from "./block-content-block";
import { BlockBrightcove } from "./block-brightcove";
import { BlockRelatedInfo } from "./block-related-info";
import { BlockTeaserLinks } from "./block-teaser-links";
import { BlockFallback } from "./block-fallback";

export const defaultBlockRegistry: BlockRegistry = {
	text: BlockText,
	rich_text_block: BlockText,
	richtext: BlockText,
	image: BlockImage,
	inset_text: BlockInsetText,
	quote: BlockQuote,
	top_tasks: BlockPromo,
	top_task: BlockPromo,
	links_list_group_v2: BlockLinksList,
	action_link: BlockActionLink,
	expander: BlockDetails,
	details: BlockDetails,
	expander_group: BlockDetailsGroup,
	button_list: BlockButton,
	content_block_chooser: BlockContentBlock,
	brightcove_video: BlockBrightcove,
	related_information: BlockRelatedInfo,
	teaser_links: BlockTeaserLinks,
};

export {
	BlockText,
	BlockImage,
	BlockInsetText,
	BlockQuote,
	BlockPromo,
	BlockLinksList,
	BlockActionLink,
	BlockDetails,
	BlockDetailsGroup,
	BlockButton,
	BlockContentBlock,
	BlockBrightcove,
	BlockRelatedInfo,
	BlockTeaserLinks,
	BlockFallback,
};
