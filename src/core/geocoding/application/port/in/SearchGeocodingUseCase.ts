import type { GeocodingSearchResponse } from "@/core/geocoding/model/GeocodingSearch";

export interface SearchGeocodingUseCase {
	search(input: {
		readonly query: string;
		readonly referer: string;
	}): Promise<GeocodingSearchResponse>;
}
