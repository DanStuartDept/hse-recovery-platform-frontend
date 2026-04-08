"use client";

import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { useDictionary } from "@repo/i18n";
import { error as logError } from "@repo/logger";
import { useEffect } from "react";
import type { Dictionary } from "@/lib/i18n/dictionary";

export default function ErrorPage({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	const dict = useDictionary<Dictionary>();

	useEffect(() => {
		logError("[ErrorPage]", error);
	}, [error]);

	return (
		<Container>
			<Row>
				<Col width="two-thirds">
					<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
						{dict.error.heading}
					</h1>
					<p className="hse-body-reg-m">{dict.error.body}</p>
					<button
						type="button"
						className="hse-button"
						onClick={() => unstable_retry()}
					>
						{dict.error.tryAgain}
					</button>
				</Col>
			</Row>
		</Container>
	);
}
