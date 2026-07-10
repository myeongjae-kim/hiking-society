import type { ArticleId } from "@/core/article/domain";
import type {
	AuthorName,
	Brand,
	IsoDateTimeString,
} from "@/core/common/domain";

export type CommentId = Brand<string, "CommentId">;

type CommentBase = {
	readonly id: CommentId;
	readonly authorUserId?: number;
	readonly articleId: ArticleId;
	readonly body: string;
	readonly authorName: AuthorName;
	readonly authorProfileImageUrl: string | null;
	readonly likeCount: number;
	readonly likedByCurrentUser: boolean;
	readonly createdAt: IsoDateTimeString;
	readonly updatedAt: IsoDateTimeString;
	readonly deletedAt: IsoDateTimeString | null;
};

export type TopLevelComment = CommentBase & {
	readonly parentCommentId: null;
};

export type ReplyComment = CommentBase & {
	readonly parentCommentId: CommentId;
};

export type Comment = TopLevelComment | ReplyComment;

export type CreateCommentInput = {
	readonly articleId: ArticleId;
	readonly authorUserId: number;
	readonly body: string;
};

export type CreateReplyInput = {
	readonly articleId: ArticleId;
	readonly authorUserId: number;
	readonly parentCommentId: CommentId;
	readonly body: string;
};

export type UpdateCommentInput = {
	readonly body?: string;
};

export type CommentEntitySnapshot = {
	readonly articleId: ArticleId;
	readonly authorUserId: number;
	readonly deleted: boolean;
	readonly parentCommentId: CommentId | null;
};

export class CommentEntity {
	private constructor(private readonly snapshot: CommentEntitySnapshot) {}

	static rehydrate(snapshot: CommentEntitySnapshot) {
		return new CommentEntity(snapshot);
	}

	canBeManagedBy(userId: number) {
		return this.snapshot.authorUserId === userId;
	}

	canReceiveReplyFor(articleId: ArticleId) {
		return (
			this.snapshot.articleId === articleId &&
			!this.snapshot.deleted &&
			this.snapshot.parentCommentId === null
		);
	}
}
