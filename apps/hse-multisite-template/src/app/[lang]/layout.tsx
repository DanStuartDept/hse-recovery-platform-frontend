import type { Metadata } from "next";
import { notFound } from "next/navigation";

import "@/styles/main.scss";

import { config } from "@repo/app-config";
import { DictionaryProvider, loadDictionary } from "@repo/i18n";
import { error as logError, warn } from "@repo/logger";
import { isNotFound } from "@repo/wagtail-api-client";
import type {
	CMSFooterResponse,
	CMSHeaderResponse,
} from "@repo/wagtail-cms-types/settings";
import { GtmScripts } from "@/components/scripts/GtmScripts";
import { OneTrustScripts } from "@/components/scripts/OneTrustScripts";
import { PiwikProScripts } from "@/components/scripts/PiwikProScripts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cmsClient } from "@/lib/cms/client";
import { i18nConfig } from "@/lib/i18n/config";
import { dictionaryLoaders } from "@/lib/i18n/loaders";

/** ISR revalidation interval in seconds (1 hour). */
const REVALIDATE_SECONDS = 3600;

/** App-level branding constants — not env vars, set per-app when scaffolding. */
const SITE_NAME = "HSE.ie";
const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const metadata: Metadata = {
	title: {
		template: TITLE_TEMPLATE,
		default: SITE_NAME,
	},
	metadataBase: new URL(config.siteUrl),
	formatDetection: {
		telephone: false,
	},
};

export async function generateStaticParams() {
	return i18nConfig.locales.map((lang) => ({ lang }));
}

export default async function RootLayout(props: LayoutProps<"/[lang]">) {
	const { lang } = await props.params;

	if (!(i18nConfig.locales as readonly string[]).includes(lang)) {
		notFound();
	}

	let flat: Record<string, string>;
	try {
		flat = await loadDictionary(
			lang,
			dictionaryLoaders,
			i18nConfig.defaultLocale,
		);
	} catch (err) {
		logError("[i18n] Dictionary loading failed for locale:", lang, err);
		throw err;
	}

	const [headerResponse, footerResponse] = await Promise.all([
		cmsClient.fetchHeader({
			next: { revalidate: REVALIDATE_SECONDS },
		} as RequestInit),
		cmsClient.fetchFooter({
			next: { revalidate: REVALIDATE_SECONDS },
		} as RequestInit),
	]);

	let headerData: CMSHeaderResponse | null = null;
	if (isNotFound(headerResponse)) {
		warn("[Layout] Failed to fetch header:", headerResponse.message);
	} else {
		headerData = headerResponse;
	}

	let footerData: CMSFooterResponse | null = null;
	if (isNotFound(footerResponse)) {
		warn("[Layout] Failed to fetch footer:", footerResponse.message);
	} else {
		footerData = footerResponse;
	}

	return (
		<html lang={lang}>
			<GtmScripts />
			<body>
				<OneTrustScripts />
				<PiwikProScripts>
					<DictionaryProvider flat={flat} locale={lang}>
						<SiteHeader data={headerData} />
						{props.children}
						<SiteFooter data={footerData} />
					</DictionaryProvider>
				</PiwikProScripts>
			</body>
		</html>
	);
}
