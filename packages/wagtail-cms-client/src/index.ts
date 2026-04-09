/**
 * Export all from "lib" and "types"
 */
import type {
	ClientOptions,
	CMSContent,
	CMSContentPath,
	CMSContents,
	CMSMediaContents,
	CMSMediaMeta,
	CMSPageContent,
	CMSPageContents,
	CMSQueries,
	NotFoundContents,
} from "@repo/wagtail-cms-types/core";
import type {
	CMSFooterAPIResponse,
	CMSFooterResponse,
	CMSHeaderAPIResponse,
	CMSHeaderResponse,
} from "@repo/wagtail-cms-types/settings";
import { FetchError, fetchContent, fetchRequest } from "./lib/index.js";
import { isNotFound } from "./utils/index.js";

export * from "./lib/index.js";

/**
 * Class representing a client for fetching CMS content.
 */
export class CMSClient {
	private baseURL: string;
	private mediaBaseURL?: string;
	private apiPath: string;
	private init?: RequestInit;

	/**
	 * Checks if a string ends with a '/'.
	 * @param str - The string to check.
	 * @returns True if the string ends with '/', false otherwise.
	 */
	private endsWithSlash(str: string): boolean {
		return str.endsWith("/");
	}

	/**
	 * Creates an instance of CMSClient.
	 * @param options - Options for configuring the client.
	 */
	constructor(options: ClientOptions) {
		if (
			this.endsWithSlash(options.baseURL) ||
			this.endsWithSlash(options.apiPath) ||
			(options.mediaBaseURL && this.endsWithSlash(options.mediaBaseURL))
		) {
			throw new Error('baseURL, mediaBaseURL or apiPath must not end with "/"');
		}
		this.baseURL = options.baseURL;
		this.mediaBaseURL = options.mediaBaseURL;
		this.apiPath = options.apiPath;
		this.init = options.init;
	}

	/**
	 * Handles errors from fetch operations, returning a NotFoundContents response.
	 */
	private handleFetchError(error: unknown, message: string): NotFoundContents {
		if (error instanceof FetchError) {
			return { message, data: error };
		}
		return { message: "An unknown error occurred:", data: error };
	}

	/**
	 * Fetches an endpoint using the provided path and handles response and error cases.
	 *
	 * @param path - The path of the endpoint to fetch.
	 * @param init - Optional request options.
	 * @returns Promise that resolves with the parsed JSON response data.
	 */
	public async fetchEndpoint<T>(
		path: string,
		init?: RequestInit,
	): Promise<T | NotFoundContents> {
		if (!path) {
			throw new Error(
				"Path is required to find an endpoint. Please provide a valid path.",
			);
		}
		const url = `${this.baseURL}${this.apiPath}/${path}`;
		try {
			return (await fetchRequest(url, init)) as T;
		} catch (error) {
			return this.handleFetchError(error, "Path not found");
		}
	}

