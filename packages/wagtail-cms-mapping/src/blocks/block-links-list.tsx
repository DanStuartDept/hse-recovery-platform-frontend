import { LinksList, LinksListItem } from "@hseireland/hse-frontend-react";
import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

type LinksListValue = {
	lists: Array<{
		heading: string;
		links: Array<{ menu_label?: string; title?: string; url: string }>;
	}>;
};

export function BlockLinksList({ value }: BlockComponentProps<LinksListValue>) {
	return (
		<>
			{value.lists.map((item, i) => (
				<LinksList
					key={item.heading || i}
					heading={item.heading}
					headingLevel="h2"
				>
					{item.links.map((link, j) => (
						<LinksListItem key={link.url || j} href={link.url} asElement={Link}>
							{link.menu_label || link.title || ""}
						</LinksListItem>
					))}
				</LinksList>
			))}
		</>
	);
}
