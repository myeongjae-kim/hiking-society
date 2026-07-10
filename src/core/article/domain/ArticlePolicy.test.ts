import { describe, expect, it } from "vitest";
import type { HikingId } from "@/core/hiking/domain";
import { ArticleBody, ArticleDraft, ArticleEntity } from "./Article";
import type { ArticleId } from "./Article";
import {
	ArticleMediaCollection,
	UploadedArticleMediaOwnership,
} from "@/core/article/domain/ArticlePolicy";

const articleId = "7" as ArticleId;
const hikingId = "3" as HikingId;

function expectPresent<T>(value: T | null) {
	expect(value).not.toBeNull();

	if (value === null) {
		throw new Error("Expected value to be present.");
	}

	return value;
}

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
		const article = ArticleEntity.rehydrate({
			authorUserId: 1,
			body: "정상에서 찍은 사진",
			hikingId,
			id: articleId,
		});

		expect(article.canBeManagedBy(1)).toBe(true);
		expect(article.canBeManagedBy(2)).toBe(false);
	});

	it("plans updates and deletes only for the article author", () => {
		const body = expectPresent(ArticleBody.from(" 수정한 글 "));
		const media = expectPresent(
			ArticleMediaCollection.from([
				{ order: 2, url: "/two.webp" },
				{ order: 1, url: "/one.webp" },
			]).toPublishable(),
		);
		const article = ArticleEntity.rehydrate({
			authorUserId: 1,
			body: "기존 글",
			hikingId,
			id: articleId,
		});

		expect(
			article.planUpdate({
				body,
				media,
				userId: 1,
			}),
		).toEqual({
			articleId,
			body: "수정한 글",
			storedMedia: [
				{ order: 1, url: "/one.webp" },
				{ order: 2, url: "/two.webp" },
			],
		});
		expect(
			article.planUpdate({
				body,
				media,
				userId: 2,
			}),
		).toBeNull();
		expect(article.planDelete({ userId: 1 })).toEqual({ articleId });
		expect(article.planDelete({ userId: 2 })).toBeNull();
	});
});

describe("ArticleDraft", () => {
	it("normalizes body text and exposes a create command", () => {
		const body = expectPresent(ArticleBody.from(" 새 글 "));
		const media = expectPresent(
			ArticleMediaCollection.from([
				{ order: 2, url: "/two.webp" },
				{ order: 1, url: "/one.webp" },
			]).toPublishable(),
		);

		const draft = ArticleDraft.create({
			authorUserId: 1,
			body,
			hikingId,
			media,
		});

		expect(draft.toCreateCommand()).toEqual({
			authorUserId: 1,
			body: "새 글",
			hikingId,
			storedMedia: [
				{ order: 1, url: "/one.webp" },
				{ order: 2, url: "/two.webp" },
			],
		});
		expect(draft.toArticleCreatedNotification(articleId)).toEqual({
			actorUserId: 1,
			articleBody: "새 글",
			articleId,
		});
	});

	it("rejects blank article bodies", () => {
		expect(ArticleBody.from("   ")).toBeNull();
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