	/**
	 * Fetches CMS content using the provided parameters and handles response and error cases.
	 *
	 * @param content - The type of CMS content to fetch.
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns Promise that resolves with the parsed JSON response data.
	 */
	public async fetchContent<T>(
		content: CMSContentPath,
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<CMSContents | CMSContent | T> {
		return fetchContent<T>(
			this.baseURL,
			this.apiPath,
			content,
			queries,
			init || this.init,
		);
	}

	/**
	 * Fetches a single page based on its ID or slug, handling response and error cases.
	 *
	 * @param idOrSlug - The ID (number) or slug (string) of the page to fetch.
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the page content or a "not found" response.
	 */
	public async fetchPage(
		idOrSlug: number | string,
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<CMSContent | NotFoundContents> {
		const contentType = "pages";

		if (typeof idOrSlug === "string") {
			const response = (await this.fetchContent(
				contentType,
				{ slug: idOrSlug, ...queries },
				init,
			)) as CMSContents;

			const page = response.items[0];
			if (page) {
				return page;
			}
			return {
				message: `Page not found: ${idOrSlug}`,
				data: response,
			};
		}
		try {
			return (await this.fetchContent(
				`${contentType}/${idOrSlug}`,
				queries,
				init,
			)) as CMSContent;
		} catch (error) {
			return this.handleFetchError(error, `Page not found: ${idOrSlug}`);
		}
	}

	/**
	 * Fetches a single page based on its path, handling response and error cases.
	 *
	 * @param path - The path of the page to fetch.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the page content or a "not found" response.
	 */
	public async findPageByPath<T = CMSPageContent>(
		path: string,
		init?: RequestInit,
	): Promise<T | NotFoundContents> {
		if (!path) {
			throw new Error(
				"Path is required to find a page. Please provide a valid path.",
			);
		}
		const url = `${this.baseURL}${this.apiPath}/pages/find/?html_path=${path}`;
		try {
			return (await fetchRequest(url, init)) as T;
		} catch (error) {
			return this.handleFetchError(error, `Page not found: ${path}`);
		}
	}

	/**
	 * Fetches a page preview from wagtail.
	 * @param contentType - The wagtail model of the page
	 * @param token - The token that was sent from wagtail
	 * @param id - The is of the page
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the page content or a "not found" response.
	 */
	public async fetchPagePreview<T = CMSPageContent>(
		contentType: string,
		token: string,
		id: string,
		init?: RequestInit,
	): Promise<T | NotFoundContents> {
		if (!contentType || !token || !id) {
			throw new Error("contentType, token and id are all required params");
		}
		const url = `${this.baseURL}${this.apiPath}/page-preview/?content_type=${contentType}&token=${token}&id=${id}`;
		try {
			return (await fetchRequest(url, init)) as T;
		} catch (error) {
			return this.handleFetchError(error, "Preview not found");
		}
	}

	/**
	 * Fetches a single image based on its ID or slug, handling response and error cases.
	 *
	 * @param id - The ID of the image to fetch.
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the image content or a "not found" response.
	 */
	public async fetchImage(
		id: number,
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<CMSContent | NotFoundContents> {
		const contentType = "images";
		try {
			return (await this.fetchContent(
				`${contentType}/${id}`,
				queries,
				init,
			)) as CMSContent;
		} catch (error) {
			return this.handleFetchError(error, "Image not found");
		}
	}

	/**
	 * Fetches a single document based on its ID or slug, handling response and error cases.
	 *
	 * @param id - The ID of the document to fetch.
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the document content or a "not found" response.
	 */
	public async fetchDocument(
		id: number,
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<CMSContent | NotFoundContents> {
		const contentType = "documents";
		try {
			return (await this.fetchContent(
				`${contentType}/${id}`,
				queries,
				init,
			)) as CMSContent;
		} catch (error) {
			return this.handleFetchError(error, "Document not found");
		}
	}

	/**
	 * Fetches all pages based on the provided queries, handling response and error cases.
	 *
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the list of pages.
	 */
	public async fetchPages<T = CMSPageContents>(
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<T> {
		return (await this.fetchContent("pages", queries, init)) as T;
	}

	/**
	 * Fetches all images based on the provided queries, handling response and error cases.
	 *
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the list of images.
	 */
	public async fetchImages<T = CMSMediaContents>(
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<T> {
		return (await this.fetchContent("images", queries, init)) as T;
	}

	/**
	 * Fetches all documents based on the provided queries, handling response and error cases.
	 *
	 * @param queries - Optional queries to filter the content.
	 * @param init - Optional request options.
	 * @returns A Promise that resolves with the list of documents.
	 */
	public async fetchDocuments<T = CMSContents>(
		queries?: CMSQueries,
		init?: RequestInit,
	): Promise<T> {
		return (await this.fetchContent("documents", queries, init)) as T;
	}

	/**
	 * Contructs the URL for a media item based on its type.
	 * @param media - The media item to construct the URL for.
	 * Images: the download_url property is a relative URL, so we need to prepend the baseURL.
	 * i.e this.baseURL + media.download_url
	 * Documents: the download_url property is an absolute URL, so we need to extract the pathname.
	 * i.e. this.baseURL + new URL(media.download_url).pathname
	 * @returns The URL for the media item.
	 */
	public getMediaSrc(media: CMSMediaMeta): string {
		const baseUrl = this.mediaBaseURL || this.baseURL;
		// Regular expression to match HTTP URLs
		const httpUrlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

		// Check if download_url matches the HTTP URL pattern
		if (httpUrlPattern.test(media.download_url)) {
			// If it's a valid HTTP URL, use it
			return `${baseUrl}${new URL(media.download_url).pathname}`;
		}
		// If it doesn't look like an HTTP URL, use it as is
		return baseUrl + media.download_url;
	}

	/**
	 * Fetches an endpoint relative to the base URL, bypassing the API path prefix.
	 * Used for custom Wagtail endpoints outside the standard `/api/v2/` path
	 * (e.g., `/api/headers/`, `/api/footers/`).
	 *
	 * @param path - The path relative to the base URL, must not begin with `/`.
	 * @param notFoundMessage - Message to include in the NotFoundContents response on failure.
	 * @param init - Optional request options (e.g., ISR revalidation).
	 * @returns Promise that resolves with the parsed JSON response data.
	 */
	private async fetchBaseEndpoint<T>(
		path: string,
		notFoundMessage: string,
		init?: RequestInit,
	): Promise<T | NotFoundContents> {
		const url = `${this.baseURL}/${path}`;
		try {
			return (await fetchRequest(url, init)) as T;
		} catch (error) {
			return this.handleFetchError(error, notFoundMessage);
		}
	}

	/**
	 * Fetches the site header configuration from the CMS.
	 * Calls the `/api/headers/` endpoint and returns the first item from the array.
	 *
	 * @param init - Optional request options (e.g., ISR revalidation).
	 * @returns The header configuration, or `NotFoundContents` if the fetch fails or the array is empty.
	 */
	public async fetchHeader(
		init?: RequestInit,
	): Promise<CMSHeaderResponse | NotFoundContents> {
		const response = await this.fetchBaseEndpoint<CMSHeaderAPIResponse>(
			"api/headers/",
			"Header not found",
			init,
		);

		if (isNotFound(response)) {
			return response;
		}

		const first = response[0];
		if (!first) {
			return { message: "Header not found", data: response };
		}
		return first;
	}

	/**
	 * Fetches the site footer configuration from the CMS.
	 * Calls the `/api/footers/` endpoint and returns the first item from the array.
	 *
	 * @param init - Optional request options (e.g., ISR revalidation).
	 * @returns The footer configuration, or `NotFoundContents` if the fetch fails or the array is empty.
	 */
	public async fetchFooter(
		init?: RequestInit,
	): Promise<CMSFooterResponse | NotFoundContents> {
		const response = await this.fetchBaseEndpoint<CMSFooterAPIResponse>(
			"api/footers/",
			"Footer not found",
			init,
		);

		if (isNotFound(response)) {
			return response;
		}

		const first = response[0];
		if (!first) {
			return { message: "Footer not found", data: response };
		}
		return first;
	}
}
