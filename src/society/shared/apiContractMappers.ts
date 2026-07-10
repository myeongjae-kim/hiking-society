import type {
	ArticleContract,
	ArticleMediaContract,
	CommentContract,
	CurrentUserContract,
	FeedResponseContract,
	HikingContract,
	NotificationContract,
} from "#/api/contracts";
import type {
	ArticleDetailViewModel,
	ArticleMediaItemsViewModel,
	ArticleMediaMetadataViewModel,
	ArticleMediaViewModel,
	ArticleViewModel,
	AuthenticatedUserViewModel,
	CommentViewModel,
	FeedSummaryViewModel,
	HikingArticlesViewModel,
	HikingViewModel,
	NotificationListViewModel,
	NotificationViewModel,
} from "./viewModels";

type ArticleApiModel = Omit<
	ArticleContract,
	"authorProfileImageUrl" | "deletedAt" | "media"
> & {
	readonly authorProfileImageUrl?: string | null;
	readonly deletedAt?: string | null;
	readonly media: readonly ArticleMediaContract[];
};

type CommentApiModel = Omit<
	CommentContract,
	"authorProfileImageUrl" | "deletedAt" | "parentCommentId"
> & {
	readonly authorProfileImageUrl?: string | null;
	readonly deletedAt?: string | null;
	readonly parentCommentId?: string | null;
};

type NotificationApiModel = Omit<
	NotificationContract,
	"actorProfileImageUrl" | "commentId" | "readAt"
> & {
	readonly actorProfileImageUrl?: string | null;
	readonly commentId?: string | null;
	readonly readAt?: string | null;
};

type HikingArticlesResponseApiModel = {
	readonly articles: readonly ArticleApiModel[];
	readonly comments: readonly CommentApiModel[];
};

type ArticleDetailResponseApiModel = {
	readonly article: ArticleApiModel;
	readonly comments: readonly CommentApiModel[];
};

type CommentsResponseApiModel = {
	readonly comments: readonly CommentApiModel[];
};

type NotificationListResponseApiModel = {
	readonly hasMoreNotifications: boolean;
	readonly hasUnreadNotifications: boolean;
	readonly notifications: readonly NotificationApiModel[];
};

type AuthenticatedUserApiModel = CurrentUserContract & {
	readonly lastLoginAt?: Date | string | null;
};

function toOptionalDate(value: Date | string | null | undefined) {
	if (!value) {
		return null;
	}

	return value instanceof Date ? value : new Date(value);
}

export function toAuthenticatedUserViewModel(
	input: AuthenticatedUserApiModel,
): AuthenticatedUserViewModel {
	return {
		displayName: input.displayName,
		email: input.email,
		id: input.id,
		lastLoginAt: toOptionalDate(input.lastLoginAt),
		name: input.name,
		profileImageUrl: input.profileImageUrl,
		provider: input.provider,
		role: input.role,
	};
}

function toArticleMedia(input: ArticleMediaContract): ArticleMediaViewModel {
	return {
		byteSize: input.byteSize,
		contentType: input.contentType,
		durationMs: input.durationMs,
		height: input.height,
		mediaType: input.mediaType,
		metadata: input.metadata as ArticleMediaMetadataViewModel | undefined,
		objectKey: input.objectKey,
		order: input.order,
		thumbnailUrl: input.thumbnailUrl,
		url: input.url,
		width: input.width,
	};
}

function toArticleMediaItems(
	input: readonly ArticleMediaContract[],
): ArticleMediaItemsViewModel {
	const [firstMedia, ...remainingMedia] = input;

	if (!firstMedia) {
		throw new Error("Article contract must contain at least one media item.");
	}

	return [toArticleMedia(firstMedia), ...remainingMedia.map(toArticleMedia)];
}

export function toArticleViewModel(input: ArticleApiModel): ArticleViewModel {
	return {
		authorName: input.authorName,
		authorProfileImageUrl: input.authorProfileImageUrl ?? null,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt,
		deletedAt: input.deletedAt ?? null,
		edited: input.edited,
		hikingId: input.hikingId,
		id: input.id,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		media: toArticleMediaItems(input.media),
		updatedAt: input.updatedAt,
	};
}

export function toCommentViewModel(input: CommentApiModel): CommentViewModel {
	const base = {
		articleId: input.articleId,
		authorName: input.authorName,
		authorProfileImageUrl: input.authorProfileImageUrl ?? null,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt,
		deletedAt: input.deletedAt ?? null,
		id: input.id,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		updatedAt: input.updatedAt,
	};

	if (input.parentCommentId == null) {
		return { ...base, parentCommentId: null };
	}

	return { ...base, parentCommentId: input.parentCommentId };
}

export function toHikingViewModel(input: HikingContract): HikingViewModel {
	return {
		altitude: input.altitude,
		authorName: input.authorName,
		authorUserId: input.authorUserId,
		completedAt: input.completedAt,
		createdAt: input.createdAt,
		hikingDate: input.hikingDate,
		id: input.id,
		latitude: input.latitude,
		longitude: input.longitude,
		mountainName: input.mountainName,
		order: input.order,
		participantsCsv: input.participantsCsv,
		restaurantAddress: input.restaurantAddress,
		startedAt: input.startedAt,
		timezone: input.timezone,
		updatedAt: input.updatedAt,
	};
}

export function toFeedSummaryViewModel(
	input: FeedResponseContract,
): FeedSummaryViewModel {
	return {
		articleCount: input.articleCount,
		commentCount: input.commentCount,
		hikingArticleCounts: input.hikingArticleCounts.map((item) => ({
			articleCount: item.articleCount,
			hikingId: item.hikingId,
		})),
		hikings: input.hikings.map(toHikingViewModel),
	};
}

export function toHikingArticlesSnapshotViewModel(
	input: HikingArticlesResponseApiModel,
): HikingArticlesViewModel {
	return {
		articles: input.articles.map(toArticleViewModel),
		comments: input.comments.map(toCommentViewModel),
	} as const;
}

export function toArticleDetailSnapshotViewModel(
	input: ArticleDetailResponseApiModel,
): Omit<ArticleDetailViewModel, "hiking"> {
	return {
		article: toArticleViewModel(input.article),
		comments: input.comments.map(toCommentViewModel),
	} as const;
}

export function toCommentsSnapshotViewModel(input: CommentsResponseApiModel) {
	return {
		comments: input.comments.map(toCommentViewModel),
	} as const;
}

function toNotificationSummaryViewModel(
	input: NotificationApiModel,
): NotificationViewModel {
	return {
		actorName: input.actorName,
		actorProfileImageUrl: input.actorProfileImageUrl ?? null,
		actorUserId: input.actorUserId,
		articleId: input.articleId,
		commentId: input.commentId == null ? null : input.commentId,
		contentExcerpt: input.contentExcerpt,
		createdAt: input.createdAt,
		id: input.id,
		readAt: input.readAt ?? null,
		type: input.type,
	};
}

export function toNotificationListSnapshotViewModel(
	input: NotificationListResponseApiModel,
): NotificationListViewModel {
	return {
		hasMoreNotifications: input.hasMoreNotifications,
		hasUnreadNotifications: input.hasUnreadNotifications,
		notifications: input.notifications.map(toNotificationSummaryViewModel),
	};
}
