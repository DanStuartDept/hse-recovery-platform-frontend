import type { I18nConfig } from "@repo/i18n";

export const i18nConfig = {
	defaultLocale: "en-ie",
	locales: ["en-ie", "ga"],
} as const satisfies I18nConfig;
