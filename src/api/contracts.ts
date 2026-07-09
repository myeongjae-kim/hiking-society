import type { Article } from "@/core/article/domain";
import type { ArticleMediaUploadTarget } from "@/core/article/application/port/in/ArticleMediaUploadUseCase";
import type { ArticleDetailSnapshot } from "@/core/article/model/ArticleDetailSnapshot";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { Comment } from "@/core/comment/domain";
import type {
	FeedSummarySnapshot,
	HikingArticlesSnapshot,
} from "@/core/feed/model/FeedSnapshot";
import type { Hiking } from "@/core/hiking/domain";
import type { MemberListItem } from "@/core/member/model/MemberListItem";
import type {
	Notification,
	NotificationListSnapshot,
} from "@/core/notification/model/Notification";
import type { ProfileImageUploadTarget } from "@/core/profile/application/port/in/ProfileImageUploadUseCase";

// core 모델 타입을 JSON API 응답 형태로 변환하고,
// Zod 스키마가 해당 계약을 만족하는지 컴파일 타임에 확인하게 해준다.
// Date는 string으로, 배열은 항목 타입을 재귀 변환한 배열로,
// 객체는 readonly를 제거한 뒤 각 필드를 재귀 변환한다.
type ApiContract<T> = T extends Date
	? string
	: T extends string
		? string
		: T extends number
			? number
			: T extends boolean
				? boolean
				: T extends null
					? null
					: T extends undefined
						? undefined
						: T extends readonly (infer TItem)[]
							? ApiContract<TItem>[]
							: T extends object
								? { -readonly [TKey in keyof T]: ApiContract<T[TKey]> }
								: T;

export type CurrentUserContract = Omit<
	ApiContract<AuthenticatedUser>,
	"lastLoginAt"
>;
export type ArticleContract = ApiContract<Article>;
export type CommentContract = ApiContract<Comment>;
export type HikingContract = ApiContract<Hiking>;
export type FeedResponseContract = ApiContract<FeedSummarySnapshot>;
export type HikingArticlesResponseContract =
	ApiContract<HikingArticlesSnapshot>;
export type ArticleDetailResponseContract = ApiContract<
	Pick<ArticleDetailSnapshot, "article" | "comments">
>;
export type CommentsResponseContract = {
	comments: CommentContract[];
};
export type NotificationContract = ApiContract<Notification>;
export type NotificationListResponseContract =
	ApiContract<NotificationListSnapshot>;
export type MemberContract = ApiContract<MemberListItem>;
export type MembersResponseContract = {
	members: MemberContract[];
};
export type ArticleMediaUploadTargetsResponseContract = {
	targets: ApiContract<ArticleMediaUploadTarget>[];
};
export type ProfileImageUploadTargetResponseContract =
	ApiContract<ProfileImageUploadTarget>;
