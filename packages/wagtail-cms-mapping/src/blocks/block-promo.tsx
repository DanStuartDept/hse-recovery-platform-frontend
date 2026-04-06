import {
	Col,
	Promo,
	PromoContent,
	PromoDescription,
	PromoHeading,
	Row,
} from "@hseireland/hse-frontend-react";
import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

type PromoItem = {
	type: string;
	value: {
		menu_label: string;
		link_text: string;
		link_description: string;
		url?: string;
		link_url?: string;
	};
};

export function BlockPromo({ value }: BlockComponentProps<PromoItem[]>) {
	return (
		<Row className="hse-top-tasks hse-promo-group">
			{value.map((promo, i) => (
				<Col
					width="one-half"
					className="hse-promo-group__item"
					key={promo.value.menu_label || i}
				>
					<Promo
						asElement={Link}
						href={promo.value.url || promo.value.link_url || ""}
					>
						<PromoContent>
							<PromoHeading>
								{promo.value.menu_label || promo.value.link_text}
							</PromoHeading>
							<PromoDescription>
								{promo.value.link_description}
							</PromoDescription>
						</PromoContent>
					</Promo>
				</Col>
			))}
		</Row>
	);
}
