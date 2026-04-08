import PiwikProProvider from "@piwikpro/next-piwik-pro";
import { config } from "@repo/app-config";

/**
 * Wraps children in the Piwik Pro analytics provider.
 *
 * When Piwik is not configured or on localhost, children are rendered
 * unwrapped — no provider overhead and no tracking scripts injected.
 */
export function PiwikProScripts({ children }: { children: React.ReactNode }) {
	if (config.isLocalhost || !config.piwik) {
		return <>{children}</>;
	}

	return (
		<PiwikProProvider
			containerId={config.piwik.containerId}
			containerUrl={config.piwik.containerUrl}
		>
			{children}
		</PiwikProProvider>
	);
}
