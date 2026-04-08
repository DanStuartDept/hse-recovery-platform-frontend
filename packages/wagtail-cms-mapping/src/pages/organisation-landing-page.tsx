import { Container } from "@hseireland/hse-frontend-react";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationLandingPage } from "../types/index";

/**
 * Page layout for `hsebase.OrganisationLandingPage`.
 *
 * Renders page title with lead text,
 * content blocks, and optional bottom content.
 */
export function OrganisationLandingPage({
	page,
	renderBlocks,
}: PageLayoutProps) {
	const olp = isOrganisationLandingPage(page) ? page : undefined;
	return (
		<Container>
			<PageTitle title={page.title} richLead={olp?.lead_text} />
			{olp?.content && renderBlocks(olp.content)}
			{olp?.bottom_content && renderBlocks(olp.bottom_content)}
		</Container>
	);
}
