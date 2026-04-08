import { config } from "@repo/app-config";
import Script from "next/script";

/**
 * Loads the OneTrust cookie consent SDK.
 *
 * Renders nothing when `oneTrustDomainId` is not configured or on localhost.
 * The `OptanonWrapper` callback is required by the OneTrust SDK — it fires
 * after the banner initialises and whenever the user updates consent.
 */
export function OneTrustScripts() {
	if (config.isLocalhost || !config.oneTrustDomainId) {
		return null;
	}

	return (
		<>
			<Script
				src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
				strategy="beforeInteractive"
				data-domain-script={config.oneTrustDomainId}
				data-document-language="true"
			/>
			<Script id="onetrust-optanon" strategy="beforeInteractive">
				{"function OptanonWrapper() {}"}
			</Script>
		</>
	);
}
