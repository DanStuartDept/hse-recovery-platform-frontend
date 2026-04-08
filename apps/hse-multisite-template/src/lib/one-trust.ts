declare global {
	interface Window {
		OneTrust?: {
			ToggleInfoDisplay: () => void;
		};
	}
}

/** Opens the OneTrust cookie preferences dialog, if the SDK is loaded. */
export function toggleOneTrustDisplay(): void {
	window.OneTrust?.ToggleInfoDisplay();
}
