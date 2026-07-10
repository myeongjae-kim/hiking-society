export type ArticleViewId = string;
export type CommentViewId = string;
export type HikingViewId = string;
export type NotificationViewId = string;

export type AuthorNameView = string;
export type IsoDateStringView = string;
export type IsoDateTimeStringView = string;
export type TimezoneView = string;

export type UserRoleView = "associate" | "member" | "admin";

export type AuthenticatedUserViewModel = {
	readonly displayName: string | null;
	readonly email: string;
	readonly id: number;
	readonly lastLoginAt: Date | null;
	readonly name: string | null;
	readonly profileImageUrl: string | null;
	readonly provider: string | null;
	readonly role: UserRoleView;
};

export type ArticleMediaMetadataViewModel = {
	readonly dateTime?: string | null;
	readonly exposureTime?: string | null;
	readonly fNumber?: string | null;
	readonly focalLengthIn35mmFilm?: string | null;
	readonly isoSpeedRatings?: string | null;
	readonly make?: string | null;
	readonly model?: string | null;
	readonly shutterSpeedValue?: string | null;
};

export type ArticleMediaViewModel = {
	readonly byteSize?: number;
	readonly contentType?: string;
	readonly durationMs?: number | null;
	readonly height?: number | null;
	readonly mediaType: "image" | "video";
	readonly metadata?: ArticleMediaMetadataViewModel | null;
	readonly objectKey?: string;
	readonly order: number;
	readonly thumbnailUrl?: string | null;
	readonly url: string;
	readonly width?: number | null;
};

export type ArticleMediaItemsViewModel = readonly [
	ArticleMediaViewModel,
	...ArticleMediaViewModel[],
];

export type ArticleViewModel = {
	readonly id: ArticleViewId;
	readonly authorUserId?: number;
	readonly hikingId: HikingViewId;
	readonly media: ArticleMediaItemsViewModel;
	readonly body: string;
	readonly authorName: AuthorNameView;
	readonly authorProfileImageUrl: string | null;
	readonly likeCount: number;
	readonly likedByCurrentUser: boolean;
	readonly createdAt: IsoDateTimeStringView;
	readonly updatedAt: IsoDateTimeStringView;
	readonly deletedAt: IsoDateTimeStringView | null;
	readonly edited: boolean;
};

export type CommentViewModel = {
	readonly id: CommentViewId;
	readonly authorUserId?: number;
	readonly articleId: ArticleViewId;
	readonly body: string;
	readonly authorName: AuthorNameView;
	readonly authorProfileImageUrl: string | null;
	readonly likeCount: number;
	readonly likedByCurrentUser: boolean;
	readonly createdAt: IsoDateTimeStringView;
	readonly updatedAt: IsoDateTimeStringView;
	readonly deletedAt: IsoDateTimeStringView | null;
	readonly parentCommentId: CommentViewId | null;
};

export type HikingViewModel = {
	readonly id: HikingViewId;
	readonly authorUserId?: number;
	readonly mountainName: string;
	readonly hikingDate: IsoDateStringView;
	readonly timezone: TimezoneView;
	readonly latitude: number;
	readonly longitude: number;
	readonly altitude: number | null;
	readonly order: number;
	readonly startedAt: IsoDateTimeStringView;
	readonly completedAt: IsoDateTimeStringView;
	readonly participantsCsv: string;
	readonly restaurantAddress: string | null;
	readonly authorName: AuthorNameView;
	readonly createdAt: IsoDateTimeStringView;
	readonly updatedAt: IsoDateTimeStringView;
};

export type FeedSummaryViewModel = {
	readonly articleCount: number;
	readonly commentCount: number;
	readonly hikingArticleCounts: readonly {
		readonly articleCount: number;
		readonly hikingId: HikingViewId;
	}[];
	readonly hikings: readonly HikingViewModel[];
};

export type HikingArticlesViewModel = {
	readonly articles: readonly ArticleViewModel[];
	readonly comments: readonly CommentViewModel[];
};

export type ArticleDetailViewModel = {
	readonly article: ArticleViewModel;
	readonly comments: readonly CommentViewModel[];
	readonly hiking: HikingViewModel;
};

export type NotificationTypeView =
	| "article_created"
	| "article_comment"
	| "article_reply"
	| "comment_reply"
	| "article_like"
	| "comment_like";

export type NotificationViewModel = {
	readonly actorName: AuthorNameView;
	readonly actorProfileImageUrl: string | null;
	readonly actorUserId: number;
	readonly articleId: ArticleViewId;
	readonly commentId: CommentViewId | null;
	readonly contentExcerpt: string;
	readonly createdAt: IsoDateTimeStringView;
	readonly id: NotificationViewId;
	readonly readAt: IsoDateTimeStringView | null;
	readonly type: NotificationTypeView;
};

export type NotificationListViewModel = {
	readonly hasMoreNotifications: boolean;
	readonly hasUnreadNotifications: boolean;
	readonly notifications: readonly NotificationViewModel[];
};
