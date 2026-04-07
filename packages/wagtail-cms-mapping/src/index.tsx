import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { defaultBlockRegistry } from "./blocks/index";
import { defaultPageRegistry } from "./pages/index";
import type {
	BlockComponentProps,
	CMSRenderer,
	CMSRendererOptions,
	PageLayoutProps,
} from "./types/index";

function DefaultFallbackBlock({ type, value, context }: BlockComponentProps) {
	if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME !== "local") return null;
	return (
		<div>
			<h2>Missing Block Type: {type}</h2>
			<p>Page: {context.page.meta.type}</p>
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}

function DefaultFallbackPage({ page, renderBlocks }: PageLayoutProps) {
	return (
		<main>
			<h1>{page.title}</h1>
			{renderBlocks(page.body)}
		</main>
	);
}

/**
 * Creates a CMS renderer with merged block/page registries and context threading.
 *
 * Returns `renderBlock`, `renderBlocks`, and `renderPage` functions that
 * resolve CMS data to React components using the configured registries.
 * Every component receives a {@link CMSRenderContext} with page data,
 * block position metadata, and the API client.
 *
 * @example
 * ```tsx
 * const { renderPage } = createCMSRenderer({ apiClient });
 * // In a Server Component:
 * return renderPage(page);
 * ```
 */
export function createCMSRenderer(options: CMSRendererOptions): CMSRenderer {
	const { apiClient } = options;
	const blockRegistry = {
		...defaultBlockRegistry,
		...options?.blocks,
	};
	const pageRegistry = {
		...defaultPageRegistry,
		...options?.pages,
	};
	const FallbackBlock = options?.fallbackBlock ?? DefaultFallbackBlock;
	const FallbackPage = options?.fallbackPage ?? DefaultFallbackPage;

	let currentPage: CMSPageProps;

	function renderBlock(block: CMSBlockType): React.ReactNode {
		const Component = blockRegistry[block.type] ?? FallbackBlock;
		return (
			<Component
				key={block.id}
				{...block}
				context={{
					page: currentPage,
					apiClient,
					position: {
						index: 0,
						isFirst: true,
						isLast: true,
						previous: null,
						next: null,
					},
				}}
				renderBlocks={renderBlocks}
			/>
		);
	}

	function renderBlocks(blocks: CMSBlockType[] = []): React.ReactNode[] {
		if (!blocks) return [];
		return blocks.map((block, index) => {
			const Component = blockRegistry[block.type] ?? FallbackBlock;
			return (
				<Component
					key={block.id}
					{...block}
					context={{
						page: currentPage,
						apiClient,
						position: {
							index,
							isFirst: index === 0,
							isLast: index === blocks.length - 1,
							previous: blocks[index - 1] ?? null,
							next: blocks[index + 1] ?? null,
						},
					}}
					renderBlocks={renderBlocks}
				/>
			);
		});
	}

	function renderPage(page: CMSPageProps): React.ReactNode {
		currentPage = page;
		const Layout = pageRegistry[page.meta.type] ?? FallbackPage;
		return (
			<Layout
				key={page.id}
				page={page}
				context={{ page, apiClient }}
				renderBlocks={renderBlocks}
			/>
		);
	}

	return { renderBlock, renderBlocks, renderPage };
}

export type * from "./types/index";
