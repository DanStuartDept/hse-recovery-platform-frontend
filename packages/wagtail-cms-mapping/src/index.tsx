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

// Inline fallbacks so we don't need to import from files that don't exist yet
function DefaultFallbackBlock({ type, value }: BlockComponentProps) {
	if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME !== "local") return null;
	return (
		<div>
			<h2>Missing Block Type: {type}</h2>
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

export function createCMSRenderer(options?: CMSRendererOptions): CMSRenderer {
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

	function renderBlock(block: CMSBlockType): React.ReactNode {
		const Component = blockRegistry[block.type];
		if (!Component) {
			return <FallbackBlock key={block.id} {...block} />;
		}
		return <Component key={block.id} {...block} renderBlocks={renderBlocks} />;
	}

	function renderBlocks(blocks: CMSBlockType[] = []): React.ReactNode[] {
		if (!blocks) return [];
		return blocks.map(renderBlock);
	}

	function renderPage(page: CMSPageProps): React.ReactNode {
		const Layout = pageRegistry[page.meta.type];
		if (!Layout) {
			return (
				<FallbackPage key={page.id} page={page} renderBlocks={renderBlocks} />
			);
		}
		return <Layout key={page.id} page={page} renderBlocks={renderBlocks} />;
	}

	return { renderBlock, renderBlocks, renderPage };
}

export type * from "./types/index";
