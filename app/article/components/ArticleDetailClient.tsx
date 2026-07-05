'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { $api, fetchClient } from '@/app/common/api/$api';
import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { boxBorderClassName } from '@/app/common/components/styles';
import { useSingleFlightAction } from '@/app/common/hooks/useSingleFlightAction';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { getAuthorName } from '@/app/feed/utils/feed-crud-utils';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';
import { useQueryClient } from '@tanstack/react-query';
import { ArticleFormDialog } from './ArticleFormDialog';
import type { ArticleFormValues } from './articleFormTypes';
import { ArticlePanel } from './ArticlePanel';

type ArticleDetailClientProps = {
  article: Article;
  comments: readonly Comment[];
  currentTheme: string;
  currentUser: AuthenticatedUser;
  highlightedCommentId: CommentId | null;
  notificationSnapshot: NotificationListSnapshot;
};

type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

type UploadedArticleMedia = {
  byteSize: number;
  contentType: string;
  durationMs: number | null;
  height: number | null;
  mediaType: 'image' | 'video';
  objectKey: string;
  order: number;
  originalMetadata: Record<string, unknown> | null;
  thumbnailUrl: string | null;
  url: string;
  width: number | null;
};

type ArticleMediaUploadTargetInput = {
  byteSize: number;
  contentType: string;
  fileName: string;
  mediaType: 'image' | 'video';
  thumbnail?: {
    byteSize: number;
    contentType: string;
    fileName: string;
  };
};

const getCommentCreateSingleFlightKey = (articleId: ArticleId, parentCommentId: CommentId | null) =>
  `comment-create-${articleId}-${parentCommentId ?? 'root'}`;

const getCommentUpdateSingleFlightKey = (commentId: CommentId) => `comment-update-${commentId}`;

async function uploadDirectToS3(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    body: file,
    headers: {
      'Content-Type': file.type,
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('S3 업로드에 실패했습니다.');
  }
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const item = items[currentIndex];

        if (item !== undefined) {
          await worker(item, currentIndex);
        }
      }
    }),
  );
}

