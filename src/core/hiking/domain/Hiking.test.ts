import { describe, expect, it } from "vitest";
import { HikingEntity } from "./Hiking";
import type { HikingId } from "./Hiking";

const hikingId = "10" as HikingId;

describe("HikingEntity", () => {
	it("allows only the author to manage the hiking", () => {
		const hiking = HikingEntity.rehydrate({
			activeArticleCount: 0,
			authorUserId: 1,
			id: hikingId,
		});

		expect(hiking.canBeManagedBy(1)).toBe(true);
		expect(hiking.canBeManagedBy(2)).toBe(false);
	});

	it("can be deleted only when there are no active articles", () => {
		expect(
			HikingEntity.rehydrate({
				activeArticleCount: 0,
				authorUserId: 1,
				id: hikingId,
			}).canBeDeleted(),
		).toBe(true);
		expect(
			HikingEntity.rehydrate({
				activeArticleCount: 1,
				authorUserId: 1,
				id: hikingId,
			}).canBeDeleted(),
		).toBe(false);
	});

	it("returns update and delete decisions from its aggregate state", () => {
		const hiking = HikingEntity.rehydrate({
			activeArticleCount: 0,
			authorUserId: 1,
			id: hikingId,
		});

		expect(
			hiking.planUpdate({
				userId: 1,
				values: { mountainName: "북한산" },
			}),
		).toEqual({
			hikingId,
			values: { mountainName: "북한산" },
		});
		expect(
			hiking.planUpdate({
				userId: 2,
				values: { mountainName: "북한산" },
			}),
		).toBeNull();
		expect(hiking.planDelete({ userId: 1 })).toEqual({
			hikingId,
			status: "ok",
		});
		expect(hiking.planDelete({ userId: 2 })).toEqual({
			status: "forbidden",
		});
		expect(
			HikingEntity.rehydrate({
				activeArticleCount: 2,
				authorUserId: 1,
				id: hikingId,
			}).planDelete({ userId: 1 }),
		).toEqual({
			activeArticleCount: 2,
			status: "has-active-articles",
		});
	});
});
