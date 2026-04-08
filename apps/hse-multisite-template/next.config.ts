import { config } from "@repo/app-config";
import type { NextConfig } from "next";
import { securityHeaders } from "./security-headers";

const nextConfig: NextConfig = {
	trailingSlash: true,
	transpilePackages: ["@piwikpro/next-piwik-pro"],
	images: {
		remotePatterns: (config.remoteImageDomains ?? []).map((hostname) => ({
			protocol: "https" as const,
			hostname,
		})),
	},
	...(config.isLocalhost && {
		logging: {
			fetches: {
				fullUrl: true,
			},
		},
	}),
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
