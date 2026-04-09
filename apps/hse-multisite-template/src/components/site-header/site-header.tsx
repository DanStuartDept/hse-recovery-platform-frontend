"use client";

import {
	Header,
	HeaderMainMenuItem,
	HeaderMobileMenuItem,
	HeaderUtilityMenuItem,
} from "@hseireland/hse-frontend-react";
import { config } from "@repo/app-config";
import type { CMSHeaderResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";

/**
 * Converts a CMS absolute URL to a relative path if it matches the CMS base URL.
 * External URLs are returned unchanged.
 */
function toLocalHref(url: string): string {
	if (url.startsWith(config.cms.baseURL)) {
		return url.slice(config.cms.baseURL.length) || "/";
	}
	return url;
}

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
						<HeaderUtilityMenuItem
							key={link.id}
							href={toLocalHref(link.link_url)}
						>
							{link.label}
						</HeaderUtilityMenuItem>
					))}
				</Header.UtilityMenu>
			)}
			{data.navigation_links.length > 0 && (
				<Header.MainMenu ariaLabel={data.navigation_text || "Main menu"}>
					{data.navigation_links.map((link) => (
						<HeaderMainMenuItem key={link.id} href={toLocalHref(link.link_url)}>
							{link.label}
						</HeaderMainMenuItem>
					))}
				</Header.MainMenu>
			)}
			{data.header_mobile_links.length > 0 && (
				<Header.MobileMenu ariaLabel="Priority links">
					{data.header_mobile_links.map((link) => (
						<HeaderMobileMenuItem
							key={link.id}
							href={toLocalHref(link.link_url)}
						>
							{link.label}
						</HeaderMobileMenuItem>
					))}
				</Header.MobileMenu>
			)}
		</Header>
	);
}
