import { ActionLink } from "@hseireland/hse-frontend-react";
import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

/** Block value shape for action links — supports internal page or external URL targets. */
type ActionLinkValue = {
	text: string;
	external_url: string;
	new_window: boolean;
	internal_page: { title: string; url: string } | null;
};

/**
 * Renders a CMS action link using the HSE design system `ActionLink` component.
 *
 * Prefers internal page links (Next.js `<Link>`) over external URLs.
 * External links open in a new window when configured.
 */
export function BlockActionLink({
	value,
}: BlockComponentProps<ActionLinkValue>) {
	if (value.internal_page) {
		return (
			<ActionLink asElement={Link} href={value.internal_page.url}>
				{value.internal_page.title}
			</ActionLink>
		);
	}
	return (
		<ActionLink
			href={value.external_url}
			target={value.new_window ? "_blank" : undefined}
			rel={value.new_window ? "noopener noreferrer" : undefined}
		>
			{value.text}
		</ActionLink>
	);
}
