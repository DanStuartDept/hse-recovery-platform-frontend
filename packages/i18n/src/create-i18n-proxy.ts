import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { I18nConfig } from "./types";

function getPreferredLocale(request: NextRequest, config: I18nConfig): string {
	const { defaultLocale, locales } = config;

	// 1. Accept-Language header
	if (locales.length > 1) {
		const negotiator = new Negotiator({
			headers: { "accept-language": request.headers.get("accept-language") ?? "" },
		});
		try {
			return match(negotiator.languages(), [...locales], defaultLocale);
		} catch {
			// match() throws if no languages can be negotiated
		}
	}

	// 2. Fallback
	return defaultLocale;
}

/**
 * Factory returning a Next.js proxy function that handles locale detection,
 * URL rewriting (default locale hidden), and redirects.
 */
export function createI18nProxy(config: I18nConfig) {
	const { defaultLocale, locales } = config;

	return function proxy(request: NextRequest): NextResponse {
		const { pathname } = request.nextUrl;

		const pathnameLocale = locales.find((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

		if (pathnameLocale) {
			if (pathnameLocale === defaultLocale) {
				const stripped = pathname.replace(new RegExp(`^/${defaultLocale}`), "") || "/";
				const url = request.nextUrl.clone();
				url.pathname = stripped;
				return NextResponse.redirect(url);
			}

			return NextResponse.next();
		}

		const locale = getPreferredLocale(request, config);

		if (locale !== defaultLocale) {
			const url = request.nextUrl.clone();
			url.pathname = `/${locale}${pathname}`;
			return NextResponse.redirect(url);
		}

		const url = request.nextUrl.clone();
		url.pathname = `/${defaultLocale}${pathname}`;
		return NextResponse.rewrite(url);
	};
}
