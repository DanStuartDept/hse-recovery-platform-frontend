import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for related information — a titled list of internal/external links. */
type RelatedInfoValue = {
	title: string;
	links: Array<{
		text: string;
		external_url: string;
		new_window: boolean;
		internal_page: { url: string } | null;
	}>;
};

/**
 * Renders a related-information sidebar block with a list of internal/external links.
 *
 * Internal page links are preferred; falls back to external URLs.
 */
export function BlockRelatedInfo({
	value,
}: BlockComponentProps<RelatedInfoValue>) {
	return (
		<div className="block-related_information">
			<div className="campain-links-list">
				<h3>{value.title}</h3>
				<ul>
					{value.links.map((link) => (
						<li key={link.text}>
							<Link
								href={
									(link.internal_page && link.internal_page.url) ||
									link.external_url
								}
								target={link.new_window ? "_blank" : undefined}
							>
								{link.text}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
