import { config } from "@repo/app-config";
import { CMSClient } from "@repo/wagtail-api-client";

/** Shared CMS client configured from app-config env vars. */
export const cmsClient = new CMSClient({
	baseURL: config.cms.baseURL,
	apiPath: config.cms.apiPath,
});
