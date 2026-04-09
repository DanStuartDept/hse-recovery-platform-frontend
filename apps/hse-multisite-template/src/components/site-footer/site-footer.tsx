"use client";

import { Footer } from "@hseireland/hse-frontend-react";
import { config } from "@repo/app-config";
import { useDictionary } from "@repo/i18n";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { toggleOneTrustDisplay } from "@/lib/one-trust";

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

/** Extract social link entries from the footer dictionary namespace. */
function getSocialLinks(
	footer: Dictionary["footer"],
): { label: string; href: string }[] {
	const socialKeys = [
		"facebook",
		"instagram",
		"tiktok",
		"youtube",
		"linkedin",
	] as const;
	return socialKeys.map((key) => ({
		label: footer.social[key].label,
		href: footer.social[key].href,
	}));
}

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
	const dict = useDictionary<Dictionary>();

	if (!data) {
		return (
			<Footer>
				<Footer.Bottom>
					<Footer.Copyright />
				</Footer.Bottom>
			</Footer>
		);
	}

	const { footer } = dict;
	const socialLinks = getSocialLinks(footer);

	return (
		<Footer>
			<Footer.Top>
				<Footer.Label>{footer.label}</Footer.Label>
				<Footer.Content>
					<p>
						{footer.hours.weekday}
						<br />
						{footer.hours.saturday}
						<br />
						{footer.hours.sunday}
						<br />
						{footer.hours.bankHoliday}
					</p>
					<p>
						<strong>
							{footer.freephone.label}{" "}
							<a href={footer.freephone.href}>{footer.freephone.number}</a>
						</strong>
					</p>
					<p>
						<strong>
							{footer.international.label}{" "}
							<a href={footer.international.href}>
								{footer.international.number}
							</a>
						</strong>
					</p>
				</Footer.Content>
				<Footer.Content>
					{socialLinks.map((link) => (
						<Footer.ListItem
							key={link.label}
							href={link.href}
							target="_blank"
							rel="noreferrer noopener"
						>
							{link.label}
						</Footer.ListItem>
					))}
				</Footer.Content>
				<Footer.Content>
					{data.footer_links.map((link) => (
						<Footer.ListItem
							key={link.id}
							href={toLocalHref(link.link_url)}
							target="_blank"
							rel="noreferrer noopener"
						>
							{link.link_label}
						</Footer.ListItem>
					))}
					{!config.isLocalhost && config.oneTrustDomainId && (
						<Footer.ListItem asElement="button" onClick={toggleOneTrustDisplay}>
							{footer.cookieSettings}
						</Footer.ListItem>
					)}
				</Footer.Content>
			</Footer.Top>
			<Footer.Bottom>
				{data.footer_secondary_links.map((link) => (
					<Footer.ListItem
						key={link.id}
						asElement={Link}
						href={toLocalHref(link.link_url)}
					>
						{link.link_label}
					</Footer.ListItem>
				))}
				<Footer.Copyright />
			</Footer.Bottom>
		</Footer>
	);
}
