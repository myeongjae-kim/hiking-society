import type {
	CommentId,
	CreateCommentInput,
	CreateReplyInput,
	UpdateCommentInput,
} from "@/core/comment/domain";

export interface CommentCommandUseCase {
	create(input: CreateCommentInput | CreateReplyInput): Promise<void>;
	update(input: {
		commentId: CommentId;
		userId: number;
		values: UpdateCommentInput;
	}): Promise<void>;
	delete(input: { commentId: CommentId; userId: number }): Promise<void>;
}
