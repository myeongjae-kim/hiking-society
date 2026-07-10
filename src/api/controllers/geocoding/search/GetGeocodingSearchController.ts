import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	geocodingSearchQuerySchema,
	geocodingSearchResponseSchema,
} from "#/api/schemas";
import type { SearchGeocodingUseCase } from "@/core/geocoding/application/port/in/SearchGeocodingUseCase";

export function createGetGeocodingSearchController(
	searchGeocodingUseCase: SearchGeocodingUseCase,
) {
	const controller = Controller();

	const getGeocodingSearchRoute = createRoute({
		method: "get",
		path: "/geocoding/search",
		request: { query: geocodingSearchQuerySchema },
		responses: {
			200: {
				content: {
					"application/json": { schema: geocodingSearchResponseSchema },
				},
				description: "Geocoding search results",
			},
			400: {
				content: { "application/json": { schema: apiErrorSchema } },
				description: "Bad request",
			},
			401: {
				content: { "application/json": { schema: apiErrorSchema } },
				description: "Unauthorized",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["geocoding"],
	});

	controller.openapi(getGeocodingSearchRoute, async (c) => {
		requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const value = await searchGeocodingUseCase.search({
			query: c.req.valid("query").q,
			referer: new URL(c.req.url).origin,
		});

		return c.json(geocodingSearchResponseSchema.parse(value), 200);
	});

	return controller;
}
