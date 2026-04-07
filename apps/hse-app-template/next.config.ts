import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------
// Each directive is an array of sources for readability. Joined at build time.
// When adding a new third-party script, add its domain to the relevant arrays.
// ---------------------------------------------------------------------------

const scriptSrc = [
	"'self'",
	"'unsafe-inline'", // required for GTM / OneTrust inline snippets
	"*.googletagmanager.com",
	"*.cookielaw.org",
	"*.onetrust.com",
	"*.containers.piwik.pro",
	"*.piwik.pro",
];

const styleSrc = ["'self'", "'unsafe-inline'"];

const imgSrc = [
	"'self'",
	"data:",
	"*.hse.ie",
	"*.googletagmanager.com",
	"*.google-analytics.com",
];

const connectSrc = [
	"'self'",
	"*.hse.ie",
	"*.cookielaw.org",
	"*.onetrust.com",
	"*.google-analytics.com",
	"*.containers.piwik.pro",
	"*.piwik.pro",
];

const frameSrc = ["'self'", "*.youtube-nocookie.com", "*.google.com"];

const fontSrc = ["'self'", "data:"];

const csp = [
	`default-src 'self'`,
	`script-src ${scriptSrc.join(" ")}`,
	`style-src ${styleSrc.join(" ")}`,
	`img-src ${imgSrc.join(" ")}`,
	`connect-src ${connectSrc.join(" ")}`,
	`frame-src ${frameSrc.join(" ")}`,
	`font-src ${fontSrc.join(" ")}`,
	`base-uri 'self'`,
	`form-action 'self'`,
	`frame-ancestors 'none'`,
]
	.join("; ")
	.trim();

// ---------------------------------------------------------------------------
// Security headers applied to all routes
// ---------------------------------------------------------------------------

const securityHeaders = [
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains",
	},
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{ key: "Content-Security-Policy", value: csp },
];

// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
