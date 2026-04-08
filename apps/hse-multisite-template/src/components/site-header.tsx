import { Header } from "@hseireland/hse-frontend-react";
import type { CMSHeaderResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";

/**
 * Props for the {@link SiteHeader} component.
 */
interface SiteHeaderProps {
	/** Header data from the CMS, or null to render the logo-only fallback. */
	data: CMSHeaderResponse | null;
}

/**
 * Site header component that maps CMS header data to the HSE design system Header.
 * Renders a logo-only fallback when CMS data is unavailable.
 */
export function SiteHeader({ data }: SiteHeaderProps) {
	if (!data) {
		return (
			<Header>
				<Header.Logo asElement={Link} href="/" ariaLabel="HSE - homepage" />
			</Header>
		);
	}

	return (
		<Header>
			<Header.Logo
				asElement={Link}
				href={data.logo_link ?? "/"}
				ariaLabel={data.logo_aria ?? "HSE - homepage"}
			/>
			{data.navigation_secondary_links.length > 0 && (
				<Header.UtilityMenu ariaLabel="Utility menu">
					{data.navigation_secondary_links.map((link) => (
						<Header.UtilityMenu.Item key={link.id} href={link.link_url}>
							{link.label}
						</Header.UtilityMenu.Item>
					))}
				</Header.UtilityMenu>
			)}
			{data.navigation_links.length > 0 && (
				<Header.MainMenu ariaLabel={data.navigation_text || "Main menu"}>
					{data.navigation_links.map((link) => (
						<Header.MainMenu.Item key={link.id} href={link.link_url}>
							{link.label}
						</Header.MainMenu.Item>
					))}
				</Header.MainMenu>
			)}
			{data.header_mobile_links.length > 0 && (
				<Header.MobileMenu ariaLabel="Priority links">
					{data.header_mobile_links.map((link) => (
						<Header.MobileMenu.Item key={link.id} href={link.link_url}>
							{link.label}
						</Header.MobileMenu.Item>
					))}
				</Header.MobileMenu>
			)}
		</Header>
	);
}
