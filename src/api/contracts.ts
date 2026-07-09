export type UserRoleContract = "associate" | "member" | "admin";

export type CurrentUserContract = {
	displayName: string | null;
	email: string;
	id: number;
	name: string | null;
	profileImageUrl: string | null;
	provider: string | null;
	role: UserRoleContract;
};

export type ArticleMediaMetadataContract = {
	dateTime?: string | null;
	exposureTime?: string | null;
	fNumber?: string | null;
	focalLengthIn35mmFilm?: string | null;
	isoSpeedRatings?: string | null;
	make?: string | null;
	model?: string | null;
	shutterSpeedValue?: string | null;
} | null;

export type ArticleMediaContract = {
	byteSize?: number;
	contentType?: string;
	durationMs?: number | null;
	height?: number | null;
	mediaType: "image" | "video";
	metadata?: ArticleMediaMetadataContract;
	objectKey?: string;
	order: number;
	thumbnailUrl?: string | null;
	url: string;
	width?: number | null;
};

export type ArticleContract = {
	authorName: string;
	authorProfileImageUrl: string | null;
	authorUserId?: number;
	body: string;
	createdAt: string;
	deletedAt: string | null;
	edited: boolean;
	hikingId: string;
	id: string;
	likeCount: number;
	likedByCurrentUser: boolean;
	media: ArticleMediaContract[];
	updatedAt: string;
};

export type CommentContract = {
	articleId: string;
	authorName: string;
	authorProfileImageUrl: string | null;
	authorUserId?: number;
	body: string;
	createdAt: string;
	deletedAt: string | null;
	id: string;
	likeCount: number;
	likedByCurrentUser: boolean;
	parentCommentId: string | null;
	updatedAt: string;
};

export type HikingContract = {
	altitude: number | null;
	authorName: string;
	authorUserId?: number;
	completedAt: string;
	createdAt: string;
	hikingDate: string;
	id: string;
	latitude: number;
	longitude: number;
	mountainName: string;
	order: number;
	participantsCsv: string;
	restaurantAddress: string | null;
	startedAt: string;
	timezone: string;
	updatedAt: string;
};

export type NotificationContract = {
	actorName: string;
	actorProfileImageUrl: string | null;
	actorUserId: number;
	articleId: string;
	commentId: string | null;
	contentExcerpt: string;
	createdAt: string;
	id: string;
	readAt: string | null;
	type:
		| "article_created"
		| "article_comment"
		| "article_reply"
		| "comment_reply"
		| "article_like"
		| "comment_like";
};

export type FeedResponseContract = {
	articleCount: number;
	commentCount: number;
	hikingArticleCounts: {
		articleCount: number;
		hikingId: string;
	}[];
	hikings: HikingContract[];
};

export type HikingArticlesResponseContract = {
	articles: ArticleContract[];
	comments: CommentContract[];
};

export type ArticleDetailResponseContract = {
	article: ArticleContract;
	comments: CommentContract[];
};

export type CommentsResponseContract = {
	comments: CommentContract[];
};

export type NotificationListResponseContract = {
	hasMoreNotifications: boolean;
	hasUnreadNotifications: boolean;
	notifications: NotificationContract[];
};

export type MemberContract = {
	createdAt: string;
	displayName: string | null;
	email: string | null;
	id: number;
	lastLoginAt: string | null;
	name: string | null;
	provider: string | null;
	role: UserRoleContract;
};

export type MembersResponseContract = {
	members: MemberContract[];
};

export type ArticleMediaUploadTargetsResponseContract = {
	targets: {
		objectKey: string;
		thumbnail?: {
			objectKey: string;
			uploadUrl: string;
			url: string;
		};
		uploadUrl: string;
		url: string;
	}[];
};

export type ProfileImageUploadTargetResponseContract = {
	objectKey: string;
	uploadUrl: string;
	url: string;
};
