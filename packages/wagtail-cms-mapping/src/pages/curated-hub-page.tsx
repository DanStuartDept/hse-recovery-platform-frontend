import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isCuratedHubPage } from "../types/index";

/**
 * Page layout for `hsebase.CuratedHubPage`.
 *
 * Renders in a two-thirds column width with
 * page title, content blocks, and optional bottom content.
 */
export function CuratedHubPage({ page, renderBlocks }: PageLayoutProps) {
	const chp = isCuratedHubPage(page) ? page : undefined;
	return (
		<Container>
			<Row>
				<Col width="two-thirds">
					<PageTitle title={page.title} richLead={chp?.lead_text} />
					{chp?.content && renderBlocks(chp.content)}
					{chp?.bottom_content && renderBlocks(chp.bottom_content)}
				</Col>
			</Row>
		</Container>
	);
}
