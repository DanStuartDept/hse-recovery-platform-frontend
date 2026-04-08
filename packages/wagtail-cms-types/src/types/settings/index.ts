import { z } from "zod";

/**
 * Navigation link schema for header primary navigation items.
 * Used in the `navigation_links` array of the header API response.
 * Contains a `page` field that references a Wagtail page ID (null for external links).
 */
export const CMSHeaderNavLinkSchema = z.object({
	/** Unique identifier for this navigation link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the navigation list. */
	sort_order: z.number(),
	/** Display text for the navigation link. */
	label: z.string(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
	/** Wagtail page ID if this link references an internal page, null for external links. */
	page: z.number().nullable(),
});

export type CMSHeaderNavLink = z.infer<typeof CMSHeaderNavLinkSchema>;

/**
 * Navigation link schema for header secondary and mobile navigation items.
 * Used in `navigation_secondary_links` and `header_mobile_links` arrays.
 * Same shape as {@link CMSHeaderNavLinkSchema} but without the `page` field.
 */
export const CMSHeaderSecondaryNavLinkSchema = z.object({
	/** Unique identifier for this navigation link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the navigation list. */
	sort_order: z.number(),
	/** Display text for the navigation link. */
	label: z.string(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
});

export type CMSHeaderSecondaryNavLink = z.infer<
	typeof CMSHeaderSecondaryNavLinkSchema
>;

/**
 * Link schema for footer navigation items.
 * Used in `footer_links` and `footer_secondary_links` arrays.
 * Uses `link_label` (not `label`) for the display text.
 */
export const CMSFooterLinkSchema = z.object({
	/** Unique identifier for this footer link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the footer link list. */
	sort_order: z.number(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Display text for the footer link. */
	link_label: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
});

export type CMSFooterLink = z.infer<typeof CMSFooterLinkSchema>;

/**
 * Complete header configuration returned by the CMS `/api/headers/` endpoint.
 * Contains primary navigation, secondary links, mobile-specific links, and header settings.
 */
export const CMSHeaderResponseSchema = z.object({
	/** Unique identifier for this header configuration. */
	id: z.number(),
	/** Internal name for the header snippet in the CMS. */
	name: z.string(),
	/** Service name displayed alongside the logo (empty string if not set). */
	service_name: z.string(),
	/** Whether to display the service name in long format. */
	service_long_name: z.boolean(),
	/** Whether this is a transactional header (minimal navigation). */
	transactional: z.boolean(),
	/** Custom ARIA label for the logo, overriding the default. */
	logo_aria: z.string().nullable(),
	/** Whether to display the search bar in the header. */
	show_search: z.boolean(),
	/** Placeholder text for the search input field. */
	search_prompt_text: z.string(),
	/** Descriptive text for the navigation (used for ARIA). */
	navigation_text: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Custom URL for the logo link (null uses default homepage). */
	logo_link: z.string().nullable(),
	/** Primary navigation links displayed in the main menu. */
	navigation_links: z.array(CMSHeaderNavLinkSchema),
	/** Secondary navigation links displayed in the utility menu. */
	navigation_secondary_links: z.array(CMSHeaderSecondaryNavLinkSchema),
	/** Navigation links shown on mobile devices. */
	header_mobile_links: z.array(CMSHeaderSecondaryNavLinkSchema),
});

export type CMSHeaderResponse = z.infer<typeof CMSHeaderResponseSchema>;

/**
 * Complete footer configuration returned by the CMS `/api/footers/` endpoint.
 * Contains primary footer links and secondary (legal/policy) links.
 */
export const CMSFooterResponseSchema = z.object({
	/** Unique identifier for this footer configuration. */
	id: z.number(),
	/** Internal name for the footer snippet in the CMS. */
	name: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Primary footer links (e.g., complaints, emergencies). */
	footer_links: z.array(CMSFooterLinkSchema),
	/** Secondary footer links (e.g., privacy, cookies, accessibility). */
	footer_secondary_links: z.array(CMSFooterLinkSchema),
});

export type CMSFooterResponse = z.infer<typeof CMSFooterResponseSchema>;

/**
 * Raw API response schema for the `/api/headers/` endpoint.
 * Returns an array of header configurations (typically one item).
 */
export const CMSHeaderAPIResponseSchema = z.array(CMSHeaderResponseSchema);

export type CMSHeaderAPIResponse = z.infer<typeof CMSHeaderAPIResponseSchema>;

/**
 * Raw API response schema for the `/api/footers/` endpoint.
 * Returns an array of footer configurations (typically one item).
 */
export const CMSFooterAPIResponseSchema = z.array(CMSFooterResponseSchema);

export type CMSFooterAPIResponse = z.infer<typeof CMSFooterAPIResponseSchema>;
