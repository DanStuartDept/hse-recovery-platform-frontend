import { Footer } from "@hseireland/hse-frontend-react";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";

/**
 * Props for the {@link SiteFooter} component.
 */
interface SiteFooterProps {
	/** Footer data from the CMS, or null to render the copyright-only fallback. */
	data: CMSFooterResponse | null;
}

/**
 * Site footer component that maps CMS footer data to the HSE design system Footer.
 * Renders a copyright-only fallback when CMS data is unavailable.
 */
export function SiteFooter({ data }: SiteFooterProps) {
	if (!data) {
		return (
			<Footer>
				<Footer.Bottom>
					<Footer.Copyright />
				</Footer.Bottom>
			</Footer>
		);
	}

	return (
		<Footer>
			{data.footer_links.length > 0 && (
				<Footer.Top>
					<Footer.Content>
						{data.footer_links.map((link) => (
							<Footer.ListItem key={link.id} href={link.link_url}>
								{link.link_label}
							</Footer.ListItem>
						))}
					</Footer.Content>
				</Footer.Top>
			)}
			<Footer.Bottom>
				{data.footer_secondary_links.map((link) => (
					<Footer.ListItem key={link.id} href={link.link_url}>
						{link.link_label}
					</Footer.ListItem>
				))}
				<Footer.Copyright />
			</Footer.Bottom>
		</Footer>
	);
}
