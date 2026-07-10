import { describe, expect, it } from "vitest";
import { ArticleEntity } from "./Article";
import {
	ArticleMediaCollection,
	UploadedArticleMediaOwnership,
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

describe("ArticleEntity", () => {
	it("allows only the article author to manage the article", () => {
		const article = ArticleEntity.rehydrate({ authorUserId: 1 });

		expect(article.canBeManagedBy(1)).toBe(true);
		expect(article.canBeManagedBy(2)).toBe(false);
	});
});

describe("UploadedArticleMediaOwnership", () => {
	const ownershipPolicy = {
		hasExpectedPublicUrl: ({
			objectKey,
			url,
		}: {
			objectKey: string;
			url: string;
		}) => url === `https://cdn.example.com/${objectKey}`,
		hasOwnedObjectKey: (objectKey: string) =>
			objectKey.startsWith("article-media/users/1/"),
		hasOwnedPublicUrl: (url: string) =>
			url.startsWith("https://cdn.example.com/article-media/users/1/"),
	};

	it("accepts uploaded media owned by the current user", () => {
		const ownership = UploadedArticleMediaOwnership.of({
			media: [
				{
					objectKey: "article-media/users/1/2026-07-10/photo.webp",
					thumbnailUrl:
						"https://cdn.example.com/article-media/users/1/2026-07-10/thumb.webp",
					url: "https://cdn.example.com/article-media/users/1/2026-07-10/photo.webp",
				},
			],
			ownershipPolicy,
		});

		expect(ownership.findViolation()).toBeNull();
	});

	it("reports object ownership and thumbnail URL violations separately", () => {
		expect(
			UploadedArticleMediaOwnership.of({
				media: [
					{
						objectKey: "article-media/users/2/2026-07-10/photo.webp",
						url: "https://cdn.example.com/article-media/users/2/2026-07-10/photo.webp",
					},
				],
				ownershipPolicy,
			}).findViolation(),
		).toBe("uploaded-media");

		expect(
			UploadedArticleMediaOwnership.of({
				media: [
					{
						objectKey: "article-media/users/1/2026-07-10/photo.webp",
						thumbnailUrl:
							"https://cdn.example.com/article-media/users/2/2026-07-10/thumb.webp",
						url: "https://cdn.example.com/article-media/users/1/2026-07-10/photo.webp",
					},
				],
				ownershipPolicy,
			}).findViolation(),
		).toBe("thumbnail-url");
	});
});
