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

export type BlockPosition = {
	index: number;
	isFirst: boolean;
	isLast: boolean;
	previous: CMSBlockType | null;
	next: CMSBlockType | null;
};

export type CMSRenderContext = {
	page: CMSPageProps;
	apiClient: CMSClient;
	position: BlockPosition;
};

export type BlockComponentProps<TValue = unknown> = {
	id: string;
	type: CMSBlockComponentsKeys;
	value: TValue;
	settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
	context: CMSRenderContext;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type PageLayoutProps = {
	page: CMSPageProps;
	context: Omit<CMSRenderContext, "position">;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type BlockRegistry = Partial<
	// biome-ignore lint/suspicious/noExplicitAny: registry stores heterogeneous block components with different value types
	Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps<any>>>
>;

export type PageRegistry = Partial<
	Record<CMSPageType, ComponentType<PageLayoutProps>>
>;

export type CMSRendererOptions = {
	apiClient: CMSClient;
	blocks?: BlockRegistry;
	pages?: PageRegistry;
	fallbackBlock?: ComponentType<BlockComponentProps>;
	fallbackPage?: ComponentType<PageLayoutProps>;
};

export type CMSRenderer = {
	renderBlock: (block: CMSBlockType) => React.ReactNode;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
	renderPage: (page: CMSPageProps) => React.ReactNode;
};

export function isContentPage(page: CMSPageProps): page is CMSContentPageProps {
	return page.meta.type === "hsebase.ContentPage";
}
export function isLandingPage(page: CMSPageProps): page is CMSLandingPageProps {
	return page.meta.type === "hsebase.LandingPage";
}
export function isCuratedHubPage(
	page: CMSPageProps,
): page is CMSCuratedHubPageProps {
	return page.meta.type === "hsebase.CuratedHubPage";
}
export function isOrganisationListingPage(
	page: CMSPageProps,
): page is CMSOrganisationListingPageProps {
	return page.meta.type === "hsebase.OrganisationListingPage";
}
export function isOrganisationLandingPage(
	page: CMSPageProps,
): page is CMSOrganisationLandingPageProps {
	return page.meta.type === "hsebase.OrganisationLandingPage";
}
