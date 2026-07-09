import { describe, expect, it } from "vitest";
import {
	ArticleMediaCollection,
	ArticleOwnership,
} from "@/core/article/domain/ArticlePolicy";

describe("ArticleMediaCollection", () => {
	it("does not expose publishable media when the collection is empty", () => {
		expect(ArticleMediaCollection.from([]).toPublishable()).toBeNull();
	});

	it("sorts publishable media without mutating the input order", () => {
		const media = [
			{ order: 3, url: "/three.webp" },
			{ order: 1, url: "/one.webp" },
			{ order: 2, url: "/two.webp" },
		] as const;

		const publishable = ArticleMediaCollection.from(media).toPublishable();

		expect(publishable?.count).toBe(3);
		expect(publishable?.sortByOrder().map((item) => item.url)).toEqual([
			"/one.webp",
			"/two.webp",
			"/three.webp",
		]);
		expect(media.map((item) => item.url)).toEqual([
			"/three.webp",
			"/one.webp",
			"/two.webp",
		]);
	});
});

describe("ArticleOwnership", () => {
	it("allows only the article author to manage the article", () => {
		const ownership = ArticleOwnership.of({ authorUserId: 1 });

		expect(ownership.canBeManagedBy(1)).toBe(true);
		expect(ownership.canBeManagedBy(2)).toBe(false);
	});
});
