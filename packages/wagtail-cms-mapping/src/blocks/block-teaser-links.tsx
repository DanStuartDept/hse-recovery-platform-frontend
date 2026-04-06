import Link from "next/link";
import { Col, Promo, PromoContent, PromoDescription, PromoHeading, Row } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type TeaserLinksValue = {
	teaser_links: Array<{ menu_label: string; title: string; description: string; url: string }>;
};

export function BlockTeaserLinks({ value }: BlockComponentProps<TeaserLinksValue>) {
	return (
		<Row className="hse-promo-group">
			{value.teaser_links.map((link, i) => (
				<Col width="one-half" className="hse-promo-group__item hse-u-margin-bottom-5" key={link.url || i}>
					<Promo asElement={Link} href={link.url || "#"}>
						<PromoContent>
							<PromoHeading>{link.menu_label || link.title}</PromoHeading>
							<PromoDescription>{link.description}</PromoDescription>
						</PromoContent>
					</Promo>
				</Col>
			))}
		</Row>
	);
}
