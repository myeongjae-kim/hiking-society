import type {
	Article,
	ArticleId,
	ArticleMedia,
	ArticleMediaItems,
	ArticleMediaMetadataSummary,
} from "@/core/article/domain";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { Comment, CommentId } from "@/core/comment/domain";
import type {
	AuthorName,
	IsoDateString,
	IsoDateTimeString,
	Timezone,
} from "@/core/common/domain";
import type {
	FeedSummarySnapshot,
	HikingArticlesSnapshot,
} from "@/core/feed/model/FeedSnapshot";
import type { Hiking, HikingId } from "@/core/hiking/domain";
import type {
	NotificationListSnapshot,
	NotificationSummary,
	NotificationType,
	NotificationId,
} from "@/core/notification/model/Notification";

export type ArticleViewId = ArticleId;
export type CommentViewId = CommentId;
export type HikingViewId = HikingId;
export type NotificationViewId = NotificationId;

export type AuthorNameView = AuthorName;
export type IsoDateStringView = IsoDateString;
export type IsoDateTimeStringView = IsoDateTimeString;
export type TimezoneView = Timezone;

export type UserRoleView = AuthenticatedUser["role"];

export type AuthenticatedUserViewModel = AuthenticatedUser;

export type ArticleMediaMetadataViewModel = ArticleMediaMetadataSummary;
export type ArticleMediaViewModel = ArticleMedia;
export type ArticleMediaItemsViewModel = ArticleMediaItems;
export type ArticleViewModel = Article;

export type CommentViewModel = Comment;
export type HikingViewModel = Hiking;

export type FeedSummaryViewModel = FeedSummarySnapshot;
export type HikingArticlesViewModel = HikingArticlesSnapshot;

export type ArticleDetailViewModel = {
	readonly article: Article;
	readonly comments: readonly Comment[];
	readonly hiking: Hiking;
};

export type NotificationTypeView = NotificationType;
export type NotificationViewModel = NotificationSummary;
export type NotificationListViewModel = NotificationListSnapshot;
