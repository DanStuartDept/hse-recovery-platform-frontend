import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isLandingPage } from "../types/index";

/**
 * Page layout for `hsebase.LandingPage`.
 *
 * Renders breadcrumbs, a page title with lead text,
 * optional top content blocks, body blocks, and optional bottom content blocks.
 */
export function LandingPage({ page, renderBlocks }: PageLayoutProps) {
	const lp = isLandingPage(page) ? page : undefined;
	return (
		<>
			{page.breadcrumb && page.breadcrumb.length > 0 && (
				<Breadcrumb items={page.breadcrumb} />
			)}
			<main>
				<Container>
					<PageTitle title={page.title} richLead={lp?.lead_text} />
					{lp?.top_content && renderBlocks(lp.top_content)}
					{renderBlocks(page.body)}
					{lp?.bottom_content && renderBlocks(lp.bottom_content)}
				</Container>
			</main>
		</>
	);
}
