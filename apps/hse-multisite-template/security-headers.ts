/**
 * Security headers applied to all routes via next.config.ts `headers()`.
 *
 * CSP directives are built dynamically based on which integrations are
 * configured via NEXT_PUBLIC_* env vars. If GTM isn't configured, GTM
 * domains won't appear in the policy.
 *
 * Run `pnpm test` to validate the CSP is well-formed.
 */

// -- Integration domains (only added when the integration is configured) -----

const gtmDomains = {
	script: ["*.googletagmanager.com"],
	img: ["*.googletagmanager.com", "*.google-analytics.com"],
	connect: ["*.google-analytics.com"],
};

const oneTrustDomains = {
	script: ["*.cookielaw.org", "*.onetrust.com"],
	img: ["*.cookielaw.org", "*.onetrust.com"],
	style: ["*.cookielaw.org"],
	connect: ["*.cookielaw.org", "*.onetrust.com"],
};

function getPiwikDomains(): { script: string[]; connect: string[] } {
	const defaults = ["*.containers.piwik.pro", "*.piwik.pro"];
	const containerUrl = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL;

	if (!containerUrl) {
		return { script: defaults, connect: defaults };
	}

	try {
		const { origin } = new URL(containerUrl);
		const domains = defaults.includes(origin)
			? defaults
			: [...defaults, origin];
		return { script: domains, connect: domains };
	} catch {
		return { script: defaults, connect: defaults };
	}
}

// -- Build CSP from env vars -------------------------------------------------

function buildCSP(): string {
	const hasGtm = !!process.env.NEXT_PUBLIC_GTM_ID;
	const hasOneTrust = !!process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID;
	const hasPiwik = !!process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID;
	const piwikDomains = hasPiwik ? getPiwikDomains() : undefined;

	const isDev = process.env.NODE_ENV === "development";

	const scriptSrc = [
		"'self'",
		"'unsafe-inline'", // required for tag manager inline snippets
		...(isDev ? ["'unsafe-eval'"] : []), // React 19 requires eval() in dev for stack traces
		...(hasGtm ? gtmDomains.script : []),
		...(hasOneTrust ? oneTrustDomains.script : []),
		...(piwikDomains ? piwikDomains.script : []),
	];

	const imgSrc = [
		"'self'",
		"data:",
		"*.hse.ie",
		...(hasGtm ? gtmDomains.img : []),
		...(hasOneTrust ? oneTrustDomains.img : []),
	];

	const connectSrc = [
		"'self'",
		"*.hse.ie",
		...(hasGtm ? gtmDomains.connect : []),
		...(hasOneTrust ? oneTrustDomains.connect : []),
		...(piwikDomains ? piwikDomains.connect : []),
	];

	const directives: Record<string, string[]> = {
		"default-src": ["'self'"],
		"script-src": scriptSrc,
		"style-src": [
			"'self'",
			"'unsafe-inline'",
			...(hasOneTrust ? oneTrustDomains.style : []),
		],
		"img-src": imgSrc,
		"connect-src": connectSrc,
		"frame-src": ["'self'", "*.youtube-nocookie.com", "*.google.com"],
		"font-src": ["'self'", "data:"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
	};

	return Object.entries(directives)
		.map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
		.join("; ");
}

// -- Exports -----------------------------------------------------------------

export const contentSecurityPolicy = buildCSP();

export const securityHeaders = [
	{ key: "Content-Security-Policy", value: contentSecurityPolicy },
	{
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains",
	},
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
];
