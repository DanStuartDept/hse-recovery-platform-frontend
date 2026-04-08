import type { Metadata } from "next";
import { notFound } from "next/navigation";

import "@hseireland/hse-frontend/packages/hse.scss";

import { DictionaryProvider, loadDictionary } from "@repo/i18n";
import { OneTrustScripts } from "@/components/scripts/OneTrustScripts";
import { i18nConfig } from "@/lib/i18n/config";
import { dictionaryLoaders } from "@/lib/i18n/loaders";

export const metadata: Metadata = {
	title: "HSE Multisite Frontend template",
	description: "HSE Multisite Frontend template",
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
			<body>
				<OneTrustScripts />
				<DictionaryProvider flat={flat} locale={lang}>
					{props.children}
				</DictionaryProvider>
			</body>
		</html>
	);
}
