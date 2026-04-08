import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { BlockFallback, defaultBlockRegistry } from "./blocks/index";
import { CmsDebugPanel } from "./components/cms-debug-panel";
import { defaultPageRegistry } from "./pages/index";
import type {
	CMSRenderer,
	CMSRendererOptions,
	PageLayoutProps,
} from "./types/index";

function DefaultFallbackPage({ page }: PageLayoutProps) {
	return (
		<main>
			<h1>{page.title}</h1>
			<p>No layout registered for page type &ldquo;{page.meta.type}&rdquo;.</p>
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
 * **Important:** Create a new renderer per request. Do not cache a renderer
 * instance at module scope — the internal page state is set by `renderPage`
 * and must not be shared across concurrent requests.
 *
 * @example
 * ```tsx
 * const { renderPage } = createCMSRenderer({ apiClient });
 * // In a Server Component:
 * return renderPage(page);
 * ```
 */
export function createCMSRenderer(options: CMSRendererOptions): CMSRenderer {
	const { apiClient, debug = false } = options;
	const blockRegistry = {
		...defaultBlockRegistry,
		...options.blocks,
	};
	const pageRegistry = {
		...defaultPageRegistry,
		...options.pages,
	};
	const FallbackBlock = options.fallbackBlock ?? BlockFallback;
	const FallbackPage = options.fallbackPage ?? DefaultFallbackPage;

	let currentPage: CMSPageProps;

	function renderBlock(block: CMSBlockType): React.ReactNode {
		if (!currentPage) {
			throw new Error(
				"renderBlock called before renderPage. Call renderPage first to set the page context.",
			);
		}
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
		if (!blocks || blocks.length === 0) return [];
		if (!currentPage) {
			throw new Error(
				"renderBlocks called before renderPage. Call renderPage first to set the page context.",
			);
		}
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
			<>
				<Layout
					key={page.id}
					page={page}
					context={{ page, apiClient }}
					renderBlocks={renderBlocks}
				/>
				{debug && <CmsDebugPanel data={page} />}
			</>
		);
	}

	return { renderBlock, renderBlocks, renderPage };
}

export type * from "./types/index";
