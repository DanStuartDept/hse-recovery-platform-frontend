"use client";

import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { error as logError } from "@repo/logger";
import { useEffect } from "react";
import "@hseireland/hse-frontend/packages/hse.scss";

export default function GlobalError({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	useEffect(() => {
		logError("[GlobalError]", error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<Container>
					<Row>
						<Col width="two-thirds">
							<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
								Something went wrong
							</h1>
							<p className="hse-body-reg-m">
								There was a problem loading this page. Please try again.
							</p>
							<button
								type="button"
								className="hse-button"
								onClick={() => unstable_retry()}
							>
								Try again
							</button>
						</Col>
					</Row>
				</Container>
			</body>
		</html>
	);
}
