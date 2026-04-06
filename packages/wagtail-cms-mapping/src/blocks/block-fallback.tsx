import type { BlockComponentProps } from "../types/index";

export function BlockFallback({ type, value }: BlockComponentProps) {
	if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME !== "local") return null;
	return (
		<div>
			<h2>Missing Block Type: {type}</h2>
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}
