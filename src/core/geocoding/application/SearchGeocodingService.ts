import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import { Autowired } from "@/core/config/Autowired";
import type { GeocodingSearchResponse } from "@/core/geocoding/model/GeocodingSearch";
import type { SearchGeocodingUseCase } from "./port/in/SearchGeocodingUseCase";
import type { GeocodingSearchPort } from "./port/out/GeocodingSearchPort";

const cacheTtlMs = 1000 * 60 * 10;
const maxCacheSize = 100;

type CachedGeocodingSearch = {
	readonly expiresAtMs: number;
	readonly value: GeocodingSearchResponse;
};

export class SearchGeocodingService implements SearchGeocodingUseCase {
	private readonly cache = new Map<string, CachedGeocodingSearch>();

	constructor(
		@Autowired("GeocodingSearchPort")
		private geocodingSearchPort: GeocodingSearchPort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	async search(input: Parameters<SearchGeocodingUseCase["search"]>[0]) {
		const query = input.query.trim();
		const cacheKey = query.toLocaleLowerCase();
		const nowMs = this.clockPort.now().getTime();
		const cached = this.readCachedSearch(cacheKey, nowMs);

		if (cached) {
			return cached;
		}

		const value = await this.geocodingSearchPort.search({
			query,
			referer: input.referer,
		});

		this.writeCachedSearch(cacheKey, value, nowMs);
		return value;
	}

	private readCachedSearch(cacheKey: string, nowMs: number) {
		const cached = this.cache.get(cacheKey);

		if (!cached) {
			return null;
		}

		if (cached.expiresAtMs <= nowMs) {
			this.cache.delete(cacheKey);
			return null;
		}

		return cached.value;
	}

	private writeCachedSearch(
		cacheKey: string,
		value: GeocodingSearchResponse,
		nowMs: number,
	) {
		if (this.cache.size >= maxCacheSize) {
			const oldestKey = this.cache.keys().next().value;

			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(cacheKey, {
			expiresAtMs: nowMs + cacheTtlMs,
			value,
		});
	}
}
