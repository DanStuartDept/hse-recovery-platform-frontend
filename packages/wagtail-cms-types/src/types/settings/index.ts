import { z } from "zod";
import {
	FieldTypeCtaSchema,
	FieldTypeImageSchema,
	NavItemSchema,
} from "../fields";

/**
 * Basic navigation item schema.
 */
export const CMSSiteSettingsNavItemSchema = NavItemSchema;

export type CMSSiteSettingsNavItem = z.infer<
	typeof CMSSiteSettingsNavItemSchema
>;

/**
 * Header banner configuration schema.
 */
export const CMSSiteSettingsHeaderBannerSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	image: FieldTypeImageSchema,
	cta: FieldTypeCtaSchema,
});

export type CMSSiteSettingsHeaderBanner = z.infer<
	typeof CMSSiteSettingsHeaderBannerSchema
>;

/**
 * Enhanced navigation item schema for main header.
 */
export const CMSSiteSettingsHeaderItemSchema = z.object({
	title: z.string(),
	url: z.string(),
	description: z.string().optional(),
	banner: CMSSiteSettingsHeaderBannerSchema.optional(),
	links: z.array(CMSSiteSettingsNavItemSchema),
});

export type CMSSiteSettingsHeaderItem = z.infer<
	typeof CMSSiteSettingsHeaderItemSchema
>;

/**
 * Site header configuration schema.
 */
export const CMSSiteSettingsHeaderSchema = z.object({
	global_navigation_links: z.array(CMSSiteSettingsNavItemSchema),
	navigation_links: z.array(CMSSiteSettingsHeaderItemSchema),
	popular_search_terms: z.array(z.string()),
});

export type CMSSiteSettingsHeader = z.infer<typeof CMSSiteSettingsHeaderSchema>;

/**
 * Footer navigation column schema.
 */
export const CMSSiteSettingsFooterNavItemSchema = z.object({
	title: z.string(),
	links: z.array(CMSSiteSettingsNavItemSchema),
});

export type CMSSiteSettingsFooterNavItem = z.infer<
	typeof CMSSiteSettingsFooterNavItemSchema
>;

/**
 * Site footer configuration schema.
 */
export const CMSSiteSettingsFooterSchema = z.object({
	footer_navigation_columns: z.array(CMSSiteSettingsFooterNavItemSchema),
});

export type CMSSiteSettingsFooter = z.infer<typeof CMSSiteSettingsFooterSchema>;

/**
 * Social media link configuration schema.
 */
export const CMSSiteSettingsSocialLinkItemSchema = z.object({
	service_name: z.string(),
	service_url: z.string(),
	service_label: z.string(),
});

export type CMSSiteSettingsSocialLinkItem = z.infer<
	typeof CMSSiteSettingsSocialLinkItemSchema
>;

/**
 * Complete site settings configuration schema.
 */
export const CMSSiteSettingsItemSchema = z.object({
	id: z.number().optional(),
	header: CMSSiteSettingsHeaderSchema.optional(),
	footer: CMSSiteSettingsFooterSchema.optional(),
	social_links: z.array(CMSSiteSettingsSocialLinkItemSchema),
	default_twitter: z
		.object({
			handle: z.string(),
			title: z.string(),
			description: z.string(),
			image: FieldTypeImageSchema.optional(),
		})
		.optional(),
	default_og: z
		.object({
			title: z.string(),
			description: z.string(),
			type: z.string(),
			image: FieldTypeImageSchema.optional(),
		})
		.optional(),
	global_alert: z
		.object({
			enabled: z.boolean(),
			variant: z.enum(["info", "warning", "danger", "success"]),
			title: z.string(),
			image: FieldTypeImageSchema,
			url: z.string(),
			url_target: z.string(),
		})
		.optional(),
	search: z
		.object({
			enabled: z.boolean(),
			results_page: z.string(),
		})
		.optional(),
	error_404_page: z.string().optional(),
	robots: z.string().optional(),
	maintenance_mode: z
		.object({
			enabled: z.boolean(),
			content: z.string(),
		})
		.optional(),
	default_featured_news_image: FieldTypeImageSchema.optional(),
	site: z.number().optional(),
});

export type CMSSiteSettingsItem = z.infer<typeof CMSSiteSettingsItemSchema>;

/**
 * API response schema for site settings endpoints.
 */
export const CMSSiteSettingsAPIResponseSchema = z.array(
	CMSSiteSettingsItemSchema,
);

export type CMSSiteSettingsAPIResponse = z.infer<
	typeof CMSSiteSettingsAPIResponseSchema
>;
