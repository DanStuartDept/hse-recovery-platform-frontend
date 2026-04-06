import Link from "next/link";
import parse, {
	type DOMNode,
	Element,
	type HTMLReactParserOptions,
	domToReact,
} from "html-react-parser";

const options: HTMLReactParserOptions = {
	replace: (domNode: DOMNode) => {
		if (domNode instanceof Element && domNode.name === "a" && domNode.attribs.href) {
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

export function generateRichText(html: string) {
	return parse(html, options);
}
