'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { useArticleMediaUploader } from '@/app/article/hooks/useArticleMediaUploader';
import type { UploadedArticleMedia } from '@/app/article/utils/article-media-upload';
import { $api } from '@/app/common/api/$api';
import { apiQueryKeys } from '@/app/common/api/queryKeys';
import type { ConfirmState } from '@/app/common/components/ConfirmDialog';
import { useSingleFlightAction } from '@/app/common/hooks/useSingleFlightAction';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import {
  getCommentCreateSingleFlightKey,
  getCommentUpdateSingleFlightKey,
  type ActiveArticleForm,
  type ActiveHikingForm,
  type LikePendingKey,
} from '../utils/feedCrudTypes';

type UseFeedCrudActionsInput = {
  articleHikingIdByArticleId: Map<ArticleId, HikingId>;
  commentArticleIdByCommentId: Map<CommentId, ArticleId>;
  commentCount: number;
  getHikingArticleCount: (hikingId: HikingId) => number;
  setArticlesByHikingId: Dispatch<SetStateAction<Record<string, readonly Article[]>>>;
  setCommentsByHikingId: Dispatch<SetStateAction<Record<string, readonly Comment[]>>>;
  selectedHikingId: HikingId | null;
};

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.left = '-9999px';
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const copied = document.execCommand('copy');

    if (!copied) {
      throw new Error('Copy command failed.');
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

function createHikingBody(values: HikingFormValues) {
  return {
    altitude: values.altitude.trim() ? Number(values.altitude) : null,
    completedTime: values.completedTime,
    hikingDate: values.hikingDate,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    mountainName: values.mountainName,
    participantsCsv: values.participantsCsv,
    restaurantAddress: values.restaurantAddress,
    startedTime: values.startedTime,
    timezone: values.timezone,
  };
}

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
  const { deleteUploadedArticleMedia, uploadArticleMedia } = useArticleMediaUploader();
  const createHikingMutation = $api.useMutation('post', '/api/hikings');
  const updateHikingMutation = $api.useMutation('patch', '/api/hikings/{hikingId}');
  const deleteHikingMutation = $api.useMutation('delete', '/api/hikings/{hikingId}');
  const createArticleMutation = $api.useMutation('post', '/api/articles');
  const updateArticleMutation = $api.useMutation('patch', '/api/articles/{articleId}');
  const deleteArticleMutation = $api.useMutation('delete', '/api/articles/{articleId}');
  const toggleArticleLikeMutation = $api.useMutation('post', '/api/articles/{articleId}/like');
  const createCommentMutation = $api.useMutation('post', '/api/articles/{articleId}/comments');
  const updateCommentMutation = $api.useMutation('patch', '/api/comments/{commentId}');
  const deleteCommentMutation = $api.useMutation('delete', '/api/comments/{commentId}');
  const toggleCommentLikeMutation = $api.useMutation('post', '/api/comments/{commentId}/like');
  const singleFlightAction = useSingleFlightAction();
  const [isPending, startTransition] = useTransition();
  const [activeHikingForm, setActiveHikingForm] = useState<ActiveHikingForm>(null);
  const [activeArticleForm, setActiveArticleForm] = useState<ActiveArticleForm>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKeyByArticleId, setCommentFormResetKeyByArticleId] = useState<
    Record<string, number>
  >({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [highlightedHikingId, setHighlightedHikingId] = useState<HikingId | null>(selectedHikingId);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [commentCountDeltaState, setCommentCountDeltaState] = useState({
    baseCommentCount: commentCount,
    delta: 0,
  });
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});

  const commentCountDelta =
    commentCountDeltaState.baseCommentCount === commentCount ? commentCountDeltaState.delta : 0;
  const visibleCommentCount = Math.max(0, commentCount + commentCountDelta);
  const activeHikingSingleFlightKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-create'
      : activeHikingForm?.type === 'edit'
        ? `hiking-update-${activeHikingForm.hikingId}`
        : null;
  const activeArticleSingleFlightKey =
    activeArticleForm?.type === 'create'
      ? `article-create-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-update-${activeArticleForm.articleId}`
        : null;
  const activeHikingSubmitting =
    (activeHikingSingleFlightKey !== null &&
      singleFlightAction.isRunning(activeHikingSingleFlightKey)) ||
    (isPending && loadingLabel !== null);
  const activeArticleSubmitting =
    (activeArticleSingleFlightKey !== null &&
      singleFlightAction.isRunning(activeArticleSingleFlightKey)) ||
    (isPending && loadingLabel !== null);

  const setError = (key: string, value: string | null) => {
    setErrorByKey((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (value === null) {
        delete nextErrors[key];
      } else {
        nextErrors[key] = value;
      }

      return nextErrors;
    });
  };

  const runAction = <T extends { error?: string; ok: boolean }>(
    action: () => Promise<T>,
    options: {
      errorKey: string;
      loadingLabel?: string;
      onSettled?: () => void;
      onSuccess?: (result: T & { ok: true }) => Promise<void> | void;
      getInvalidateQueryKeys?: (result: T & { ok: true }) => readonly QueryKey[];
      invalidateQueryKeys?: readonly QueryKey[];
      refresh?: boolean;
      singleFlightKey?: string;
    },
  ) => {
    const execute = async () => {
      setLoadingLabel(options.loadingLabel ?? null);

      await new Promise<void>((resolve) => {
        startTransition(async () => {
          try {
            const result = await action();

            if (!result.ok) {
              setError(options.errorKey, result.error ?? '요청을 처리하지 못했습니다.');
              return;
            }

            try {
              const successResult = result as T & { ok: true };

              await options.onSuccess?.(successResult);
              setError(options.errorKey, null);
              const invalidateQueryKeys =
                options.getInvalidateQueryKeys?.(successResult) ?? options.invalidateQueryKeys;

              if (invalidateQueryKeys) {
                void Promise.all(
                  invalidateQueryKeys.map((queryKey) =>
                    queryClient.invalidateQueries({ queryKey }),
                  ),
                );
              }
              if (options.refresh !== false) {
                router.refresh();
              }
            } catch (error) {
              setError(
                options.errorKey,
                error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
              );
            }
          } catch (error) {
            setError(
              options.errorKey,
              error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
            );
          } finally {
            options.onSettled?.();
            resolve();
          }
        });
      });
    };

    if (options.singleFlightKey) {
      void singleFlightAction.run(options.singleFlightKey, execute);
      return;
    }

    void execute();
  };

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

  const closeActiveArticleForm = () => {
    if (activeArticleForm?.type === 'create') {
      setError(`article-new-${activeArticleForm.hikingId}`, null);
    }

    if (activeArticleForm?.type === 'edit') {
      setError(`article-edit-${activeArticleForm.articleId}`, null);
    }

    setActiveArticleForm(null);
  };

  const closeActiveHikingForm = () => {
    if (activeHikingForm?.type === 'create') {
      setError('hiking-new', null);
    }

    if (activeHikingForm?.type === 'edit') {
      setError(`hiking-edit-${activeHikingForm.hikingId}`, null);
    }

    setActiveHikingForm(null);
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

  const applyArticleLikeToggle = (articleId: ArticleId) => {
    const hikingId = articleHikingIdByArticleId.get(articleId);

    if (!hikingId) {
      throw new Error('좋아요를 갱신할 글을 찾을 수 없습니다.');
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
            likeCount: Math.max(0, article.likeCount + (likedByCurrentUser ? 1 : -1)),
          };
        }),
      };
    });
  };

  const copyHikingLink = (hiking: Hiking) => {
    const hikingHref = `/feed?hikingId=${encodeURIComponent(hiking.id)}`;
    const url = new URL(hikingHref, window.location.origin);

    setHighlightedHikingId(hiking.id);
    window.history.replaceState(window.history.state, '', hikingHref);

    copyTextToClipboard(url.toString())
      .then(() => {
        setError(`hiking-${hiking.id}`, null);
        toast.success('산행 링크를 복사했습니다.', { position: 'bottom-center' });
      })
      .catch(() => {
        setError(`hiking-${hiking.id}`, '링크 복사에 실패했습니다.');
        toast.error('링크 복사에 실패했습니다.', { position: 'bottom-center' });
      });
  };

  const copyArticleLink = (article: Article) => {
    const articleHref = `/article/${encodeURIComponent(article.id)}`;
    const url = new URL(articleHref, window.location.origin);

    copyTextToClipboard(url.toString())
      .then(() => {
        setError(`article-${article.id}`, null);
        toast.success('글 링크를 복사했습니다.', { position: 'bottom-center' });
      })
      .catch(() => {
        setError(`article-${article.id}`, '링크 복사에 실패했습니다.');
        toast.error('링크 복사에 실패했습니다.', { position: 'bottom-center' });
      });
  };

  const createArticleFormData = async (
    values: ArticleFormValues,
    identifiers: { articleId?: ArticleId; hikingId?: HikingId },
  ) => {
    const body = {
      existingMedia: [] as {
        byteSize?: number;
        contentType?: string;
        durationMs?: number | null;
        height?: number | null;
        mediaType: 'image' | 'video';
        metadata?: Record<string, string | null | undefined> | null;
        objectKey?: string;
        order: number;
        thumbnailUrl?: string | null;
        url: string;
        width?: number | null;
      }[],
      uploadedMedia: [] as UploadedArticleMedia[],
      body: values.body,
      ...identifiers,
    };
    const { uploadedMedia, uploadedObjectKeys } = await uploadArticleMedia(values, setLoadingLabel);
    const existingMedia = values.media
      .filter((media) => !media.file)
      .map((media) => ({
        byteSize: media.byteSize,
        contentType: media.contentType,
        durationMs: media.durationMs,
        height: media.height,
        mediaType: media.mediaType,
        metadata: media.metadata,
        objectKey: media.objectKey,
        order: media.order,
        thumbnailUrl: media.thumbnailUrl,
        url: media.url,
        width: media.width,
      }));

    return { body: { ...body, existingMedia, uploadedMedia }, uploadedObjectKeys };
  };

  const createHiking = (values: HikingFormValues) => {
    runAction(
      () =>
        createHikingMutation
          .mutateAsync({ body: createHikingBody(values) })
          .then(() => ({ ok: true as const })),
      {
        errorKey: 'hiking-new',
        invalidateQueryKeys: [apiQueryKeys.feed(), apiQueryKeys.notifications()],
        loadingLabel: '산행 저장 중',
        onSuccess: () => setActiveHikingForm(null),
        singleFlightKey: 'hiking-create',
      },
    );
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    runAction(
      () =>
        updateHikingMutation
          .mutateAsync({
            body: createHikingBody(values),
            params: { path: { hikingId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `hiking-edit-${hikingId}`,
        invalidateQueryKeys: [apiQueryKeys.feed(), apiQueryKeys.hikingArticles(hikingId)],
        loadingLabel: '산행 저장 중',
        onSuccess: () => setActiveHikingForm(null),
        singleFlightKey: `hiking-update-${hikingId}`,
      },
    );
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = getHikingArticleCount(hiking.id) > 0;

    if (hasArticles) {
      setError(`hiking-${hiking.id}`, '글이 있는 산행은 삭제할 수 없습니다.');
      return;
    }

    setConfirmState({
      body: `${hiking.mountainName} 산행 기록을 삭제합니다.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteHikingMutation
              .mutateAsync({
                params: { path: { hikingId: hiking.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `hiking-${hiking.id}`,
            invalidateQueryKeys: [apiQueryKeys.feed(), apiQueryKeys.hikingArticles(hiking.id)],
            onSuccess: () => setConfirmState(null),
          },
        );
      },
      title: '산행 삭제',
    });
  };

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-new-${hikingId}`, '글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            hikingId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('글 저장 중');
          await createArticleMutation.mutateAsync({
            body: { ...articleFormData.body, hikingId },
          });

          return { ok: true as const };
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await deleteUploadedArticleMedia(uploadedObjectKeys);
          }

          return {
            error: error instanceof Error ? error.message : '글을 저장하지 못했습니다.',
            ok: false,
          };
        }
      },
      {
        errorKey: `article-new-${hikingId}`,
        invalidateQueryKeys: [
          apiQueryKeys.feed(),
          apiQueryKeys.hikingArticles(hikingId),
          apiQueryKeys.notifications(),
        ],
        loadingLabel: '글 저장 중',
        onSuccess: () => setActiveArticleForm(null),
        singleFlightKey: `article-create-${hikingId}`,
      },
    );
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${articleId}`, '글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values, {
            articleId,
          });
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('글 저장 중');
          const result = await updateArticleMutation.mutateAsync({
            body: articleFormData.body,
            params: { path: { articleId } },
          });

          if (!result) {
            throw new Error('글을 저장하지 못했습니다.');
          }

          return {
            ok: true as const,
            snapshot: result as unknown as { article: Article; comments: readonly Comment[] },
          };
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await deleteUploadedArticleMedia(uploadedObjectKeys);
          }

          return {
            error: error instanceof Error ? error.message : '글을 저장하지 못했습니다.',
            ok: false,
          };
        }
      },
      {
        errorKey: `article-edit-${articleId}`,
        getInvalidateQueryKeys: (result) => [
          apiQueryKeys.articleDetail(articleId),
          apiQueryKeys.hikingArticles(result.snapshot.article.hikingId),
        ],
        loadingLabel: '글 저장 중',
        onSuccess: (result) => {
          setArticlesByHikingId((currentArticles) => {
            const hikingArticles = currentArticles[result.snapshot.article.hikingId];

            if (!hikingArticles) {
              return currentArticles;
            }

            return {
              ...currentArticles,
              [result.snapshot.article.hikingId]: hikingArticles.map((article) =>
                article.id === result.snapshot.article.id ? result.snapshot.article : article,
              ),
            };
          });
          setCommentsByHikingId((currentComments) => {
            const hikingComments = currentComments[result.snapshot.article.hikingId];

            if (!hikingComments) {
              return currentComments;
            }

            return {
              ...currentComments,
              [result.snapshot.article.hikingId]: [
                ...hikingComments.filter(
                  (comment) => comment.articleId !== result.snapshot.article.id,
                ),
                ...result.snapshot.comments,
              ],
            };
          });
          setActiveArticleForm(null);
        },
        refresh: false,
        singleFlightKey: `article-update-${articleId}`,
      },
    );
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteArticleMutation
              .mutateAsync({
                params: { path: { articleId: article.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `article-${article.id}`,
            invalidateQueryKeys: [
              apiQueryKeys.articleDetail(article.id),
              apiQueryKeys.feed(),
              apiQueryKeys.hikingArticles(article.hikingId),
            ],
            onSuccess: () => setConfirmState(null),
          },
        );
      },
      title: '글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    runAction(
      () =>
        createCommentMutation
          .mutateAsync({
            body: { body, parentCommentId },
            params: { path: { articleId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-new-${articleId}`,
        invalidateQueryKeys: [
          apiQueryKeys.articleComments(articleId),
          apiQueryKeys.notifications(),
        ],
        onSuccess: async () => {
          await refreshArticleComments(articleId);
          setCommentCountDeltaState((currentState) => ({
            baseCommentCount: commentCount,
            delta: (currentState.baseCommentCount === commentCount ? currentState.delta : 0) + 1,
          }));

          if (parentCommentId === null) {
            setCommentFormResetKeyByArticleId((currentKeys) => ({
              ...currentKeys,
              [articleId]: (currentKeys[articleId] ?? 0) + 1,
            }));
          }

          setReplyingCommentId(null);
        },
        refresh: false,
        singleFlightKey: getCommentCreateSingleFlightKey(articleId, parentCommentId),
      },
    );
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const articleId = commentArticleIdByCommentId.get(commentId);

    if (!articleId) {
      setError(`comment-edit-${commentId}`, '댓글을 갱신할 글을 찾을 수 없습니다.');
      return;
    }

    runAction(
      () =>
        updateCommentMutation
          .mutateAsync({
            body: { body },
            params: { path: { commentId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-edit-${commentId}`,
        invalidateQueryKeys: [apiQueryKeys.articleComments(articleId)],
        onSuccess: async () => {
          await refreshArticleComments(articleId);
          setEditingCommentId(null);
        },
        refresh: false,
        singleFlightKey: getCommentUpdateSingleFlightKey(commentId),
      },
    );
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runAction(
          () =>
            deleteCommentMutation
              .mutateAsync({
                params: { path: { commentId: comment.id } },
              })
              .then(() => ({ ok: true as const })),
          {
            errorKey: `comment-${comment.id}`,
            invalidateQueryKeys: [apiQueryKeys.articleComments(comment.articleId)],
            onSuccess: async () => {
              await refreshArticleComments(comment.articleId);
              setConfirmState(null);

              if (comment.deletedAt === null) {
                setCommentCountDeltaState((currentState) => ({
                  baseCommentCount: commentCount,
                  delta:
                    (currentState.baseCommentCount === commentCount ? currentState.delta : 0) - 1,
                }));
              }
            },
            refresh: false,
          },
        );
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;
    const hikingId = articleHikingIdByArticleId.get(articleId);

    setLikePending(likePendingKey, true);
    runAction(
      () =>
        toggleArticleLikeMutation
          .mutateAsync({
            params: { path: { articleId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `article-${articleId}`,
        invalidateQueryKeys: [
          apiQueryKeys.articleDetail(articleId),
          ...(hikingId ? [apiQueryKeys.hikingArticles(hikingId)] : []),
        ],
        onSuccess: () => applyArticleLikeToggle(articleId),
        onSettled: () => setLikePending(likePendingKey, false),
        refresh: false,
      },
    );
  };

  const toggleCommentLike = (commentId: CommentId) => {
    const articleId = commentArticleIdByCommentId.get(commentId);

    if (!articleId) {
      setError(`comment-${commentId}`, '댓글을 갱신할 글을 찾을 수 없습니다.');
      return;
    }

    const likePendingKey = `comment-${commentId}` as LikePendingKey;

    setLikePending(likePendingKey, true);
    runAction(
      () =>
        toggleCommentLikeMutation
          .mutateAsync({
            params: { path: { commentId } },
          })
          .then(() => ({ ok: true as const })),
      {
        errorKey: `comment-${commentId}`,
        invalidateQueryKeys: [apiQueryKeys.articleComments(articleId)],
        onSuccess: async () => {
          await refreshArticleComments(articleId);
        },
        onSettled: () => setLikePending(likePendingKey, false),
        refresh: false,
      },
    );
  };

  return {
    activeArticleForm,
    activeArticleSubmitting,
    activeHikingForm,
    activeHikingSubmitting,
    closeActiveArticleForm,
    closeActiveHikingForm,
    commentFormResetKeyByArticleId,
    confirmState,
    copyArticleLink,
    copyHikingLink,
    createArticle,
    createComment,
    createHiking,
    editingCommentId,
    errorByKey,
    highlightedHikingId,
    isCommentCreateSubmitting: (articleId: ArticleId, parentCommentId: CommentId | null) =>
      singleFlightAction.isRunning(getCommentCreateSingleFlightKey(articleId, parentCommentId)),
    isCommentEditSubmitting: (commentId: CommentId) =>
      singleFlightAction.isRunning(getCommentUpdateSingleFlightKey(commentId)),
    isCommentLikePending: (commentId: CommentId) =>
      pendingLikeByKey[`comment-${commentId}`] === true,
    loadingLabel,
    loadingOverlayOpen: isPending && loadingLabel !== null,
    pendingLikeByKey,
    replyingCommentId,
    requestDeleteArticle,
    requestDeleteComment,
    requestDeleteHiking,
    setActiveArticleForm,
    setActiveHikingForm,
    setConfirmState,
    setEditingCommentId,
    setReplyingCommentId,
    toggleArticleLike,
    toggleCommentLike,
    updateArticle,
    updateComment,
    updateHiking,
    visibleCommentCount,
  };
}
