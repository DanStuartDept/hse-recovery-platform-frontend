import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationLandingPage } from "../types/index";

/**
 * Page layout for `hsebase.OrganisationLandingPage`.
 *
 * Renders breadcrumbs, page title with lead text,
 * body blocks, and optional bottom content.
 */
export function OrganisationLandingPage({
	page,
	renderBlocks,
}: PageLayoutProps) {
	const olp = isOrganisationLandingPage(page) ? page : undefined;
	return (
		<>
			{page.breadcrumb && page.breadcrumb.length > 0 && (
				<Breadcrumb items={page.breadcrumb} />
			)}
			<main>
				<Container>
					<PageTitle title={page.title} richLead={olp?.lead_text} />
					{olp?.content && renderBlocks(olp.content)}
					{olp?.bottom_content && renderBlocks(olp.bottom_content)}
				</Container>
			</main>
		</>
	);
}
