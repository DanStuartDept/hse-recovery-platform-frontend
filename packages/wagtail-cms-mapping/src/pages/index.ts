import type { PageRegistry } from "../types/index";
import { ContentPage } from "./content-page";
import { CuratedHubPage } from "./curated-hub-page";
import { LandingPage } from "./landing-page";
import { OrganisationLandingPage } from "./organisation-landing-page";
import { OrganisationListingPage } from "./organisation-listing-page";

export const defaultPageRegistry: PageRegistry = {
	"hsebase.ContentPage": ContentPage,
	"hsebase.LandingPage": LandingPage,
	"hsebase.CuratedHubPage": CuratedHubPage,
	"hsebase.OrganisationListingPage": OrganisationListingPage,
	"hsebase.OrganisationLandingPage": OrganisationLandingPage,
};

export { ContentPage, CuratedHubPage, LandingPage, OrganisationLandingPage, OrganisationListingPage };
