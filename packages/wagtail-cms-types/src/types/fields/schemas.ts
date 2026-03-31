import { z } from "zod";

/**
 * HTML heading level schema for semantic heading hierarchy.
 * Used to ensure proper document structure and accessibility.
 */
export const FieldTypeHeadingLevelSchema = z.union([
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
	z.literal(5),
	z.literal(6),
]);

export type FieldTypeHeadingLevel = z.infer<typeof FieldTypeHeadingLevelSchema>;

/**
 * Call-to-action field schema for buttons and links throughout the CMS.
 * Provides consistent structure for actionable elements.
 */
export const FieldTypeCtaSchema = z.object({
	/** The display text for the call-to-action button or link */
	title: z.string(),
	/** The URL or path the call-to-action points to */
	url: z.string(),
});

export type FieldTypeCta = z.infer<typeof FieldTypeCtaSchema>;

/**
 * Base image object schema containing essential image properties.
 * Used as a foundation for responsive image variants and thumbnails.
 */
export const FieldTypeImageObjectSchema = z.object({
	/** The source URL for the image file */
	src: z.string(),
	/** Alternative text for accessibility and SEO */
	alt: z.string(),
	/** Original uploaded image width in pixels */
	width: z.number(),
	/** Original uploaded image height in pixels */
	height: z.number(),
});

export type FieldTypeImageObject = z.infer<typeof FieldTypeImageObjectSchema>;

/**
 * Complete image field schema with responsive variants and thumbnails.
 * Provides multiple image sizes optimized for different screen sizes and use cases.
 * Extends the base image object with CMS-generated variants.
 */
export const FieldTypeImageSchema = FieldTypeImageObjectSchema.extend({
	/** Unique identifier for the image in the CMS */
	id: z.number(),
	/** Responsive variant optimized for small screens (max width: 640px) */
	max_screen_sm: FieldTypeImageObjectSchema,
	/** Responsive variant optimized for medium screens (max width: 768px) */
	max_screen_md: FieldTypeImageObjectSchema,
	/** Responsive variant optimized for large screens (max width: 1024px) */
	max_screen_lg: FieldTypeImageObjectSchema,
	/** Responsive variant optimized for extra large screens (max width: 1280px) */
	max_screen_xl: FieldTypeImageObjectSchema,
	/** Responsive variant optimized for 2XL screens (max width: 1536px) */
	max_screen_2xl: FieldTypeImageObjectSchema,
	/** Responsive variant optimized for full HD displays (max width: 1920px) */
	max_screen_1920: FieldTypeImageObjectSchema,
	/** Small square thumbnail for avatars and icons (120px x 120px) */
	thumbnail_120: FieldTypeImageObjectSchema,
	/** Large square thumbnail for cards and previews (400px x 400px) */
	thumbnail_400: FieldTypeImageObjectSchema,
});

export type FieldTypeImage = z.infer<typeof FieldTypeImageSchema>;

/**
 * Video field schema for embedded or linked video content.
 * Supports external video platforms and direct video file links.
 */
export const FieldTypeVideoSchema = z.object({
	/** The URL to the video file or embedded video player */
	url: z.string(),
	/** Optional title or caption for the video content */
	title: z.string().optional(),
});

export type FieldTypeVideo = z.infer<typeof FieldTypeVideoSchema>;
