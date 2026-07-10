import type { CommentViewId as CommentId, CommentViewModel as Comment } from "#/society/shared/viewModels";

export function getThreadedComments(comments: readonly Comment[]) {
	const repliesByParentId = new Map<CommentId, Comment[]>();
	const topLevelComments: Comment[] = [];

	for (const comment of comments) {
		if (comment.parentCommentId === null) {
			topLevelComments.push(comment);
			continue;
		}

		const replies = repliesByParentId.get(comment.parentCommentId) ?? [];
		replies.push(comment);
		repliesByParentId.set(comment.parentCommentId, replies);
	}

	return {
		repliesByParentId,
		topLevelComments,
	};
}

export function getVisibleCommentCount(comments: readonly Comment[]) {
	return comments.filter((comment) => comment.deletedAt === null).length;
}
