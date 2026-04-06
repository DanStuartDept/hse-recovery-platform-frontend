import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationLandingPage } from "../types/index";

export function OrganisationLandingPage({ page, renderBlocks }: PageLayoutProps) {
	const olp = isOrganisationLandingPage(page) ? page : undefined;
	return (
		<>
			{page.breadcrumb && page.breadcrumb.length > 0 && <Breadcrumb items={page.breadcrumb} />}
			<main>
				<Container>
					<PageTitle title={page.title} richLead={olp?.lead_text} />
					{renderBlocks(page.body)}
					{olp?.bottom_content && renderBlocks(olp.bottom_content)}
				</Container>
			</main>
		</>
	);
}
