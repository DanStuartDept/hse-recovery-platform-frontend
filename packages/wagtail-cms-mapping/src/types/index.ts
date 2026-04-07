import type { CMSClient } from "@repo/wagtail-api-client";
import type {
	CMSBlockComponentsKeys,
	CMSBlockType,
} from "@repo/wagtail-cms-types/blocks";
import type { CMSPageType } from "@repo/wagtail-cms-types/core";
import type {
	CMSContentPageProps,
	CMSCuratedHubPageProps,
	CMSLandingPageProps,
	CMSOrganisationLandingPageProps,
	CMSOrganisationListingPageProps,
	CMSPageProps,
} from "@repo/wagtail-cms-types/page-models";
import type { ComponentType } from "react";

/**
 * Positional metadata for a block within a block array.
 * Computed automatically by the factory's `renderBlocks` loop.
 */
export type BlockPosition = {
	/** Zero-based index of this block in the array. */
	index: number;
	/** Whether this is the first block in the array. */
	isFirst: boolean;
	/** Whether this is the last block in the array. */
	isLast: boolean;
	/** The previous block in the array, or `null` if this is the first. */
	previous: CMSBlockType | null;
	/** The next block in the array, or `null` if this is the last. */
	next: CMSBlockType | null;
};

/**
 * Context object threaded to every block and page component by the factory.
 * Provides access to the current page, the CMS API client, and block position metadata.
 */
export type CMSRenderContext = {
	/** The full Wagtail page being rendered. */
	page: CMSPageProps;
	/** The CMS API client instance for secondary data fetching. */
	apiClient: CMSClient;
	/** Positional metadata for this block within its parent array. */
	position: BlockPosition;
};

/**
 * Props received by every block component.
 *
 * @typeParam TValue - The shape of the block's `value` field. Defaults to `unknown`.
 */
export type BlockComponentProps<TValue = unknown> = {
	/** Unique block identifier from the CMS. */
	id: string;
	/** The CMS block type key (e.g., `"text"`, `"quote"`, `"image"`). */
	type: CMSBlockComponentsKeys;
	/** The block's content payload. Shape varies by block type. */
	value: TValue;
	/** Optional display settings controlling layout behaviour. */
	settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
	/** Render context with page data, API client, and position metadata. */
	context: CMSRenderContext;
	/** Renders an array of child blocks. Used for recursive/nested block rendering. */
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

/**
 * Props received by every page layout component.
 * Context omits `position` since page layouts are not part of a block array.
 */
export type PageLayoutProps = {
	/** The full Wagtail page data. */
	page: CMSPageProps;
	/** Render context with page data and API client (no position). */
	context: Omit<CMSRenderContext, "position">;
	/** Renders an array of blocks using the factory's configured registries. */
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

/** Maps block type keys to their React components. Partial — unmapped types use the fallback. */
export type BlockRegistry = Partial<
	// biome-ignore lint/suspicious/noExplicitAny: registry stores heterogeneous block components with different value types
	Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps<any>>>
>;

/** Maps page type keys to their layout components. Partial — unmapped types use the fallback. */
export type PageRegistry = Partial<
	Record<CMSPageType, ComponentType<PageLayoutProps>>
>;

/**
 * Configuration options for {@link createCMSRenderer}.
 */
export type CMSRendererOptions = {
	/** CMS API client instance. Required — used by components for secondary data fetching. */
	apiClient: CMSClient;
	/** Block component overrides merged on top of the default registry. */
	blocks?: BlockRegistry;
	/** Page layout overrides merged on top of the default registry. */
	pages?: PageRegistry;
	/** Fallback component rendered for unmapped block types. */
	fallbackBlock?: ComponentType<BlockComponentProps>;
	/** Fallback component rendered for unmapped page types. */
	fallbackPage?: ComponentType<PageLayoutProps>;
};

/** The object returned by {@link createCMSRenderer}. */
export type CMSRenderer = {
	/** Renders a single block. Must call `renderPage` first to set the page context. */
	renderBlock: (block: CMSBlockType) => React.ReactNode;
	/** Renders an array of blocks with position metadata. */
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
	/** Renders a full page using the appropriate layout component. Entry point for rendering. */
	renderPage: (page: CMSPageProps) => React.ReactNode;
};

/** Narrows a {@link CMSPageProps} to {@link CMSContentPageProps}. */
export function isContentPage(page: CMSPageProps): page is CMSContentPageProps {
	return page.meta.type === "hsebase.ContentPage";
}
/** Narrows a {@link CMSPageProps} to {@link CMSLandingPageProps}. */
export function isLandingPage(page: CMSPageProps): page is CMSLandingPageProps {
	return page.meta.type === "hsebase.LandingPage";
}
/** Narrows a {@link CMSPageProps} to {@link CMSCuratedHubPageProps}. */
export function isCuratedHubPage(
	page: CMSPageProps,
): page is CMSCuratedHubPageProps {
	return page.meta.type === "hsebase.CuratedHubPage";
}
/** Narrows a {@link CMSPageProps} to {@link CMSOrganisationListingPageProps}. */
export function isOrganisationListingPage(
	page: CMSPageProps,
): page is CMSOrganisationListingPageProps {
	return page.meta.type === "hsebase.OrganisationListingPage";
}
/** Narrows a {@link CMSPageProps} to {@link CMSOrganisationLandingPageProps}. */
export function isOrganisationLandingPage(
	page: CMSPageProps,
): page is CMSOrganisationLandingPageProps {
	return page.meta.type === "hsebase.OrganisationLandingPage";
}
