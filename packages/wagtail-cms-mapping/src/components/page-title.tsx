import { generateRichText } from "../utils/generate-rich-text";

/** Props for the {@link PageTitle} component. */
export type PageTitleProps = {
	/** The page heading text. */
	title: string;
	/** Optional plain-text lead paragraph. */
	lead?: string;
	/** Optional rich-text (HTML) lead paragraph — parsed via {@link generateRichText}. */
	richLead?: string;
};

/**
 * Renders a page heading with an optional lead paragraph.
 *
 * Supports both plain-text `lead` and rich-text `richLead` variants.
 * When `richLead` is provided, HTML is parsed to React elements
 * with internal links rewritten to Next.js `<Link>`.
 */
export function PageTitle({ title, lead, richLead }: PageTitleProps) {
	return (
		<>
			<h1 className="hse-u-margin-bottom-6">{title}</h1>
			{lead && (
				<div className="hse-lede-text">
					<p>{generateRichText(lead)}</p>
				</div>
			)}
			{richLead && (
				<div className="hse-lede-text">{generateRichText(richLead)}</div>
			)}
		</>
	);
}
