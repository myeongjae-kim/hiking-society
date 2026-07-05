'use client';

import { useRouter } from 'next/navigation';
import { useState, type Dispatch, type SetStateAction } from 'react';

import { $api } from '@/app/common/api/$api';
import type { ConfirmState } from '@/app/common/components/ConfirmDialog';
import { useMutationRunner } from '@/app/common/hooks/useMutationRunner';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { HikingId } from '@/core/hiking/domain';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useFeedArticleActions } from './useFeedArticleActions';
import { useFeedCommentActions } from './useFeedCommentActions';
import { useFeedHikingActions } from './useFeedHikingActions';
import { useFeedLikeActions } from './useFeedLikeActions';
import { useFeedLinkActions } from './useFeedLinkActions';

type UseFeedCrudActionsInput = {
  articleHikingIdByArticleId: Map<ArticleId, HikingId>;
  commentArticleIdByCommentId: Map<CommentId, ArticleId>;
  commentCount: number;
  getHikingArticleCount: (hikingId: HikingId) => number;
  setArticlesByHikingId: Dispatch<SetStateAction<Record<string, readonly Article[]>>>;
  setCommentsByHikingId: Dispatch<SetStateAction<Record<string, readonly Comment[]>>>;
  selectedHikingId: HikingId | null;
};

export function useFeedCrudActions({
  articleHikingIdByArticleId,
  commentArticleIdByCommentId,
  commentCount,
  getHikingArticleCount,
  selectedHikingId,
  setArticlesByHikingId,
  setCommentsByHikingId,
}: UseFeedCrudActionsInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const runner = useMutationRunner();
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const invalidateQueryKeys = (queryKeys: readonly QueryKey[]) => {
    void Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
  const refreshRoute = () => router.refresh();
  const actionDeps = {
    invalidateQueryKeys,
    refreshRoute,
    runner,
    setConfirmState,
  };

  const refreshArticleComments = async (articleId: ArticleId) => {
    const hikingId = articleHikingIdByArticleId.get(articleId);

    if (!hikingId) {
      throw new Error('댓글을 갱신할 글을 찾을 수 없습니다.');
    }

    const result = await queryClient.fetchQuery(
      $api.queryOptions('get', '/api/articles/{articleId}/comments', {
        params: { path: { articleId } },
      }),
    );
    const comments = result.comments as unknown as readonly Comment[];

    setCommentsByHikingId((currentComments) => {
      const hikingComments = currentComments[hikingId];

      if (!hikingComments) {
        return currentComments;
      }

      return {
        ...currentComments,
        [hikingId]: [
          ...hikingComments.filter((comment) => comment.articleId !== articleId),
          ...comments,
        ],
      };
    });

    return true;
  };

  const hikingActions = useFeedHikingActions({
    ...actionDeps,
    getHikingArticleCount,
  });
  const articleActions = useFeedArticleActions({
    ...actionDeps,
    setArticlesByHikingId,
    setCommentsByHikingId,
  });
  const commentActions = useFeedCommentActions({
    ...actionDeps,
    commentArticleIdByCommentId,
    commentCount,
    refreshArticleComments,
  });
  const likeActions = useFeedLikeActions({
    articleHikingIdByArticleId,
    commentArticleIdByCommentId,
    invalidateQueryKeys,
    refreshArticleComments,
    runner,
    setArticlesByHikingId,
  });
  const linkActions = useFeedLinkActions({
    selectedHikingId,
    setError: runner.setError,
  });

  const sectionState = {
    commentFormResetKeyByArticleId: commentActions.commentFormResetKeyByArticleId,
    editingCommentId: commentActions.editingCommentId,
    errorByKey: runner.errorByKey,
    highlightedHikingId: linkActions.highlightedHikingId,
    isCommentCreateSubmitting: commentActions.isCommentCreateSubmitting,
    isCommentEditSubmitting: commentActions.isCommentEditSubmitting,
    isCommentLikePending: likeActions.isCommentLikePending,
    pendingLikeByKey: likeActions.pendingLikeByKey,
    replyingCommentId: commentActions.replyingCommentId,
  };
  const sectionActions = {
    copyArticleLink: linkActions.copyArticleLink,
    copyHikingLink: linkActions.copyHikingLink,
    createComment: commentActions.createComment,
    requestDeleteArticle: articleActions.requestDeleteArticle,
    requestDeleteComment: commentActions.requestDeleteComment,
    requestDeleteHiking: hikingActions.requestDeleteHiking,
    setActiveArticleForm: articleActions.setActiveArticleForm,
    setActiveHikingForm: hikingActions.setActiveHikingForm,
    setEditingCommentId: commentActions.setEditingCommentId,
    setReplyingCommentId: commentActions.setReplyingCommentId,
    toggleArticleLike: likeActions.toggleArticleLike,
    toggleCommentLike: likeActions.toggleCommentLike,
    updateComment: commentActions.updateComment,
  };
  const dialogState = {
    activeArticleForm: articleActions.activeArticleForm,
    activeArticleSubmitting: articleActions.activeArticleSubmitting,
    activeHikingForm: hikingActions.activeHikingForm,
    activeHikingSubmitting: hikingActions.activeHikingSubmitting,
    confirmState,
    errorByKey: runner.errorByKey,
    loadingLabel: runner.loadingLabel,
    loadingOverlayOpen: runner.isPending && runner.loadingLabel !== null,
  };
  const dialogActions = {
    closeActiveArticleForm: articleActions.closeActiveArticleForm,
    closeActiveHikingForm: hikingActions.closeActiveHikingForm,
    createArticle: articleActions.createArticle,
    createHiking: hikingActions.createHiking,
    setConfirmState,
    updateArticle: articleActions.updateArticle,
    updateHiking: hikingActions.updateHiking,
  };
  const statusState = {
    visibleCommentCount: commentActions.visibleCommentCount,
  };

  return {
    dialogActions,
    dialogState,
    sectionActions,
    sectionState,
    statusState,
  };
}
