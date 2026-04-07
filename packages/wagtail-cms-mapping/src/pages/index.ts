import type { PageRegistry } from "../types/index";
import { ContentPage } from "./content-page";
import { CuratedHubPage } from "./curated-hub-page";
import { LandingPage } from "./landing-page";
import { OrganisationLandingPage } from "./organisation-landing-page";
import { OrganisationListingPage } from "./organisation-listing-page";

/**
 * Default page registry mapping Wagtail page type keys to layout components.
 *
 * Keys use the `app_label.ModelName` format (e.g., `"hsebase.ContentPage"`).
 */
export const defaultPageRegistry: PageRegistry = {
	"hsebase.ContentPage": ContentPage,
	"hsebase.LandingPage": LandingPage,
	"hsebase.CuratedHubPage": CuratedHubPage,
	"hsebase.OrganisationListingPage": OrganisationListingPage,
	"hsebase.OrganisationLandingPage": OrganisationLandingPage,
};

export {
	ContentPage,
	CuratedHubPage,
	LandingPage,
	OrganisationLandingPage,
	OrganisationListingPage,
};
