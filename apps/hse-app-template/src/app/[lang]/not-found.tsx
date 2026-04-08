"use client";

import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { rich, useDictionary } from "@repo/i18n";
import type { Dictionary } from "@/lib/i18n/dictionary";

export default function NotFound() {
	const dict = useDictionary<Dictionary>();

	return (
		<Container>
			<Row>
				<Col width="two-thirds">
					<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
						{dict.notFound.heading}
					</h1>
					<p className="hse-body-reg-m">{dict.notFound.body}</p>
					<p className="hse-body-reg-m">{dict.notFound.linkBroken}</p>
					<p className="hse-body-reg-m">{dict.notFound.checkUrl}</p>
				</Col>
			</Row>
			<Row>
				<Col width="two-thirds">
					<h2 className="hse-u-text-color_hse-grey-900 hse-u-margin-top-4">
						{dict.notFound.cantFindHeading}
					</h2>
					<p className="hse-body-reg-m">{dict.notFound.popularInfo}</p>
					<ul>
						<li>
							<a href="https://www2.hse.ie/conditions/">
								{dict.notFound.link.conditions}
							</a>
						</li>
						<li>
							<a href="https://healthservice.hse.ie/staff/">
								{dict.notFound.link.staff}
							</a>
						</li>
						<li>
							<a href="https://about.hse.ie/jobs/job-search/">
								{dict.notFound.link.jobs}
							</a>
						</li>
						<li>
							<a href="https://about.hse.ie/">{dict.notFound.link.about}</a>
						</li>
					</ul>
					<p className="hse-body-reg-m">
						{rich(dict.notFound.contact as string, {
							contactLink: (text) => (
								<a href="https://www2.hse.ie/contact/">{text}</a>
							),
						})}
					</p>
				</Col>
			</Row>
		</Container>
	);
}
