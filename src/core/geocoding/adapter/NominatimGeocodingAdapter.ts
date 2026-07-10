import { applicationError } from "@/core/common/application/ApplicationError";
import type { GeocodingSearchPort } from "@/core/geocoding/application/port/out/GeocodingSearchPort";

type NominatimSearchResult = {
	display_name?: unknown;
	lat?: unknown;
	lon?: unknown;
	osm_id?: unknown;
	place_id?: unknown;
};

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

export class NominatimGeocodingAdapter implements GeocodingSearchPort {
	async search(input: Parameters<GeocodingSearchPort["search"]>[0]) {
		const url = new URL("https://nominatim.openstreetmap.org/search");
		url.searchParams.set("q", input.query);
		url.searchParams.set("format", "json");
		url.searchParams.set("limit", "5");

		let response: Response;

		try {
			response = await fetch(url, {
				headers: {
					Accept: "application/json",
					Referer: input.referer,
					"User-Agent":
						"hiking-society/0.1.0 (https://github.com/myeongjaekim/hiking-society)",
				},
			});
		} catch {
			throw applicationError.badRequest(
				"주소 검색 서비스에 연결하지 못했습니다.",
			);
		}

		if (!response.ok) {
			throw applicationError.badRequest(
				"주소 검색 서비스가 응답하지 않았습니다.",
			);
		}

		const body = (await response.json()) as unknown;

		if (!Array.isArray(body)) {
			throw applicationError.badRequest("주소 검색 결과를 읽지 못했습니다.");
		}

		return {
			results: body
				.map((item, index) =>
					parseNominatimResult(item as NominatimSearchResult, index),
				)
				.filter((item): item is NonNullable<typeof item> => item !== null),
		};
	}
}
