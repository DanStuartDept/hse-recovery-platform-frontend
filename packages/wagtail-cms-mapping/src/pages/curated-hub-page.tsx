import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isCuratedHubPage } from "../types/index";

export function CuratedHubPage({ page, renderBlocks }: PageLayoutProps) {
	const chp = isCuratedHubPage(page) ? page : undefined;
	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<Row>
						<Col width="two-thirds">
							<PageTitle title={page.title} richLead={chp?.lead_text} />
							{renderBlocks(page.body)}
							{chp?.bottom_content && renderBlocks(chp.bottom_content)}
						</Col>
					</Row>
				</Container>
			</main>
		</>
	);
}
