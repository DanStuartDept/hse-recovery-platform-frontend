export class FetchError extends Error {
	constructor(
		message: string,
		public code: string,
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
 * @throws When the request fails or an unexpected error occurs.
 *
 * @example
 * // Example usage:
 * const url = 'https://api.example.com/cms';
 * const init = \{ method: 'GET', headers: \{ 'Content-Type': 'application/json' \} \};
 *
 * try \{
 *   const response = await fetchRequest(url, init);
 *   console.log('Response data:', response);
 * \} catch (error) \{
 *   if (error instanceof FetchError) \{
 *     if (error.code === 'REQUEST_FAILED') \{
 *       console.error('Request failed:', error.message);
 *       // Handle request failure
 *     \} else if (error.code === 'UNEXPECTED_ERROR') \{
 *       console.error('Unexpected error:', error.message);
 *       // Handle unexpected error
 *     \}
 *   \} else \{
 *     console.error('An unknown error occurred:', error);
 *   \}
 * \}
 */
export async function fetchRequest<T>(
	url: string,
	init?: RequestInit,
): Promise<T> {
	try {
		// Set default request options
		const defaultInit = {
			next: {
				revalidate: 360,
			},
		} as RequestInit & { next?: { revalidate?: number } };

		const response = await fetch(url, { ...defaultInit, ...init });

		if (!response.ok) {
			throw new FetchError(
				`Request failed with response: ${JSON.stringify(response, null, 2)}`,
				"REQUEST_FAILED",
			);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof FetchError) {
			throw error; // Re-throw the custom FetchError
		}

		throw new FetchError("An unexpected error occurred", "UNEXPECTED_ERROR");
	}
}
