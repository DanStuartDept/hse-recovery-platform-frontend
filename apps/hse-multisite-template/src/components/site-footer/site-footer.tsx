"use client";

import { Footer } from "@hseireland/hse-frontend-react";
import { config } from "@repo/app-config";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";
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

const SOCIAL_LINKS = [
	{ label: "HSE Facebook", href: "https://www.facebook.com/HSElive/" },
	{ label: "HSE Instagram", href: "https://instagram.com/irishhealthservice" },
	{ label: "HSE TikTok", href: "https://www.tiktok.com/@hselive" },
	{
		label: "HSE YouTube",
		href: "https://www.youtube.com/channel/UCoNNhGGAYkdavsSXp1iVzCg",
	},
	{
		label: "HSE Linkedin",
		href: "https://ie.linkedin.com/company/health-service-executive",
	},
] as const;

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
			<Footer.Top>
				<Footer.Label>HSE Live - we&apos;re here to help</Footer.Label>
				<Footer.Content>
					<p>
						Monday to Friday: 8am to 8pm
						<br />
						Saturday: 9am to 5pm
						<br />
						Sunday: Closed
						<br />
						Bank holidays: Closed
					</p>
					<p>
						<strong>
							Freephone: <a href="tel:1800700700">1800 700 700</a>
						</strong>
					</p>
					<p>
						<strong>
							From outside Ireland:{" "}
							<a href="tel:0035312408787">00 353 1 240 8787</a>
						</strong>
					</p>
				</Footer.Content>
				<Footer.Content>
					{SOCIAL_LINKS.map((link) => (
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
							Cookies settings
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
