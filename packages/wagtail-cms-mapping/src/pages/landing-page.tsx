import { Container } from "@hseireland/hse-frontend-react";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isLandingPage } from "../types/index";

/**
 * Page layout for `hsebase.LandingPage`.
 *
 * Renders a page title with lead text,
 * optional top content blocks, content blocks, and optional bottom content blocks.
 */
export function LandingPage({ page, renderBlocks }: PageLayoutProps) {
	const lp = isLandingPage(page) ? page : undefined;
	return (
		<Container>
			<PageTitle title={page.title} richLead={lp?.lead_text} />
			{lp?.top_content && renderBlocks(lp.top_content)}
			{lp?.content && renderBlocks(lp.content)}
			{lp?.bottom_content && renderBlocks(lp.bottom_content)}
		</Container>
	);
}
