import type { I18nConfig } from "@repo/i18n";

export const i18nConfig = {
	defaultLocale: "en",
	locales: ["en", "ga"],
} as const satisfies I18nConfig;
