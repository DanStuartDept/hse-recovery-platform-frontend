import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isContentPage } from "../types/index";

export function ContentPage({ page, renderBlocks }: PageLayoutProps) {
	const sideNav = isContentPage(page) ? page.side_nav : undefined;
	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<Row>
						<Col width="two-thirds">
							<PageTitle title={page.title} />
							{renderBlocks(page.body)}
						</Col>
						{sideNav && sideNav.length > 0 && (
							<Col width="one-third">
								<aside>
									<nav aria-label="Side navigation">
										<ul>
											{sideNav.map((item) => (
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
