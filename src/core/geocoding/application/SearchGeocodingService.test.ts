import { describe, expect, it, vi } from "vitest";
import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { GeocodingSearchPort } from "./port/out/GeocodingSearchPort";
import { SearchGeocodingService } from "./SearchGeocodingService";

function createClock(now: Date): ClockPort & { setNow: (next: Date) => void } {
	let current = now;

	return {
		now: () => current,
		setNow: (next) => {
			current = next;
		},
	};
}

describe("SearchGeocodingService", () => {
	it("caches normalized queries until the cache entry expires", async () => {
		const geocodingSearchPort: GeocodingSearchPort = {
			search: vi.fn().mockResolvedValue({
				results: [
					{
						id: "1",
						label: "북한산",
						latitude: 37.6586,
						longitude: 126.977,
					},
				],
			}),
		};
		const clock = createClock(new Date("2026-07-10T00:00:00.000Z"));
		const service = new SearchGeocodingService(geocodingSearchPort, clock);

		await service.search({ query: " 북한산 ", referer: "https://example.com" });
		await service.search({ query: "북한산", referer: "https://example.com" });

		expect(geocodingSearchPort.search).toHaveBeenCalledTimes(1);

		clock.setNow(new Date("2026-07-10T00:10:01.000Z"));

		await service.search({ query: "북한산", referer: "https://example.com" });

		expect(geocodingSearchPort.search).toHaveBeenCalledTimes(2);
	});
});
