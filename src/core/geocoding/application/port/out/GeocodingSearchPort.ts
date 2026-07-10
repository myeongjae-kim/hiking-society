import type { GeocodingSearchResponse } from "@/core/geocoding/model/GeocodingSearch";

export interface GeocodingSearchPort {
	search(input: {
		readonly query: string;
		readonly referer: string;
	}): Promise<GeocodingSearchResponse>;
}
