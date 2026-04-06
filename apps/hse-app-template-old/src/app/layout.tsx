import type { Metadata } from "next";

import "@hseireland/hse-frontend/packages/hse.scss";

export const metadata: Metadata = {
	title: "HSE App Template",
	description: "HSE Recovery Platform application template",
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
