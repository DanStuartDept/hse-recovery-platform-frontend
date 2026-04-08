import { Details } from "@hseireland/hse-frontend-react";

/**
 * Collapsible panel that dumps raw CMS data as formatted JSON.
 * Rendered by the factory when the `debug` option is enabled.
 */
export function CmsDebugPanel({ data }: { data: unknown }) {
	return (
		<div className="hse-u-padding-4">
			<Details expander>
				<Details.Summary>CMS Debug — Raw Response</Details.Summary>
				<Details.Text>
					<pre
						style={{ overflow: "auto", maxHeight: "80vh" }}
						className="hse-body-xs"
					>
						{JSON.stringify(data, null, 2)}
					</pre>
				</Details.Text>
			</Details>
		</div>
	);
}
