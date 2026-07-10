import { applicationError } from "@/core/common/application/ApplicationError";
import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { UploadOwnershipPolicy } from "@/core/common/domain/UploadOwnershipPolicy";
import { Autowired } from "@/core/config/Autowired";
import type { CreateNotificationsUseCase } from "@/core/notification/application/port/in/CreateNotificationsUseCase";
import {
	ARTICLE_BODY_REQUIRED_MESSAGE,
	ArticleBody,
	ArticleDraft,
	ArticleEntity,
	ARTICLE_MEDIA_REQUIRED_MESSAGE,
	ArticleMediaCollection,
	UploadedArticleMediaOwnership,
} from "../domain";
import type { ArticleMediaCollection as ArticleMediaCollectionType } from "../domain/ArticlePolicy";
import type { ArticleMediaUpload } from "../model/ArticleMediaCommand";
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
		@Autowired("PUBLIC_MEDIA_BASE_URL")
		private publicMediaBaseUrl: string,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	private assertOwnedUploadedMedia(
		userId: number,
		media: readonly ArticleMediaUpload[],
	) {
		const ownershipPolicy = UploadOwnershipPolicy.forUser({
			objectPrefix: "article-media",
			publicBaseUrl: this.publicMediaBaseUrl,
			userId,
		});
		const violation = UploadedArticleMediaOwnership.of({
			media,
			ownershipPolicy,
		}).findViolation();

		if (violation === "uploaded-media") {
			throw applicationError.badRequest("잘못된 업로드 파일입니다.");
		}

		if (violation === "thumbnail-url") {
			throw applicationError.badRequest("잘못된 업로드 URL입니다.");
		}
	}

	private requireArticleBody(body: string) {
		const articleBody = ArticleBody.from(body);

		if (!articleBody) {
			throw applicationError.badRequest(ARTICLE_BODY_REQUIRED_MESSAGE);
		}

		return articleBody;
	}

	private requirePublishableMedia<TMedia>(
		mediaCollection: ArticleMediaCollectionType<TMedia>,
	) {
		const media = mediaCollection.toPublishable();

		if (!media) {
			throw applicationError.badRequest(ARTICLE_MEDIA_REQUIRED_MESSAGE);
		}

		return media;
	}

	async create(input: Parameters<ArticleCommandUseCase["create"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const body = this.requireArticleBody(input.body);
				const media = this.requirePublishableMedia(
					ArticleMediaCollection.from(input.media),
				);
				const draft = ArticleDraft.create({
					authorUserId: input.authorUserId,
					body,
					hikingId: input.hikingId,
					media,
				});

				this.assertOwnedUploadedMedia(input.authorUserId, input.media);

				const hasActiveHiking = await this.articleCommandPort.hasActiveHiking(
					draft.hikingId,
				);

				if (!hasActiveHiking) {
					throw applicationError.notFound("산행을 찾을 수 없습니다.");
				}

				const articleId = await this.articleCommandPort.create(
					draft.toCreateCommand(),
				);
				const recipientUserIds =
					await this.articleCommandPort.listActiveNotificationRecipientIds({
						excludeUserId: draft.authorUserId,
					});

				await this.createNotificationsUseCase.createArticleCreated({
					...draft.toArticleCreatedNotification(articleId),
					recipientUserIds,
				});
			},
			{ readOnly: false },
		);
	}

	async update(input: Parameters<ArticleCommandUseCase["update"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const body = this.requireArticleBody(input.body);
				const media = this.requirePublishableMedia(
					ArticleMediaCollection.from([
						...input.existingMedia,
						...input.uploadedMedia,
					]),
				);

				this.assertOwnedUploadedMedia(input.userId, input.uploadedMedia);

				const article = await this.articleCommandPort.findActiveArticleById(
					input.articleId,
				);

				const updatePlan = article
					? ArticleEntity.rehydrate(article).planUpdate({
							body,
							media,
							userId: input.userId,
						})
					: null;

				if (!updatePlan) {
					throw applicationError.notFound(
						"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
					);
				}

				const updated = await this.articleCommandPort.update({
					articleId: updatePlan.articleId,
					now: this.clockPort.now(),
					storedMedia: updatePlan.storedMedia,
					values: {
						body: updatePlan.body,
					},
				});

				if (!updated) {
					throw applicationError.notFound(
						"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}

	async delete(input: Parameters<ArticleCommandUseCase["delete"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const article = await this.articleCommandPort.findActiveArticleById(
					input.articleId,
				);

				const deletePlan = article
					? ArticleEntity.rehydrate(article).planDelete({
							userId: input.userId,
						})
					: null;

				if (!deletePlan) {
					throw applicationError.notFound(
						"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
					);
				}

				const deleted = await this.articleCommandPort.delete({
					articleId: deletePlan.articleId,
					now: this.clockPort.now(),
				});

				if (!deleted) {
					throw applicationError.notFound(
						"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}
}
