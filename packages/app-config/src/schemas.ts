import { z } from "zod";

/** Schema for required client-side environment variables. */
export const clientSchema = z.object({
	cms: z.object({
		baseURL: z.string().min(1),
		apiPath: z.string().min(1),
	}),
	environment: z.enum(["localhost", "dev", "pre-prod", "prod"]),
	siteUrl: z.string().url(),
});

/** Schema for optional GTM ID. */
export const gtmSchema = z.string().min(1).optional();

/** Schema for optional OneTrust domain ID. */
export const oneTrustSchema = z.string().min(1).optional();

/** Schema for optional Piwik Pro settings — both fields required if either is set. */
export const piwikSchema = z
	.object({
		containerId: z.string().min(1),
		containerUrl: z.string().url(),
	})
	.optional();

/** Schema for optional comma-separated remote image domains (e.g., `"assets.hse.ie,cdn.example.com"`). */
export const remoteImageDomainsSchema = z
	.string()
	.min(1)
	.transform((val) => val.split(",").map((d) => d.trim()))
	.optional();

/** Schema for required server-only secrets. */
export const serverSchema = z.object({
	previewToken: z.string().min(1),
	revalidateToken: z.string().min(1),
});
