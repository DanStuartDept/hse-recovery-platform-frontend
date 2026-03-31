import type {
	CMSContent,
	CMSContentPath,
	CMSContents,
	CMSQueries,
} from "@repo/wagtail-cms-types/core";
import { buildQueryString } from "../../utils/index.js";
import { fetchRequest } from "../index.js";

/**
 * Fetches CMS content using the provided parameters and handles response and error cases.
 *
 * @param baseURL - The base URL of the CMS API.
 * @param apiPath - The API path for fetching content (e.g., '/api/cms/v2').
 * @param content - The type of CMS content to fetch.
 * @param queries - Optional queries to filter the content.
 * @param init - Optional request options.
 * @returns A Promise that resolves with the parsed JSON response data.
 * @throws When the request fails or an unexpected error occurs.
 *
 * @example
 * // Example usage:
 * const baseURL = 'https://api.example.com';
 * const apiPath = '/api/cms/v2';
 * const content = 'posts';
 * const queries = \{ category: 'news', limit: 10 \};
 * const init = \{ method: 'GET', headers: \{ 'Content-Type': 'application/json' \} \};
 *
 * try \{
 *   const response = await fetchContent(baseURL, apiPath, content, queries, init);
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
export async function fetchContent<T>(
	baseURL: string,
	apiPath: string, //  /api/cms/v2
	content: CMSContentPath,
	queries?: CMSQueries,
	init?: RequestInit,
): Promise<CMSContents | CMSContent | T> {
	// Note: No need of try/catch here, leave the user to handle
	// https://stackoverflow.com/questions/64227502/should-the-inner-function-or-the-calling-function-be-wrapped-within-a-try-catch

	// build the query string if queries are provided
	// random ordering with offset is not supported
	if (queries?.order === "random" && queries.offset) {
		throw new Error(
			"Random ordering with offset is not supported. Please remove either the 'order' or 'offset' query.",
		);
	}

	// Filter by tree position is supported only for pages
	if (
		(queries?.child_of || queries?.ancestor_of || queries?.descendant_of) &&
		content !== "pages"
	) {
		throw new Error(
			"Filtering by tree position is supported only for pages. Please remove the 'child_of', 'ancestor_of' or 'descendant_of' query.",
		);
	}
	const query = buildQueryString(queries);

	const fullUrl = `${baseURL}${apiPath}/${content}/?${query}`;

	return fetchRequest(fullUrl, init);
}
