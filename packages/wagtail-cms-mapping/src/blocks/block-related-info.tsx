import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

type RelatedInfoValue = {
	title: string;
	links: Array<{
		text: string;
		external_url: string;
		new_window: boolean;
		internal_page: { url: string } | null;
	}>;
};

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
