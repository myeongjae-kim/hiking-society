"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { $api } from "#/api/client/$api";
import { apiQueryKeys } from "#/api/client/queryKeys";
import type { Article, ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";
import type { HikingId } from "@/core/hiking/domain";

import type { LikePendingKey } from "../utils/feedCrudTypes";
import type { FeedActionDeps } from "./feedActionTypes";

type UseFeedLikeActionsInput = Pick<
	FeedActionDeps,
	"invalidateQueryKeys" | "runner"
> & {
	articleHikingIdByArticleId: Map<ArticleId, HikingId>;
	commentArticleIdByCommentId: Map<CommentId, ArticleId>;
	refreshArticleComments: (articleId: ArticleId) => Promise<boolean>;
	setArticlesByHikingId: Dispatch<
		SetStateAction<Record<string, readonly Article[]>>
	>;
};

export function useFeedLikeActions({
	articleHikingIdByArticleId,
	commentArticleIdByCommentId,
	invalidateQueryKeys,
	refreshArticleComments,
	runner,
	setArticlesByHikingId,
}: UseFeedLikeActionsInput) {
	const toggleArticleLikeMutation = $api.useMutation(
		"post",
		"/api/articles/{articleId}/like",
	);
	const toggleCommentLikeMutation = $api.useMutation(
		"post",
		"/api/comments/{commentId}/like",
	);
	const [pendingLikeByKey, setPendingLikeByKey] = useState<
		Record<string, boolean>
	>({});

	const setLikePending = (key: LikePendingKey, pending: boolean) => {
		setPendingLikeByKey((currentPending) => {
			const nextPending = { ...currentPending };

			if (pending) {
				nextPending[key] = true;
			} else {
				delete nextPending[key];
			}

			return nextPending;
		});
	};

	const applyArticleLikeToggle = (articleId: ArticleId) => {
		const hikingId = articleHikingIdByArticleId.get(articleId);

		if (!hikingId) {
			throw new Error("좋아요를 갱신할 글을 찾을 수 없습니다.");
		}

		setArticlesByHikingId((currentArticles) => {
			const hikingArticles = currentArticles[hikingId];

			if (!hikingArticles) {
				return currentArticles;
			}

			return {
				...currentArticles,
				[hikingId]: hikingArticles.map((article) => {
					if (article.id !== articleId) {
						return article;
					}

					const likedByCurrentUser = !article.likedByCurrentUser;

					return {
						...article,
						likedByCurrentUser,
						likeCount: Math.max(
							0,
							article.likeCount + (likedByCurrentUser ? 1 : -1),
						),
					};
				}),
			};
		});
	};

	const toggleArticleLike = (articleId: ArticleId) => {
		const likePendingKey = `article-${articleId}` as LikePendingKey;
		const hikingId = articleHikingIdByArticleId.get(articleId);

		setLikePending(likePendingKey, true);
		runner.runMutation(
			{
				errorKey: `article-${articleId}`,
				onSettled: () => setLikePending(likePendingKey, false),
			},
			async () => {
				await toggleArticleLikeMutation.mutateAsync({
					params: { path: { articleId } },
				});
				applyArticleLikeToggle(articleId);
				invalidateQueryKeys([
					apiQueryKeys.articleDetail(articleId),
					...(hikingId ? [apiQueryKeys.hikingArticles(hikingId)] : []),
				]);
			},
		);
	};

	const toggleCommentLike = (commentId: CommentId) => {
		const articleId = commentArticleIdByCommentId.get(commentId);

		if (!articleId) {
			runner.setError(
				`comment-${commentId}`,
				"댓글을 갱신할 글을 찾을 수 없습니다.",
			);
			return;
		}

		const likePendingKey = `comment-${commentId}` as LikePendingKey;

		setLikePending(likePendingKey, true);
		runner.runMutation(
			{
				errorKey: `comment-${commentId}`,
				onSettled: () => setLikePending(likePendingKey, false),
			},
			async () => {
				await toggleCommentLikeMutation.mutateAsync({
					params: { path: { commentId } },
				});
				await refreshArticleComments(articleId);
				invalidateQueryKeys([apiQueryKeys.articleComments(articleId)]);
			},
		);
	};

	return {
		isCommentLikePending: (commentId: CommentId) =>
			pendingLikeByKey[`comment-${commentId}`] === true,
		pendingLikeByKey,
		toggleArticleLike,
		toggleCommentLike,
	};
}
