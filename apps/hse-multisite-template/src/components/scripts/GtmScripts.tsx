import { GoogleTagManager } from "@next/third-parties/google";
import { config } from "@repo/app-config";

/**
 * Loads the Google Tag Manager container script.
 *
 * Renders nothing when `gtmId` is not configured or on localhost.
 * Uses `@next/third-parties` which handles both the `<script>` tag
 * and the `<noscript>` iframe automatically.
 */
export function GtmScripts() {
	if (config.isLocalhost || !config.gtmId) {
		return null;
	}

	return <GoogleTagManager gtmId={config.gtmId} />;
}
