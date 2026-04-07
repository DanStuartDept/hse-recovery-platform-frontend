import { Button } from "@hseireland/hse-frontend-react";
import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for button links — supports internal page or external URL targets. */
type ButtonValue = {
	text: string;
	external_url: string;
	new_window: boolean;
	internal_page: { title: string; url: string } | null;
};

/**
 * Renders a CMS button block using the HSE design system `Button` component.
 *
 * Prefers internal page links (Next.js `<Link>`) over external URLs.
 * External links open in a new window when configured.
 */
export function BlockButton({ value }: BlockComponentProps<ButtonValue>) {
	if (value.internal_page) {
		return (
			<div className="block-button_list">
				<Button href={value.internal_page.url} asElement={Link}>
					{value.internal_page.title}
				</Button>
			</div>
		);
	}
	return (
		<div className="block-button_list">
			<Button
				href={value.external_url}
				target={value.new_window ? "_blank" : undefined}
				rel={value.new_window ? "noopener noreferrer" : undefined}
			>
				{value.text}
			</Button>
		</div>
	);
}
