import { Breadcrumb as DSBreadcrumb } from "@hseireland/hse-frontend-react";
import type { CMSPageBreadcrumb } from "@repo/wagtail-cms-types/core";
import Link from "next/link";

/** Props for the {@link Breadcrumb} component. */
export type BreadcrumbProps = {
	/** Breadcrumb trail items from the CMS page data. */
	items?: CMSPageBreadcrumb[];
};

/**
 * Renders a breadcrumb navigation trail using the HSE design system `Breadcrumb` component.
 *
 * Also renders a mobile-friendly "back" link to the last breadcrumb item.
 * Returns `null` when no items are provided.
 */
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
