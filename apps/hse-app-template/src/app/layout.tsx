import type { Metadata } from "next";

import "@hseireland/hse-frontend/packages/hse.scss";

export const metadata: Metadata = {
	title: "HSE Multisite Frontend template",
	description: "HSE Multisite Frontend template",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
