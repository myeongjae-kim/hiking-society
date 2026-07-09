import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { badRequest } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	geocodingSearchQuerySchema,
	geocodingSearchResponseSchema,
} from "#/api/schemas";

const controller = Controller();
const cacheTtlMs = 1000 * 60 * 10;
const maxCacheSize = 100;
const geocodingCache = new Map<
	string,
	{ expiresAt: number; value: GeocodingSearchResponse }
>();

type GeocodingSearchResponse = {
	results: Array<{
		id: string;
		label: string;
		latitude: number;
		longitude: number;
	}>;
};

type NominatimSearchResult = {
	display_name?: unknown;
	lat?: unknown;
	lon?: unknown;
	osm_id?: unknown;
	place_id?: unknown;
};

function readCachedSearch(cacheKey: string) {
	const cached = geocodingCache.get(cacheKey);

	if (!cached) {
		return null;
	}

	if (cached.expiresAt <= Date.now()) {
		geocodingCache.delete(cacheKey);
		return null;
	}

	return cached.value;
}

function writeCachedSearch(cacheKey: string, value: GeocodingSearchResponse) {
	if (geocodingCache.size >= maxCacheSize) {
		const oldestKey = geocodingCache.keys().next().value;

		if (oldestKey) {
			geocodingCache.delete(oldestKey);
		}
	}

	geocodingCache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, value });
}

function parseNominatimResult(result: NominatimSearchResult, index: number) {
	const latitude = typeof result.lat === "string" ? Number(result.lat) : NaN;
	const longitude = typeof result.lon === "string" ? Number(result.lon) : NaN;
	const label =
		typeof result.display_name === "string" ? result.display_name : "";
	const rawId = result.place_id ?? result.osm_id ?? index;

	if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}

	return {
		id: String(rawId),
		label,
		latitude,
		longitude,
	};
}

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const query = c.req.valid("query").q.trim();
		const cacheKey = query.toLocaleLowerCase();
		const cached = readCachedSearch(cacheKey);

		if (cached) {
			return c.json(geocodingSearchResponseSchema.parse(cached), 200);
		}

		const url = new URL("https://nominatim.openstreetmap.org/search");
		url.searchParams.set("q", query);
		url.searchParams.set("format", "json");
		url.searchParams.set("limit", "5");

		let response: Response;

		try {
			response = await fetch(url, {
				headers: {
					Accept: "application/json",
					Referer: new URL(c.req.url).origin,
					"User-Agent":
						"hiking-society/0.1.0 (https://github.com/myeongjaekim/hiking-society)",
				},
			});
		} catch {
			throw badRequest("주소 검색 서비스에 연결하지 못했습니다.");
		}

		if (!response.ok) {
			throw badRequest("주소 검색 서비스가 응답하지 않았습니다.");
		}

		const body = (await response.json()) as unknown;

		if (!Array.isArray(body)) {
			throw badRequest("주소 검색 결과를 읽지 못했습니다.");
		}

		const value = {
			results: body
				.map((item, index) =>
					parseNominatimResult(item as NominatimSearchResult, index),
				)
				.filter((item): item is NonNullable<typeof item> => item !== null),
		};

		writeCachedSearch(cacheKey, value);

		return c.json(geocodingSearchResponseSchema.parse(value), 200);
	},
);

export default controller;
