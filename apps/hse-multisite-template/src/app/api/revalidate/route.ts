import { serverConfig } from "@repo/app-config/server";
import { log, warn } from "@repo/logger";
import { revalidatePath } from "next/cache";

const HEADERS = { "Cache-Control": "no-cache" };

export async function GET(request: Request): Promise<Response> {
	const { searchParams } = new URL(request.url);
	const path = searchParams.get("path");
	const token = searchParams.get("token");

	if (token !== serverConfig.revalidateToken) {
		warn("[Revalidate] Invalid token attempt");
		return new Response("Invalid revalidation token", {
			status: 401,
			headers: HEADERS,
		});
	}

	if (!path) {
		return Response.json(
			{
				revalidated: false,
				now: Date.now(),
				message: "Missing path to revalidate",
			},
			{ headers: HEADERS, status: 400 },
		);
	}

	revalidatePath(path);
	log("[Revalidate] Revalidated:", path);

	return Response.json(
		{ revalidated: true, now: Date.now() },
		{ headers: HEADERS },
	);
}
