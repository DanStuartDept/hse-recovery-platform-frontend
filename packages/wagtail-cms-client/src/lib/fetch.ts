export class FetchError extends Error {
	constructor(
		message: string,
		public code: string,
		public status: number,
	) {
		super(message);
		this.name = `FetchError [${code}]`;
	}
}

/**
 * Performs an HTTP request using the Fetch API and handles response and error cases.
 *
 * @param url - The URL to send the request to.
 * @param init - The request options.
 * @returns A Promise that resolves with the parsed JSON response data.
 * @throws {FetchError} When the request fails or an unexpected error occurs.
 */
export async function fetchRequest<T>(
	url: string,
	init?: RequestInit,
): Promise<T> {
	try {
		const defaultInit = {
			next: {
				revalidate: 3600,
			},
		} as RequestInit & { next?: { revalidate?: number } };

		const response = await fetch(url, { ...defaultInit, ...init });

		if (!response.ok) {
			throw new FetchError(
				`Request failed: ${response.status} ${response.statusText} (${response.url})`,
				"REQUEST_FAILED",
				response.status,
			);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof FetchError) {
			throw error;
		}

		throw new FetchError("An unexpected error occurred", "UNEXPECTED_ERROR", 0);
	}
}