export function ArticleDetailClient({
  article,
  comments,
  currentTheme,
  currentUser,
  highlightedCommentId,
  notificationSnapshot,
}: ArticleDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateArticleMutation = $api.useMutation('patch', '/api/articles/{articleId}');
  const deleteArticleMutation = $api.useMutation('delete', '/api/articles/{articleId}');
  const createCommentMutation = $api.useMutation('post', '/api/articles/{articleId}/comments');
  const updateCommentMutation = $api.useMutation('patch', '/api/comments/{commentId}');
  const deleteCommentMutation = $api.useMutation('delete', '/api/comments/{commentId}');
  const toggleArticleLikeMutation = $api.useMutation('post', '/api/articles/{articleId}/like');
  const toggleCommentLikeMutation = $api.useMutation('post', '/api/comments/{commentId}/like');
  const singleFlightAction = useSingleFlightAction();
  const [isPending, startTransition] = useTransition();
  const [editingArticle, setEditingArticle] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKey, setCommentFormResetKey] = useState(0);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});
  const [articleLikeOverride, setArticleLikeOverride] = useState<{
    articleId: ArticleId;
    likeCount: number;
    likedByCurrentUser: boolean;
  } | null>(null);
  const currentAuthorName = getAuthorName(currentUser);
  const displayedArticle =
    articleLikeOverride?.articleId === article.id
      ? {
          ...article,
          likeCount: articleLikeOverride.likeCount,
          likedByCurrentUser: articleLikeOverride.likedByCurrentUser,
        }
      : article;
  const articleUpdateSingleFlightKey = `article-update-${article.id}`;
  const articleUpdateSubmitting =
    singleFlightAction.isRunning(articleUpdateSingleFlightKey) ||
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

  const runAction = (
    action: () => Promise<{ error?: string; ok: boolean }>,
    options: {
      errorKey: string;
      loadingLabel?: string;
      onSettled?: () => void;
      onSuccess?: () => void;
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

            options.onSuccess?.();
            setError(options.errorKey, null);
            void queryClient.invalidateQueries();
            if (options.refresh !== false) {
              router.refresh();
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

  const uploadArticleMedia = async (values: ArticleFormValues) => {
    const newMedia = values.media.filter((media) => media.file);
    const uploadedObjectKeys: string[] = [];

    if (newMedia.length === 0) {
      return { uploadedMedia: [] as UploadedArticleMedia[], uploadedObjectKeys };
    }

    setLoadingLabel('업로드 URL 준비 중');

    const targetInput: ArticleMediaUploadTargetInput[] = newMedia.map((media) => ({
      byteSize: media.file?.size ?? 0,
      contentType: media.file?.type ?? '',
      fileName: media.file?.name ?? media.fileName,
      mediaType: media.mediaType,
      thumbnail: media.thumbnailFile
        ? {
            byteSize: media.thumbnailFile.size,
            contentType: media.thumbnailFile.type,
            fileName: media.thumbnailFile.name,
          }
        : undefined,
    }));
    const { data: targetResult } = await fetchClient.POST('/api/article-media/upload-targets', {
      body: targetInput,
    });

    if (!targetResult) {
      throw new Error('업로드 URL을 만들지 못했습니다.');
    }

    const uploadedMedia = new Array<UploadedArticleMedia>(newMedia.length);
    let uploadedCount = 0;

    try {
      await runWithConcurrency(newMedia, 4, async (media, index) => {
        const target = targetResult.targets[index];

        if (!target || !media.file) {
          throw new Error('업로드 대상을 만들지 못했습니다.');
        }

        await uploadDirectToS3(media.file, target.uploadUrl);
        uploadedObjectKeys.push(target.objectKey);

        if (media.thumbnailFile && target.thumbnail) {
          await uploadDirectToS3(media.thumbnailFile, target.thumbnail.uploadUrl);
          uploadedObjectKeys.push(target.thumbnail.objectKey);
        }

        uploadedMedia[index] = {
          byteSize: media.file.size,
          contentType: media.file.type,
          durationMs: media.durationMs ?? null,
          height: media.height ?? null,
          mediaType: media.mediaType,
          objectKey: target.objectKey,
          order: media.order,
          originalMetadata: media.originalMetadata ?? null,
          thumbnailUrl: target.thumbnail?.url ?? null,
          url: target.url,
          width: media.width ?? null,
        };
        uploadedCount += 1;
        setLoadingLabel(`S3 업로드 중 ${uploadedCount}/${newMedia.length}`);
      });
    } catch (error) {
      if (uploadedObjectKeys.length > 0) {
        setLoadingLabel('업로드 파일 정리 중');
        await fetchClient.DELETE('/api/article-media/uploads', {
          body: { objectKeys: uploadedObjectKeys },
        });
      }

      throw error;
    }

    return { uploadedMedia, uploadedObjectKeys };
  };

  const createArticleFormData = async (values: ArticleFormValues) => {
    const { uploadedMedia, uploadedObjectKeys } = await uploadArticleMedia(values);
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
      setError(`article-edit-${article.id}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(
      async () => {
        let uploadedObjectKeys: string[] = [];
        try {
          const articleFormData = await createArticleFormData(values);
          uploadedObjectKeys = articleFormData.uploadedObjectKeys;

          setLoadingLabel('게시글 저장 중');
          await updateArticleMutation.mutateAsync({
            body: articleFormData.body,
            params: { path: { articleId: article.id } },
          });

          return { ok: true as const };
        } catch (error) {
          if (uploadedObjectKeys.length > 0) {
            setLoadingLabel('업로드 파일 정리 중');
            await fetchClient.DELETE('/api/article-media/uploads', {
              body: { objectKeys: uploadedObjectKeys },
            });
          }

          return {
            error: error instanceof Error ? error.message : '게시글을 저장하지 못했습니다.',
            ok: false,
          };
        }
      },
      {
        errorKey: `article-edit-${article.id}`,
        loadingLabel: '게시글 저장 중',
        onSuccess: () => setEditingArticle(false),
        singleFlightKey: articleUpdateSingleFlightKey,
      },
    );
  };

  const requestDeleteArticle = () => {
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
            onSuccess: () => {
              setConfirmState(null);
              router.push('/feed');
            },
          },
        );
      },
      title: '게시글 삭제',
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
        onSuccess: () => {
          if (parentCommentId === null) {
            setCommentFormResetKey((currentKey) => currentKey + 1);
          }

          setReplyingCommentId(null);
        },
        singleFlightKey: getCommentCreateSingleFlightKey(articleId, parentCommentId),
      },
    );
  };

  const updateComment = (commentId: CommentId, body: string) => {
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
        onSuccess: () => setEditingCommentId(null),
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
            onSuccess: () => setConfirmState(null),
          },
        );
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;

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
        onSuccess: () => {
          setArticleLikeOverride({
            articleId,
            likedByCurrentUser: !displayedArticle.likedByCurrentUser,
            likeCount: Math.max(
              0,
              displayedArticle.likeCount + (displayedArticle.likedByCurrentUser ? -1 : 1),
            ),
          });
        },
        onSettled: () => setLikePending(likePendingKey, false),
        refresh: false,
      },
    );
  };

  const toggleCommentLike = (commentId: CommentId) => {
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
        onSettled: () => setLikePending(likePendingKey, false),
      },
    );
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
        <section
          className={`flex flex-wrap items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
          box-="round"
        >
          <Command>article.detail {article.id}</Command>
          <ActionButton onClick={() => router.push('/feed')}>피드로 이동</ActionButton>
        </section>

        <ArticlePanel
          article={displayedArticle}
          articleLikePending={pendingLikeByKey[`article-${displayedArticle.id}`] === true}
          canEdit={displayedArticle.authorUserId === currentUser.id}
          comments={comments}
          commentFormResetKey={commentFormResetKey}
          currentUserId={currentUser.id}
          editingCommentId={editingCommentId}
          errorByKey={errorByKey}
          highlightedCommentId={highlightedCommentId}
          isCommentCreateSubmitting={(articleId, parentCommentId) =>
            singleFlightAction.isRunning(
              getCommentCreateSingleFlightKey(articleId, parentCommentId),
            )
          }
          isCommentEditSubmitting={(commentId) =>
            singleFlightAction.isRunning(getCommentUpdateSingleFlightKey(commentId))
          }
          isCommentLikePending={(commentId) => pendingLikeByKey[`comment-${commentId}`] === true}
          onCreateComment={createComment}
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
        title="게시글 수정"
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
