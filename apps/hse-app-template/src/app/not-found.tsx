import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Page not found",
};

export default function NotFound() {
	return (
		<Container>
			<Row>
				<Col width="two-thirds">
					<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
						Page not found
					</h1>
					<p className="hse-body-reg-m">
						We cannot find the page you are looking for.
					</p>
					<p className="hse-body-reg-m">
						The link may be broken, or the page may have been moved or deleted.
					</p>
					<p className="hse-body-reg-m">
						Check the URL you entered is correct.
					</p>
				</Col>
			</Row>
			<Row>
				<Col width="two-thirds">
					<h2 className="hse-u-text-color_hse-grey-900 hse-u-margin-top-4">
						If you still cannot find what you&apos;re looking for
					</h2>
					<p className="hse-body-reg-m">
						The information may be in a popular section, for example:
					</p>
					<ul>
						<li>
							<a href="https://www2.hse.ie/conditions/">
								health conditions and symptoms
							</a>
						</li>
						<li>
							<a href="https://healthservice.hse.ie/staff/">
								HSE staff news and information
							</a>
						</li>
						<li>
							<a href="https://about.hse.ie/jobs/job-search/">HSE job search</a>
						</li>
						<li>
							<a href="https://about.hse.ie/">
								information and news about the HSE
							</a>
						</li>
					</ul>
					<p className="hse-body-reg-m">
						<a href="https://www2.hse.ie/contact/">Contact us</a> if you have a
						question or want to give feedback.
					</p>
				</Col>
			</Row>
		</Container>
	);
}
