'use client';

import { useState } from 'react';

import { $api } from '@/app/common/api/$api';
import { apiQueryKeys } from '@/app/common/api/queryKeys';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { ArticleId } from '@/core/article/domain';

import {
  getCommentCreateSingleFlightKey,
  getCommentUpdateSingleFlightKey,
} from '../utils/feedCrudTypes';
import type { FeedActionDeps } from './feedActionTypes';

type UseFeedCommentActionsInput = FeedActionDeps & {
  adjustVisibleCommentCount: (delta: number) => void;
  commentArticleIdByCommentId: Map<CommentId, ArticleId>;
  editingCommentId: CommentId | null;
  refreshArticleComments: (articleId: ArticleId) => Promise<boolean>;
  replyingCommentId: CommentId | null;
  setEditingCommentId: (commentId: CommentId | null) => void;
  setReplyingCommentId: (commentId: CommentId | null) => void;
};

export function useFeedCommentActions({
  adjustVisibleCommentCount,
  commentArticleIdByCommentId,
  editingCommentId,
  invalidateQueryKeys,
  refreshArticleComments,
  replyingCommentId,
  runner,
  setEditingCommentId,
  setConfirmState,
  setReplyingCommentId,
}: UseFeedCommentActionsInput) {
  const createCommentMutation = $api.useMutation('post', '/api/articles/{articleId}/comments');
  const updateCommentMutation = $api.useMutation('patch', '/api/comments/{commentId}');
  const deleteCommentMutation = $api.useMutation('delete', '/api/comments/{commentId}');
  const [commentFormResetKeyByArticleId, setCommentFormResetKeyByArticleId] = useState<
    Record<string, number>
  >({});

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    runner.runMutation(
      {
        errorKey: `comment-new-${articleId}`,
        singleFlightKey: getCommentCreateSingleFlightKey(articleId, parentCommentId),
      },
      async () => {
        await createCommentMutation.mutateAsync({
          body: { body, parentCommentId },
          params: { path: { articleId } },
        });
        await refreshArticleComments(articleId);
        adjustVisibleCommentCount(1);

        if (parentCommentId === null) {
          setCommentFormResetKeyByArticleId((currentKeys) => ({
            ...currentKeys,
            [articleId]: (currentKeys[articleId] ?? 0) + 1,
          }));
        }

        setReplyingCommentId(null);
        invalidateQueryKeys([
          apiQueryKeys.articleComments(articleId),
          apiQueryKeys.notifications(),
        ]);
      },
    );
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const articleId = commentArticleIdByCommentId.get(commentId);

    if (!articleId) {
      runner.setError(`comment-edit-${commentId}`, '댓글을 갱신할 글을 찾을 수 없습니다.');
      return;
    }

    runner.runMutation(
      {
        errorKey: `comment-edit-${commentId}`,
        singleFlightKey: getCommentUpdateSingleFlightKey(commentId),
      },
      async () => {
        await updateCommentMutation.mutateAsync({
          body: { body },
          params: { path: { commentId } },
        });
        await refreshArticleComments(articleId);
        setEditingCommentId(null);
        invalidateQueryKeys([apiQueryKeys.articleComments(articleId)]);
      },
    );
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runner.runMutation(
          {
            errorKey: `comment-${comment.id}`,
          },
          async () => {
            await deleteCommentMutation.mutateAsync({
              params: { path: { commentId: comment.id } },
            });
            await refreshArticleComments(comment.articleId);
            setConfirmState(null);

            if (comment.deletedAt === null) {
              adjustVisibleCommentCount(-1);
            }

            invalidateQueryKeys([apiQueryKeys.articleComments(comment.articleId)]);
          },
        );
      },
      title: '댓글 삭제',
    });
  };

  return {
    commentFormResetKeyByArticleId,
    createComment,
    editingCommentId,
    isCommentCreateSubmitting: (articleId: ArticleId, parentCommentId: CommentId | null) =>
      runner.isRunning(getCommentCreateSingleFlightKey(articleId, parentCommentId)),
    isCommentEditSubmitting: (commentId: CommentId) =>
      runner.isRunning(getCommentUpdateSingleFlightKey(commentId)),
    replyingCommentId,
    requestDeleteComment,
    setEditingCommentId,
    setReplyingCommentId,
    updateComment,
  };
}
