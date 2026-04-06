import type { ComponentType } from "react";
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

export type BlockComponentProps<TValue = unknown> = {
	id: string;
	type: CMSBlockComponentsKeys;
	value: TValue;
	settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
	renderBlocks?: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type PageLayoutProps = {
	page: CMSPageProps;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type BlockRegistry = Partial<
	Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps<any>>>
>;

export type PageRegistry = Partial<Record<CMSPageType, ComponentType<PageLayoutProps>>>;

export type CMSRendererOptions = {
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
export function isCuratedHubPage(page: CMSPageProps): page is CMSCuratedHubPageProps {
	return page.meta.type === "hsebase.CuratedHubPage";
}
export function isOrganisationListingPage(page: CMSPageProps): page is CMSOrganisationListingPageProps {
	return page.meta.type === "hsebase.OrganisationListingPage";
}
export function isOrganisationLandingPage(page: CMSPageProps): page is CMSOrganisationLandingPageProps {
	return page.meta.type === "hsebase.OrganisationLandingPage";
}
