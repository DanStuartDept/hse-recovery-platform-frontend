import { createI18nProxy } from "@repo/i18n";
import { i18nConfig } from "@/lib/i18n/config";

export const proxy = createI18nProxy(i18nConfig);

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|assets|favicon.ico|sitemap|robots.txt).*)",
	],
};
