import type { Metadata } from "next";
import { notFound } from "next/navigation";

import "@hseireland/hse-frontend/packages/hse.scss";

import { config } from "@repo/app-config";
import { DictionaryProvider, loadDictionary } from "@repo/i18n";
import { GtmScripts } from "@/components/scripts/GtmScripts";
import { OneTrustScripts } from "@/components/scripts/OneTrustScripts";
import { PiwikProScripts } from "@/components/scripts/PiwikProScripts";
import { i18nConfig } from "@/lib/i18n/config";
import { dictionaryLoaders } from "@/lib/i18n/loaders";

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

	const flat = await loadDictionary(
		lang,
		dictionaryLoaders,
		i18nConfig.defaultLocale,
	);

	return (
		<html lang={lang}>
			<GtmScripts />
			<body>
				<OneTrustScripts />
				<PiwikProScripts>
					<DictionaryProvider flat={flat} locale={lang}>
						{props.children}
					</DictionaryProvider>
				</PiwikProScripts>
			</body>
		</html>
	);
}
