import type { ArticleId } from "@/core/article/domain";
import type {
	AuthorName,
	Brand,
	IsoDateTimeString,
} from "@/core/common/domain";

export type CommentId = Brand<string, "CommentId">;
export const COMMENT_BODY_REQUIRED_MESSAGE = "댓글 내용을 입력해주세요.";

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
	readonly id: CommentId;
	readonly parentCommentId: CommentId | null;
};

export class CommentBody {
	private constructor(private readonly value: string) {}

	static from(value: string) {
		const normalized = value.trim();

		if (normalized.length === 0) {
			return null;
		}

		return new CommentBody(normalized);
	}

	toString() {
		return this.value;
	}
}

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

	planReplyFor(articleId: ArticleId) {
		if (!this.canReceiveReplyFor(articleId)) {
			return null;
		}

		return {
			parentCommentAuthorUserId: this.snapshot.authorUserId,
			parentCommentId: this.snapshot.id,
		};
	}

	planUpdate(input: { readonly body: CommentBody; readonly userId: number }) {
		if (!this.canBeManagedBy(input.userId)) {
			return null;
		}

		return {
			body: input.body.toString(),
			commentId: this.snapshot.id,
		};
	}

	planDelete(input: {
		readonly deletedBody: CommentBody;
		readonly userId: number;
	}) {
		if (!this.canBeManagedBy(input.userId)) {
			return null;
		}

		return {
			body: input.deletedBody.toString(),
			commentId: this.snapshot.id,
		};
	}
}
