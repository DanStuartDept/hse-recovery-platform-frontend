import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isContentPage } from "../types/index";

/**
 * Page layout for `hsebase.ContentPage`.
 *
 * Renders breadcrumbs, a page title with optional lead text,
 * the main body blocks, and any bottom content blocks.
 */
export function ContentPage({ page, renderBlocks }: PageLayoutProps) {
	const cp = isContentPage(page) ? page : undefined;
	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<Row>
						<Col width="two-thirds">
							<PageTitle title={page.title} />
							{cp?.body && renderBlocks(cp.body)}
						</Col>
						{cp?.side_nav && cp.side_nav.length > 0 && (
							<Col width="one-third">
								<aside>
									<nav aria-label="Side navigation">
										<ul>
											{cp.side_nav.map((item) => (
												<li key={item.url}>
													<a href={item.url}>{item.title}</a>
												</li>
											))}
										</ul>
									</nav>
								</aside>
							</Col>
						)}
					</Row>
				</Container>
			</main>
		</>
	);
}
