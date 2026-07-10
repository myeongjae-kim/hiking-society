import type {
	ArticleContract,
	ArticleMediaContract,
	CommentContract,
	HikingContract,
	NotificationContract,
} from "#/api/contracts";
import type {
	Article,
	ArticleId,
	ArticleMedia,
	ArticleMediaItems,
	ArticleMediaMetadataSummary,
} from "@/core/article/domain";
import type { Comment, CommentId } from "@/core/comment/domain";
import type {
	Altitude,
	AuthorName,
	IsoDateString,
	IsoDateTimeString,
	Latitude,
	Longitude,
	Timezone,
} from "@/core/common/domain";
import type { Hiking, HikingId } from "@/core/hiking/domain";
import type {
	NotificationId,
	NotificationListSnapshot,
	NotificationSummary,
} from "@/core/notification/model/Notification";

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

function toArticleMedia(input: ArticleMediaContract): ArticleMedia {
	return {
		byteSize: input.byteSize,
		contentType: input.contentType,
		durationMs: input.durationMs,
		height: input.height,
		mediaType: input.mediaType,
		metadata: input.metadata as ArticleMediaMetadataSummary | undefined,
		objectKey: input.objectKey,
		order: input.order,
		thumbnailUrl: input.thumbnailUrl,
		url: input.url,
		width: input.width,
	};
}

function toArticleMediaItems(
	input: readonly ArticleMediaContract[],
): ArticleMediaItems {
	const [firstMedia, ...remainingMedia] = input;

	if (!firstMedia) {
		throw new Error("Article contract must contain at least one media item.");
	}

	return [toArticleMedia(firstMedia), ...remainingMedia.map(toArticleMedia)];
}

export function toArticleViewModel(input: ArticleApiModel): Article {
	return {
		authorName: input.authorName as AuthorName,
		authorProfileImageUrl: input.authorProfileImageUrl ?? null,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt as IsoDateTimeString,
		deletedAt: (input.deletedAt ?? null) as IsoDateTimeString | null,
		edited: input.edited,
		hikingId: input.hikingId as HikingId,
		id: input.id as ArticleId,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		media: toArticleMediaItems(input.media),
		updatedAt: input.updatedAt as IsoDateTimeString,
	};
}

export function toCommentViewModel(input: CommentApiModel): Comment {
	const base = {
		articleId: input.articleId as ArticleId,
		authorName: input.authorName as AuthorName,
		authorProfileImageUrl: input.authorProfileImageUrl ?? null,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt as IsoDateTimeString,
		deletedAt: (input.deletedAt ?? null) as IsoDateTimeString | null,
		id: input.id as CommentId,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		updatedAt: input.updatedAt as IsoDateTimeString,
	};

	if (input.parentCommentId == null) {
		return { ...base, parentCommentId: null };
	}

	return { ...base, parentCommentId: input.parentCommentId as CommentId };
}

export function toHikingViewModel(input: HikingContract): Hiking {
	return {
		altitude: input.altitude as Altitude | null,
		authorName: input.authorName as AuthorName,
		authorUserId: input.authorUserId,
		completedAt: input.completedAt as IsoDateTimeString,
		createdAt: input.createdAt as IsoDateTimeString,
		hikingDate: input.hikingDate as IsoDateString,
		id: input.id as HikingId,
		latitude: input.latitude as Latitude,
		longitude: input.longitude as Longitude,
		mountainName: input.mountainName,
		order: input.order,
		participantsCsv: input.participantsCsv,
		restaurantAddress: input.restaurantAddress,
		startedAt: input.startedAt as IsoDateTimeString,
		timezone: input.timezone as Timezone,
		updatedAt: input.updatedAt as IsoDateTimeString,
	};
}

export function toHikingArticlesSnapshotViewModel(
	input: HikingArticlesResponseApiModel,
) {
	return {
		articles: input.articles.map(toArticleViewModel),
		comments: input.comments.map(toCommentViewModel),
	} as const;
}

export function toArticleDetailSnapshotViewModel(
	input: ArticleDetailResponseApiModel,
) {
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
): NotificationSummary {
	return {
		actorName: input.actorName as AuthorName,
		actorProfileImageUrl: input.actorProfileImageUrl ?? null,
		actorUserId: input.actorUserId,
		articleId: input.articleId as ArticleId,
		commentId: input.commentId == null ? null : (input.commentId as CommentId),
		contentExcerpt: input.contentExcerpt,
		createdAt: input.createdAt as IsoDateTimeString,
		id: input.id as NotificationId,
		readAt: (input.readAt ?? null) as NotificationSummary["readAt"],
		type: input.type,
	};
}

export function toNotificationListSnapshotViewModel(
	input: NotificationListResponseApiModel,
): NotificationListSnapshot {
	return {
		hasMoreNotifications: input.hasMoreNotifications,
		hasUnreadNotifications: input.hasUnreadNotifications,
		notifications: input.notifications.map(toNotificationSummaryViewModel),
	};
}
