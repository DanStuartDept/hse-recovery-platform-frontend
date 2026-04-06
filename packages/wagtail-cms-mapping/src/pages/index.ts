import type { PageRegistry } from "../types/index";
import { ContentPage } from "./content-page";
import { LandingPage } from "./landing-page";
import { CuratedHubPage } from "./curated-hub-page";
import { OrganisationListingPage } from "./organisation-listing-page";
import { OrganisationLandingPage } from "./organisation-landing-page";

export const defaultPageRegistry: PageRegistry = {
	"hsebase.ContentPage": ContentPage,
	"hsebase.LandingPage": LandingPage,
	"hsebase.CuratedHubPage": CuratedHubPage,
	"hsebase.OrganisationListingPage": OrganisationListingPage,
	"hsebase.OrganisationLandingPage": OrganisationLandingPage,
};

export { ContentPage, LandingPage, CuratedHubPage, OrganisationListingPage, OrganisationLandingPage };
