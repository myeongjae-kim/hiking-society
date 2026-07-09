import { applicationError } from "@/core/common/application/ApplicationError";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { UploadOwnershipPolicy } from "@/core/common/domain/UploadOwnershipPolicy";
import { Autowired } from "@/core/config/Autowired";
import type { CreateNotificationsUseCase } from "@/core/notification/application/port/in/CreateNotificationsUseCase";
import type { ArticleMediaUpload } from "../model/ArticleMediaCommand";
import {
	ARTICLE_MEDIA_REQUIRED_MESSAGE,
	ArticleMediaCollection,
	ArticleOwnership,
} from "../domain/ArticlePolicy";
import type { ArticleCommandUseCase } from "./port/in/ArticleCommandUseCase";
import type { ArticleCommandPort } from "./port/out/ArticleCommandPort";

export class ArticleCommandService implements ArticleCommandUseCase {
	constructor(
		@Autowired("ArticleCommandPort")
		private articleCommandPort: ArticleCommandPort,
		@Autowired("CreateNotificationsUseCase")
		private createNotificationsUseCase: CreateNotificationsUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
		@Autowired("S3_PUBLIC_BASE_URL")
		private s3PublicBaseUrl: string,
	) {}

	private assertOwnedUploadedMedia(
		userId: number,
		media: readonly ArticleMediaUpload[],
	) {
		const ownershipPolicy = UploadOwnershipPolicy.forUser({
			objectPrefix: "article-media",
			publicBaseUrl: this.s3PublicBaseUrl,
			userId,
		});

		for (const item of media) {
			if (
				!ownershipPolicy.hasOwnedObjectKey(item.objectKey) ||
				!ownershipPolicy.hasExpectedPublicUrl({
					objectKey: item.objectKey,
					url: item.url,
				})
			) {
				throw applicationError.badRequest("잘못된 업로드 파일입니다.");
			}

			if (
				item.thumbnailUrl &&
				!ownershipPolicy.hasOwnedPublicUrl(item.thumbnailUrl)
			) {
				throw applicationError.badRequest("잘못된 업로드 URL입니다.");
			}
		}
	}

	async create(input: Parameters<ArticleCommandUseCase["create"]>[0]) {
		await this.transactionPort.run(async () => {
			const media = ArticleMediaCollection.from(input.media).toPublishable();

			if (!media) {
				throw applicationError.badRequest(ARTICLE_MEDIA_REQUIRED_MESSAGE);
			}

			this.assertOwnedUploadedMedia(input.authorUserId, input.media);

			const hasActiveHiking = await this.articleCommandPort.hasActiveHiking(
				input.hikingId,
			);

			if (!hasActiveHiking) {
				throw applicationError.notFound("산행을 찾을 수 없습니다.");
			}

			const articleId = await this.articleCommandPort.create({
				authorUserId: input.authorUserId,
				body: input.body,
				hikingId: input.hikingId,
				storedMedia: media.sortByOrder(),
			});
			const recipientUserIds =
				await this.articleCommandPort.listActiveNotificationRecipientIds({
					excludeUserId: input.authorUserId,
				});

			await this.createNotificationsUseCase.createArticleCreated({
				actorUserId: input.authorUserId,
				articleBody: input.body,
				articleId,
				recipientUserIds,
			});
		});
	}

	async update(input: Parameters<ArticleCommandUseCase["update"]>[0]) {
		const media = ArticleMediaCollection.from([
			...input.existingMedia,
			...input.uploadedMedia,
		]).toPublishable();

		if (!media) {
			throw applicationError.badRequest(ARTICLE_MEDIA_REQUIRED_MESSAGE);
		}

		this.assertOwnedUploadedMedia(input.userId, input.uploadedMedia);

		const article = await this.articleCommandPort.findActiveArticleById(
			input.articleId,
		);

		if (
			!article ||
			!ArticleOwnership.of(article).canBeManagedBy(input.userId)
		) {
			throw applicationError.notFound(
				"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}

		const updated = await this.articleCommandPort.update({
			articleId: input.articleId,
			now: new Date(),
			storedMedia: media.sortByOrder(),
			values: {
				body: input.body,
			},
		});

		if (!updated) {
			throw applicationError.notFound(
				"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}
	}

	async delete(input: Parameters<ArticleCommandUseCase["delete"]>[0]) {
		const article = await this.articleCommandPort.findActiveArticleById(
			input.articleId,
		);

		if (
			!article ||
			!ArticleOwnership.of(article).canBeManagedBy(input.userId)
		) {
			throw applicationError.notFound(
				"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}

		const deleted = await this.articleCommandPort.delete({
			articleId: input.articleId,
			now: new Date(),
		});

		if (!deleted) {
			throw applicationError.notFound(
				"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}
	}
}
