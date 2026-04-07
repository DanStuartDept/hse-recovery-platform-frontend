import { clientSchema, gtmSchema, oneTrustSchema, piwikSchema } from "./schemas";

/** Client-safe configuration from NEXT_PUBLIC_* env vars. */
export type AppConfig = {
	/** CMS connection settings — shape compatible with ClientOptions from `@repo/wagtail-api-client`. */
	cms: {
		/** Wagtail CMS base URL (e.g., `"https://cms.hse.ie"`). */
		baseURL: string;
		/** API version path (e.g., `"/api/v2"`). */
		apiPath: string;
	};
	/** Current deployment environment. */
	environment: "localhost" | "dev" | "pre-prod" | "prod";
	/** Public site URL for canonical links, sitemap, and OG tags. */
	siteUrl: string;
	/** Google Tag Manager container ID. `undefined` if not configured. */
	gtmId?: string;
	/** OneTrust cookie consent domain ID. `undefined` if not configured. */
	oneTrustDomainId?: string;
	/** Piwik Pro analytics settings. `undefined` if not configured. Both fields required if present. */
	piwik?: {
		/** Piwik Pro container ID. */
		containerId: string;
		/** Piwik Pro instance URL. */
		containerUrl: string;
	};
	/** `true` when environment is `"localhost"`. */
	isLocalhost: boolean;
	/** `true` when environment is `"prod"`. */
	isProduction: boolean;
	/** `true` when not localhost and at least one analytics integration is configured. */
	analyticsEnabled: boolean;
};

const TEST_CONFIG: AppConfig = {
	cms: { baseURL: "", apiPath: "" },
	environment: "localhost",
	siteUrl: "http://localhost:3000",
	isLocalhost: true,
	isProduction: false,
	analyticsEnabled: false,
};

function createConfig(): AppConfig {
	if (process.env.NODE_ENV === "test") {
		return TEST_CONFIG;
	}

	// Required — throws on missing/invalid
	const client = clientSchema.parse({
		cms: {
			baseURL: process.env.NEXT_PUBLIC_CMS_API_ENDPOINT,
			apiPath: process.env.NEXT_PUBLIC_API_PATH,
		},
		environment: process.env.NEXT_PUBLIC_ENVIRONMENT_NAME,
		siteUrl: process.env.NEXT_PUBLIC_SITEURL,
	});

	// Optional — undefined if missing/invalid
	const gtmResult = gtmSchema.safeParse(process.env.NEXT_PUBLIC_GTM_ID);
	const gtmId = gtmResult.success ? gtmResult.data : undefined;

	const oneTrustResult = oneTrustSchema.safeParse(process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID);
	const oneTrustDomainId = oneTrustResult.success ? oneTrustResult.data : undefined;

	// Piwik: only validate if at least one env var is set
	const rawPiwikId = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID;
	const rawPiwikUrl = process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL;
	const piwikInput = rawPiwikId || rawPiwikUrl ? { containerId: rawPiwikId, containerUrl: rawPiwikUrl } : undefined;
	const piwikResult = piwikSchema.safeParse(piwikInput);
	const piwik = piwikResult.success ? piwikResult.data : undefined;

	// Derived helpers
	const isLocalhost = client.environment === "localhost";
	const isProduction = client.environment === "prod";
	const hasAnalytics = gtmId !== undefined || oneTrustDomainId !== undefined || piwik !== undefined;
	const analyticsEnabled = !isLocalhost && hasAnalytics;

	return {
		...client,
		gtmId,
		oneTrustDomainId,
		piwik,
		isLocalhost,
		isProduction,
		analyticsEnabled,
	};
}

/** Client-safe app configuration. Validated at import time. */
export const config: AppConfig = Object.freeze(createConfig());
