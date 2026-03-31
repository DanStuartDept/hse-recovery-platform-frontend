import { z } from "zod";

/**
 * Union type schema of all available page types in the CMS.
 */
export const CMSPageTypeSchema = z.enum([
	"appbase.HomePage",
	"appbase.LandingPage",
	"appbase.ContentPage",
	"appbase.SearchPage",
	"news.NewsListingPage",
	"news.NewsContentPage",
]);

export type CMSPageType = z.infer<typeof CMSPageTypeSchema>;

/**
 * Configuration options schema for the CMS API client.
 */
export const ClientOptionsSchema = z.object({
	baseURL: z.string(),
	mediaBaseURL: z.string().optional(),
	apiPath: z.string(),
	init: z.custom<RequestInit>().optional(),
});

export type ClientOptions = z.infer<typeof ClientOptionsSchema>;

/**
 * Query parameters schema for CMS API requests.
 */
export const CMSQueriesSchema = z
	.object({
		type: z.string().optional(),
		offset: z.number().optional(),
		limit: z.number().optional(),
		order: z.string().optional(),
		slug: z.string().optional(),
		child_of: z.number().optional(),
		ancestor_of: z.number().optional(),
		descendant_of: z.number().optional(),
		site: z.string().optional(),
		search: z.string().optional(),
		search_operator: z.string().optional(),
		locale: z.string().optional(),
		translation_of: z.number().optional(),
		fields: z.array(z.string()).optional(),
		show_in_menus: z.boolean().optional(),
	})
	.passthrough();

export type CMSQueries = z.infer<typeof CMSQueriesSchema>;

/**
 * Union type of valid CMS API endpoint paths.
 */
export type CMSContentPath =
	| "pages"
	| `pages/${number}`
	| "images"
	| `images/${number}`
	| "documents"
	| `documents/${number}`;

/**
 * Breadcrumb navigation item schema.
 */
export const CMSPageBreadcrumbSchema = z.object({
	id: z.number(),
	title: z.string(),
	slug: z.string(),
	url: z.string(),
});

export type CMSPageBreadcrumb = z.infer<typeof CMSPageBreadcrumbSchema>;

export type CMSParentPageContent = {
	id: number;
	title: string;
	meta: CMSPageMeta;
};

/**
 * Parent page content reference schema (lazy for circular reference).
 */
export const CMSParentPageContentSchema: z.ZodType<CMSParentPageContent> =
	z.lazy(() =>
		z.object({
			id: z.number(),
			title: z.string(),
			meta: CMSPageMetaSchema,
		}),
	);

/**
 * Page metadata schema.
 */
export const CMSPageMetaSchema = z.object({
	slug: z.string(),
	type: CMSPageTypeSchema,
	locale: z.string(),
	html_url: z.string(),
	detail_url: z.string(),
	seo_title: z.string().optional(),
	first_published_at: z.string(),
	last_published_at: z.string(),
	search_description: z.string(),
	parent: CMSParentPageContentSchema.nullable(),
});

export type CMSPageMeta = z.infer<typeof CMSPageMetaSchema>;

/**
 * Media metadata schema.
 */
export const CMSMediaMetaSchema = z.object({
	type: z.string(),
	detail_url: z.string(),
	tags: z.array(z.string()).optional(),
	download_url: z.string(),
});

export type CMSMediaMeta = z.infer<typeof CMSMediaMetaSchema>;

/**
 * Base content schema.
 */
export const CMSContentSchema = z.object({
	id: z.number(),
	title: z.string(),
	meta: z.union([CMSPageMetaSchema, CMSMediaMetaSchema]),
});

export type CMSContent = z.infer<typeof CMSContentSchema>;

/**
 * Complete page content schema.
 */
export const CMSPageContentSchema = z.object({
	id: z.number(),
	title: z.string(),
	meta: CMSPageMetaSchema,
	breadcrumb: z.array(CMSPageBreadcrumbSchema).optional(),
});

export type CMSPageContent = z.infer<typeof CMSPageContentSchema>;

/**
 * Media content schema.
 */
export const CMSMediaContentSchema = z.object({
	id: z.number(),
	title: z.string(),
	meta: CMSMediaMetaSchema,
});

export type CMSMediaContent<T = CMSMediaMeta> = {
	id: number;
	title: string;
	meta: T;
};

/**
 * Paginated collection response schema.
 */
export const CMSContentsSchema = z.object({
	meta: z.object({
		total_count: z.number(),
	}),
	items: z.array(CMSContentSchema),
});

export type CMSContents<T = CMSContent> = {
	meta: {
		total_count: number;
	};
	items: T[];
};

/**
 * Paginated page collection schema.
 */
export const CMSPageContentsSchema = z.object({
	meta: z.object({
		total_count: z.number(),
	}),
	items: z.array(CMSPageContentSchema),
});

export type CMSPageContents<T = CMSPageContent> = {
	meta: {
		total_count: number;
	};
	items: T[];
};

/**
 * Paginated media collection schema.
 */
export const CMSMediaContentsSchema = z.object({
	meta: z.object({
		total_count: z.number(),
	}),
	items: z.array(CMSMediaContentSchema),
});

export type CMSMediaContents<T = CMSMediaContent> = {
	meta: {
		total_count: number;
	};
	items: T[];
};

/**
 * Error response schema for not found scenarios.
 */
export const NotFoundContentsSchema = z.object({
	message: z.string(),
	data: z.unknown(),
});

export type NotFoundContents = z.infer<typeof NotFoundContentsSchema>;
