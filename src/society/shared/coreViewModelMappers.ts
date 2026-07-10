import type {
	Article,
	ArticleMedia,
	ArticleMediaItems,
} from "@/core/article/domain";
import type { ArticleDetailSnapshot } from "@/core/article/model/ArticleDetailSnapshot";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { Comment } from "@/core/comment/domain";
import type {
	FeedSummarySnapshot,
	HikingArticlesSnapshot,
} from "@/core/feed/model/FeedSnapshot";
import type { Hiking } from "@/core/hiking/domain";
import type {
	NotificationListSnapshot,
	NotificationSummary,
} from "@/core/notification/model/Notification";
import type {
	ArticleDetailViewModel,
	ArticleMediaItemsViewModel,
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

function toArticleMediaViewModel(input: ArticleMedia): ArticleMediaViewModel {
	return {
		byteSize: input.byteSize,
		contentType: input.contentType,
		durationMs: input.durationMs,
		height: input.height,
		mediaType: input.mediaType,
		metadata: input.metadata,
		objectKey: input.objectKey,
		order: input.order,
		thumbnailUrl: input.thumbnailUrl,
		url: input.url,
		width: input.width,
	};
}

function toArticleMediaItemsViewModel(
	input: ArticleMediaItems,
): ArticleMediaItemsViewModel {
	const [firstMedia, ...remainingMedia] = input;
	return [
		toArticleMediaViewModel(firstMedia),
		...remainingMedia.map(toArticleMediaViewModel),
	];
}

export function toAuthenticatedUserViewModel(
	input: AuthenticatedUser,
): AuthenticatedUserViewModel {
	return {
		displayName: input.displayName,
		email: input.email,
		id: input.id,
		lastLoginAt: input.lastLoginAt,
		name: input.name,
		profileImageUrl: input.profileImageUrl,
		provider: input.provider,
		role: input.role,
	};
}

export function toArticleViewModel(input: Article): ArticleViewModel {
	return {
		authorName: input.authorName,
		authorProfileImageUrl: input.authorProfileImageUrl,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt,
		deletedAt: input.deletedAt,
		edited: input.edited,
		hikingId: input.hikingId,
		id: input.id,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		media: toArticleMediaItemsViewModel(input.media),
		updatedAt: input.updatedAt,
	};
}

export function toCommentViewModel(input: Comment): CommentViewModel {
	return {
		articleId: input.articleId,
		authorName: input.authorName,
		authorProfileImageUrl: input.authorProfileImageUrl,
		authorUserId: input.authorUserId,
		body: input.body,
		createdAt: input.createdAt,
		deletedAt: input.deletedAt,
		id: input.id,
		likeCount: input.likeCount,
		likedByCurrentUser: input.likedByCurrentUser,
		parentCommentId: input.parentCommentId,
		updatedAt: input.updatedAt,
	};
}

export function toHikingViewModel(input: Hiking): HikingViewModel {
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
	input: FeedSummarySnapshot,
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
	input: HikingArticlesSnapshot,
): HikingArticlesViewModel {
	return {
		articles: input.articles.map(toArticleViewModel),
		comments: input.comments.map(toCommentViewModel),
	};
}

export function toArticleDetailSnapshotViewModel(
	input: Pick<ArticleDetailSnapshot, "article" | "comments">,
): Omit<ArticleDetailViewModel, "hiking"> {
	return {
		article: toArticleViewModel(input.article),
		comments: input.comments.map(toCommentViewModel),
	};
}

function toNotificationViewModel(
	input: NotificationSummary,
): NotificationViewModel {
	return {
		actorName: input.actorName,
		actorProfileImageUrl: input.actorProfileImageUrl,
		actorUserId: input.actorUserId,
		articleId: input.articleId,
		commentId: input.commentId,
		contentExcerpt: input.contentExcerpt,
		createdAt: input.createdAt,
		id: input.id,
		readAt: input.readAt,
		type: input.type,
	};
}

export function toNotificationListSnapshotViewModel(
	input: NotificationListSnapshot,
): NotificationListViewModel {
	return {
		hasMoreNotifications: input.hasMoreNotifications,
		hasUnreadNotifications: input.hasUnreadNotifications,
		notifications: input.notifications.map(toNotificationViewModel),
	};
}
