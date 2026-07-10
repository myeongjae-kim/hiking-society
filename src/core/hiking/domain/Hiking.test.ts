import { describe, expect, it } from "vitest";
import { HikingEntity } from "./Hiking";

describe("HikingEntity", () => {
	it("allows only the author to manage the hiking", () => {
		const hiking = HikingEntity.rehydrate({
			activeArticleCount: 0,
			authorUserId: 1,
		});

		expect(hiking.canBeManagedBy(1)).toBe(true);
		expect(hiking.canBeManagedBy(2)).toBe(false);
	});

	it("can be deleted only when there are no active articles", () => {
		expect(
			HikingEntity.rehydrate({
				activeArticleCount: 0,
				authorUserId: 1,
			}).canBeDeleted(),
		).toBe(true);
		expect(
			HikingEntity.rehydrate({
				activeArticleCount: 1,
				authorUserId: 1,
			}).canBeDeleted(),
		).toBe(false);
	});
});
