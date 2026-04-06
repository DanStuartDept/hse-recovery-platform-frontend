import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationListingPage } from "../types/index";

export function OrganisationListingPage({
	page,
	renderBlocks,
}: PageLayoutProps) {
	const olp = isOrganisationListingPage(page) ? page : undefined;
	const totalItems = olp?.organisation_links_count ?? 0;
	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<PageTitle title={page.title} richLead={olp?.lead_text} />
					<div>
						<h2 className="hse-u-margin-bottom-7 hse-heading-m">
							Showing {totalItems} results out of {totalItems}
						</h2>
						{olp?.organisation_links && renderBlocks(olp.organisation_links)}
					</div>
				</Container>
			</main>
		</>
	);
}
