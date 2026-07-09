'use client';

import Link from '#/features/shared/components/AppLink';
import { useRouter } from '#/features/shared/hooks/useRouter';
import { useMemo, useState } from 'react';

import { useArticleMediaUploader } from '#/features/article/hooks/useArticleMediaUploader';
import { $api } from '#/api/client/$api';
import { apiQueryKeys } from '#/api/client/queryKeys';
import { Command } from '#/features/shared/components/Command';
import { ConfirmDialog, type ConfirmState } from '#/features/shared/components/ConfirmDialog';
import { LoadingOverlay } from '#/features/shared/components/LoadingOverlay';
import { inlineButtonClassName } from '#/features/shared/components/styles';
import { useMutationRunner } from '#/features/shared/hooks/useMutationRunner';
import { FeedTopbar } from '#/features/feed/components/FeedTopbar';
import { getAuthorName } from '#/features/feed/utils/feed-crud-utils';
import { getHikingDisplay } from '#/features/hiking/components/hikingFormUtils';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking } from '@/core/hiking/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArticleFormDialog } from './ArticleFormDialog';
import type { ArticleFormValues } from './articleFormTypes';
import { ArticlePanel } from './ArticlePanel';

type ArticleDetailClientProps = {
  article: Article;
  comments: readonly Comment[];
  currentTheme: string;
  currentUser: AuthenticatedUser;
  hiking: Hiking;
  highlightedCommentId: CommentId | null;
  notificationSnapshot: NotificationListSnapshot;
};

type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

const getCommentCreateSingleFlightKey = (articleId: ArticleId, parentCommentId: CommentId | null) =>
  `comment-create-${articleId}-${parentCommentId ?? 'root'}`;

const getCommentUpdateSingleFlightKey = (commentId: CommentId) => `comment-update-${commentId}`;

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

