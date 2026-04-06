import Link from "next/link";
import { Breadcrumb as DSBreadcrumb } from "@hseireland/hse-frontend-react";
import type { CMSPageBreadcrumb } from "@repo/wagtail-cms-types/core";

export type BreadcrumbProps = {
	items?: CMSPageBreadcrumb[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
	if (!items || items.length === 0) return null;
	const lastItem = items[items.length - 1];
	return (
		<DSBreadcrumb>
			{items.map((item) => (
				<DSBreadcrumb.Item key={item.id} href={item.url} asElement={Link}>
					{item.title}
				</DSBreadcrumb.Item>
			))}
			{lastItem && (
				<DSBreadcrumb.Back href={lastItem.url} asElement={Link}>
					{lastItem.title}
				</DSBreadcrumb.Back>
			)}
		</DSBreadcrumb>
	);
}
