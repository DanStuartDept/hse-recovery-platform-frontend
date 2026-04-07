import parse, {
	type DOMNode,
	domToReact,
	Element,
	type HTMLReactParserOptions,
} from "html-react-parser";
import Link from "next/link";

const options: HTMLReactParserOptions = {
	replace: (domNode: DOMNode) => {
		if (
			domNode instanceof Element &&
			domNode.name === "a" &&
			domNode.attribs.href
		) {
			const { href } = domNode.attribs;
			if (href.startsWith("http")) {
				const url = new URL(href);
				if (url.hostname.includes("publications.hse.ie")) {
					let path = url.pathname;
					if (path.startsWith("/publications")) {
						path = path.replace("/publications", "");
					}
					return (
						<Link href={path}>
							{domToReact(domNode.children as DOMNode[], options)}
						</Link>
					);
				}
				return (
					<Link href={href}>
						{domToReact(domNode.children as DOMNode[], options)}
					</Link>
				);
			}
		}
	},
};

/**
 * Parses an HTML string from the CMS into React elements.
 *
 * Rewrites internal `<a>` tags to Next.js `<Link>` components for
 * client-side navigation. HSE Publications URLs have their `/publications`
 * prefix stripped to match frontend routing.
 *
 * @param html - Raw HTML string from the Wagtail rich text field.
 * @returns Parsed React elements ready for rendering.
 */
export function generateRichText(html: string) {
	return parse(html, options);
}