export function ArticleDetailClient({
  article,
  comments,
  currentTheme,
  currentUser,
  hiking,
  highlightedCommentId,
  notificationSnapshot,
}: ArticleDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { deleteUploadedArticleMedia, uploadArticleMedia } = useArticleMediaUploader();
  const updateArticleMutation = $api.useMutation('patch', '/api/articles/{articleId}');
  const deleteArticleMutation = $api.useMutation('delete', '/api/articles/{articleId}');
  const createCommentMutation = $api.useMutation('post', '/api/articles/{articleId}/comments');
  const updateCommentMutation = $api.useMutation('patch', '/api/comments/{commentId}');
  const deleteCommentMutation = $api.useMutation('delete', '/api/comments/{commentId}');
  const toggleArticleLikeMutation = $api.useMutation('post', '/api/articles/{articleId}/like');
  const toggleCommentLikeMutation = $api.useMutation('post', '/api/comments/{commentId}/like');
  const { errorByKey, isPending, isRunning, loadingLabel, runMutation, setError, setLoadingLabel } =
    useMutationRunner();
  const [editingArticle, setEditingArticle] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKey, setCommentFormResetKey] = useState(0);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});
  const [articleLikeOverride, setArticleLikeOverride] = useState<{
    articleId: ArticleId;
    likeCount: number;
    likedByCurrentUser: boolean;
  } | null>(null);
  const [commentLikeOverrides, setCommentLikeOverrides] = useState<
    Record<string, { likeCount: number; likedByCurrentUser: boolean }>
  >({});
  const currentAuthorName = getAuthorName(currentUser);
  const displayedArticle =
    articleLikeOverride?.articleId === article.id
      ? {
          ...article,
          likeCount: articleLikeOverride.likeCount,
          likedByCurrentUser: articleLikeOverride.likedByCurrentUser,
        }
      : article;
  const displayedComments = useMemo(
    () =>
      comments.map((comment) => {
        const override = commentLikeOverrides[comment.id];

        return override ? { ...comment, ...override } : comment;
      }),
    [commentLikeOverrides, comments],
  );
  const articleUpdateSingleFlightKey = `article-update-${article.id}`;
  const articleUpdateSubmitting =
    isRunning(articleUpdateSingleFlightKey) || (isPending && loadingLabel !== null);
  const hikingDisplay = getHikingDisplay(hiking);
  const hikingHref = `/feed?hikingId=${encodeURIComponent(hiking.id)}`;

  const invalidateQueryKeys = (queryKeys: readonly QueryKey[]) => {
    void Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
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

  const createArticleFormData = async (values: ArticleFormValues) => {
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

    return {
      body: { body: values.body, existingMedia, uploadedMedia },
      uploadedObjectKeys,
    };
  };

  const updateArticle = (values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${article.id}`, '글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runMutation(
      {
        errorKey: `article-edit-${article.id}`,
        loadingLabel: '글 저장 중',
        singleFlightKey: articleUpdateSingleFlightKey,
      },
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values);
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('글 저장 중');
          await updateArticleMutation.mutateAsync({
            body: articleFormData.body,
            params: { path: { articleId: article.id } },
          });

          setEditingArticle(false);
          invalidateQueryKeys([
            apiQueryKeys.articleDetail(article.id),
            apiQueryKeys.hikingArticles(article.hikingId),
          ]);
          router.refresh();
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await deleteUploadedArticleMedia(uploadedObjectKeys);
          }

          throw new Error(error instanceof Error ? error.message : '글을 저장하지 못했습니다.');
        }
      },
    );
  };

  const requestDeleteArticle = () => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runMutation(
          {
            errorKey: `article-${article.id}`,
          },
          async () => {
            await deleteArticleMutation.mutateAsync({
              params: { path: { articleId: article.id } },
            });
            setConfirmState(null);
            router.push('/feed');
            invalidateQueryKeys([
              apiQueryKeys.articleDetail(article.id),
              apiQueryKeys.feed(),
              apiQueryKeys.hikingArticles(article.hikingId),
            ]);
            router.refresh();
          },
        );
      },
      title: '글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    runMutation(
      {
        errorKey: `comment-new-${articleId}`,
        singleFlightKey: getCommentCreateSingleFlightKey(articleId, parentCommentId),
      },
      async () => {
        await createCommentMutation.mutateAsync({
          body: { body, parentCommentId },
          params: { path: { articleId } },
        });

        if (parentCommentId === null) {
          setCommentFormResetKey((currentKey) => currentKey + 1);
        }

        setReplyingCommentId(null);
        invalidateQueryKeys([
          apiQueryKeys.articleComments(articleId),
          apiQueryKeys.notifications(),
        ]);
        router.refresh();
      },
    );
  };

  const updateComment = (commentId: CommentId, body: string) => {
    runMutation(
      {
        errorKey: `comment-edit-${commentId}`,
        singleFlightKey: getCommentUpdateSingleFlightKey(commentId),
      },
      async () => {
        await updateCommentMutation.mutateAsync({
          body: { body },
          params: { path: { commentId } },
        });
        setEditingCommentId(null);
        invalidateQueryKeys([apiQueryKeys.articleComments(article.id)]);
        router.refresh();
      },
    );
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        runMutation(
          {
            errorKey: `comment-${comment.id}`,
          },
          async () => {
            await deleteCommentMutation.mutateAsync({
              params: { path: { commentId: comment.id } },
            });
            setConfirmState(null);
            invalidateQueryKeys([apiQueryKeys.articleComments(comment.articleId)]);
            router.refresh();
          },
        );
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;

    setLikePending(likePendingKey, true);
    runMutation(
      {
        errorKey: `article-${articleId}`,
        onSettled: () => setLikePending(likePendingKey, false),
      },
      async () => {
        await toggleArticleLikeMutation.mutateAsync({
          params: { path: { articleId } },
        });
        setArticleLikeOverride({
          articleId,
          likedByCurrentUser: !displayedArticle.likedByCurrentUser,
          likeCount: Math.max(
            0,
            displayedArticle.likeCount + (displayedArticle.likedByCurrentUser ? -1 : 1),
          ),
        });
        invalidateQueryKeys([
          apiQueryKeys.articleDetail(articleId),
          apiQueryKeys.hikingArticles(article.hikingId),
        ]);
      },
    );
  };

  const toggleCommentLike = (commentId: CommentId) => {
    const likePendingKey = `comment-${commentId}` as LikePendingKey;

    setLikePending(likePendingKey, true);
    runMutation(
      {
        errorKey: `comment-${commentId}`,
        onSettled: () => setLikePending(likePendingKey, false),
      },
      async () => {
        await toggleCommentLikeMutation.mutateAsync({
          params: { path: { commentId } },
        });
        setCommentLikeOverrides((currentOverrides) => {
          const currentComment = displayedComments.find((comment) => comment.id === commentId);

          if (!currentComment) {
            return currentOverrides;
          }

          const likedByCurrentUser = !currentComment.likedByCurrentUser;

          return {
            ...currentOverrides,
            [commentId]: {
              likedByCurrentUser,
              likeCount: Math.max(
                0,
                currentComment.likeCount + (currentComment.likedByCurrentUser ? -1 : 1),
              ),
            },
          };
        });
        invalidateQueryKeys([apiQueryKeys.articleComments(article.id)]);
      },
    );
  };

  const copyCurrentArticleLink = () => {
    copyTextToClipboard(window.location.href)
      .then(() => {
        setError(`article-${article.id}`, null);
        toast.success('글 링크를 복사했습니다.', { position: 'bottom-center' });
      })
      .catch(() => {
        setError(`article-${article.id}`, '링크 복사에 실패했습니다.');
        toast.error('링크 복사에 실패했습니다.', { position: 'bottom-center' });
      });
  };

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar
        currentAuthorName={currentAuthorName}
        currentTheme={currentTheme}
        notificationSnapshot={notificationSnapshot}
        user={currentUser}
      />
      <div className="mx-auto grid w-[min(100%,62rem)] gap-4 px-1.5 py-4 sm:px-4 lg:p-5">
        <section aria-label="글이 포함된 산행">
          <header className="flex flex-col gap-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1.5 shadow-[0_0.35rem_0_var(--background0)] sm:px-4 sm:py-3">
            <div className="grid min-w-0 gap-1">
              <Command>hiking.context {hiking.id}</Command>
            </div>

            <div className="flex justify-between">
              <h1 className="m-0 flex min-w-0 items-center gap-2 text-[1.25rem] leading-[1.1] tracking-normal break-keep text-[var(--blue)] sm:text-[1.75rem]">
                <span className="min-w-0">
                  {hiking.order}. {hiking.mountainName}
                </span>
              </h1>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span
                  className="font-mono text-sm leading-none !text-[var(--yellow)] sm:text-base"
                  is-="badge"
                  variant-="background1"
                >
                  {hikingDisplay.dateLabel}
                </span>
                <Link className={inlineButtonClassName} href={hikingHref}>
                  피드로 이동
                </Link>
              </div>
            </div>
          </header>
          <div className="grid gap-2 border border-t-0 border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--surface0)_68%,transparent)] px-3 py-2 sm:px-4">
            <dl className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm leading-[1.35]">
              <div className="flex min-w-0 items-baseline gap-1.5">
                <dt className="m-0 shrink-0 text-xs text-[var(--subtext0)]">날짜/시간</dt>
                <dd className="m-0 min-w-0 text-[var(--foreground1)]">
                  <span className="font-mono">{hikingDisplay.dateLabel}</span>
                  <span className="px-1 text-[var(--subtext0)]">·</span>
                  <span>{hikingDisplay.timeRangeLabel}</span>
                  {hikingDisplay.durationLabel ? (
                    <>
                      <span className="px-1 text-[var(--subtext0)]">·</span>
                      <span>{hikingDisplay.durationLabel}</span>
                    </>
                  ) : null}
                  <span className="px-1 text-[var(--subtext0)]">·</span>
                  <span className="font-mono text-xs text-[var(--subtext0)]">
                    {hikingDisplay.timezoneLabel}
                  </span>
                </dd>
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <dt className="m-0 shrink-0 text-xs text-[var(--subtext0)]">참석자</dt>
                <dd className="m-0 flex min-w-0 flex-wrap gap-1">
                  {hikingDisplay.participants.length > 0 ? (
                    hikingDisplay.participants.map((participant, participantIndex) => (
                      <span
                        className="border border-[var(--overlay0)] bg-[var(--surface1)] px-1.5 text-xs leading-[1.35] text-[var(--foreground0)]"
                        key={`${participant}-${participantIndex}`}
                      >
                        {participant}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--foreground1)]">참석자 미기록</span>
                  )}
                </dd>
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <dt className="m-0 shrink-0 text-xs text-[var(--subtext0)]">위치/고도</dt>
                <dd className="m-0 min-w-0 font-mono text-[var(--foreground1)]">
                  위도 {hikingDisplay.latitudeLabel}
                  <span className="px-1 text-[var(--subtext0)]">·</span>
                  경도 {hikingDisplay.longitudeLabel}
                  <span className="px-1 text-[var(--subtext0)]">·</span>
                  고도 {hikingDisplay.altitudeLabel}
                </dd>
              </div>
              {hikingDisplay.restaurantLabel ? (
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <dt className="m-0 shrink-0 text-xs text-[var(--subtext0)]">뒤풀이</dt>
                  <dd className="m-0 min-w-0 [overflow-wrap:anywhere] text-[var(--foreground1)]">
                    {hikingDisplay.restaurantLabel}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <ArticlePanel
          article={displayedArticle}
          articleLikePending={pendingLikeByKey[`article-${displayedArticle.id}`] === true}
          canEdit={displayedArticle.authorUserId === currentUser.id}
          comments={displayedComments}
          commentFormResetKey={commentFormResetKey}
          currentUserId={currentUser.id}
          editingCommentId={editingCommentId}
          errorByKey={errorByKey}
          highlightedCommentId={highlightedCommentId}
          isCommentCreateSubmitting={(articleId, parentCommentId) =>
            isRunning(getCommentCreateSingleFlightKey(articleId, parentCommentId))
          }
          isCommentEditSubmitting={(commentId) =>
            isRunning(getCommentUpdateSingleFlightKey(commentId))
          }
          isCommentLikePending={(commentId) => pendingLikeByKey[`comment-${commentId}`] === true}
          mobileMediaCarousel
          onCreateComment={createComment}
          onCopyArticleLink={copyCurrentArticleLink}
          onDeleteArticle={requestDeleteArticle}
          onDeleteComment={requestDeleteComment}
          onEditArticle={() => setEditingArticle(true)}
          onEditComment={setEditingCommentId}
          onReplyComment={setReplyingCommentId}
          onSubmitCommentEdit={updateComment}
          onToggleArticleLike={toggleArticleLike}
          onToggleCommentLike={toggleCommentLike}
          replyingCommentId={replyingCommentId}
        />
      </div>
      <ConfirmDialog
        confirmState={confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
      />
      <ArticleFormDialog
        article={displayedArticle}
        error={errorByKey[`article-edit-${displayedArticle.id}`]}
        formKey={`article-edit-${displayedArticle.id}`}
        onCancel={() => {
          setError(`article-edit-${article.id}`, null);
          setEditingArticle(false);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setError(`article-edit-${article.id}`, null);
            setEditingArticle(false);
          }
        }}
        onSubmit={updateArticle}
        open={editingArticle}
        submitting={articleUpdateSubmitting}
        title="글 수정"
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
