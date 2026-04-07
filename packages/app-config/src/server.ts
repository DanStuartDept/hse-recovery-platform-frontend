import { serverSchema } from "./schemas";

/** Server-only secrets — never import in client components. */
export type ServerConfig = {
	/** Shared secret for CMS preview API route authentication. */
	previewToken: string;
	/** Shared secret for CMS revalidation webhook authentication. */
	revalidateToken: string;
};

const TEST_SERVER_CONFIG: ServerConfig = {
	previewToken: "",
	revalidateToken: "",
};

function createServerConfig(): ServerConfig {
	if (process.env.NODE_ENV === "test") {
		return TEST_SERVER_CONFIG;
	}

	return serverSchema.parse({
		previewToken: process.env.PREVIEW_TOKEN,
		revalidateToken: process.env.REVALIDATE_TOKEN,
	});
}

/** Server-only configuration. Validated at import time. */
export const serverConfig: ServerConfig = Object.freeze(createServerConfig());
