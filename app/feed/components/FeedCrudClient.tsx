'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { ArticleFormDialog } from '@/app/article/components/ArticleFormDialog';
import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { ArticlePanel } from '@/app/article/components/ArticlePanel';
import { getVisibleCommentCount } from '@/app/comment/components/commentUtils';
import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { boxBorderClassName, gridStackClassName } from '@/app/common/components/styles';
import { FeedFooter } from '@/app/feed/components/FeedFooter';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { StatusPanel } from '@/app/feed/components/StatusPanel';
import { HikingFormDialog } from '@/app/hiking/components/HikingFormDialog';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import { HikingHeader } from '@/app/hiking/components/HikingHeader';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';
import {
  createArticle as createArticleAction,
  createComment as createCommentAction,
  createHiking as createHikingAction,
  deleteArticle as deleteArticleAction,
  deleteComment as deleteCommentAction,
  deleteHiking as deleteHikingAction,
  toggleArticleLike as toggleArticleLikeAction,
  toggleCommentLike as toggleCommentLikeAction,
  updateArticle as updateArticleAction,
  updateComment as updateCommentAction,
  updateHiking as updateHikingAction,
} from '../actions';

import {
  getArticleComments,
  getAuthorName,
  getCommentsByArticleId,
  getFeedGroups,
} from '../utils/feed-crud-utils';

type FeedCrudClientProps = {
  articles: readonly Article[];
  comments: readonly Comment[];
  currentTheme: string;
  currentUser: AuthenticatedUser;
  hikings: readonly Hiking[];
  notificationSnapshot: NotificationListSnapshot;
};

type ActiveArticleForm =
  { hikingId: HikingId; type: 'create' } | { articleId: ArticleId; type: 'edit' } | null;

type ActiveHikingForm = { type: 'create' } | { hikingId: HikingId; type: 'edit' } | null;

type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

export function FeedCrudClient({
  articles: initialArticles,
  comments: initialComments,
  currentTheme,
  currentUser,
  hikings: initialHikings,
  notificationSnapshot,
}: FeedCrudClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const [activeHikingForm, setActiveHikingForm] = useState<ActiveHikingForm>(null);
  const [activeArticleForm, setActiveArticleForm] = useState<ActiveArticleForm>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKeyByArticleId, setCommentFormResetKeyByArticleId] = useState<
    Record<string, number>
  >({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () => getFeedGroups(initialHikings, initialArticles),
    [initialArticles, initialHikings],
  );
  const commentsByArticleId = useMemo(
    () => getCommentsByArticleId(initialComments),
    [initialComments],
  );
  const visibleArticleCount = initialArticles.filter(
    (article) => article.deletedAt === null,
  ).length;
  const visibleCommentCount = getVisibleCommentCount(initialComments);
  const activeHiking =
    activeHikingForm?.type === 'edit'
      ? initialHikings.find((hiking) => hiking.id === activeHikingForm.hikingId)
      : undefined;
  const activeHikingFormKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-new'
      : activeHikingForm?.type === 'edit'
        ? `hiking-edit-${activeHikingForm.hikingId}`
        : null;
  const activeHikingFormTitle = activeHikingForm?.type === 'edit' ? '산행 수정' : '산행 등록';
  const hikingFormDialogOpen =
    activeHikingForm?.type === 'create' ||
    (activeHikingForm?.type === 'edit' && activeHiking !== undefined);
  const activeArticle =
    activeArticleForm?.type === 'edit'
      ? initialArticles.find((article) => article.id === activeArticleForm.articleId)
      : undefined;
  const activeArticleFormKey =
    activeArticleForm?.type === 'create'
      ? `article-new-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-edit-${activeArticleForm.articleId}`
        : null;
  const activeArticleFormTitle = activeArticleForm?.type === 'edit' ? '게시글 수정' : '게시글 작성';
  const articleFormDialogOpen =
    activeArticleForm?.type === 'create' ||
    (activeArticleForm?.type === 'edit' && activeArticle !== undefined);

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
    },
  ) => {
    if (options.loadingLabel) {
      setLoadingLabel(options.loadingLabel);
    } else {
      setLoadingLabel(null);
    }

    startTransition(async () => {
      try {
        const result = await action();

        if (!result.ok) {
          setError(options.errorKey, result.error ?? '요청을 처리하지 못했습니다.');
          return;
        }

        options.onSuccess?.();
        setError(options.errorKey, null);
        router.refresh();
      } finally {
        options.onSettled?.();
      }
    });
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

  const createHikingFormData = (values: HikingFormValues) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value);
    }

    return formData;
  };

  const createArticleFormData = (
    values: ArticleFormValues,
    identifiers: { articleId?: ArticleId; hikingId?: HikingId },
  ) => {
    const formData = new FormData();
    const existingMedia = values.media
      .filter((media) => !media.file)
      .map((media) => ({
        byteSize: media.byteSize,
        contentType: media.contentType,
        durationMs: media.durationMs,
        height: media.height,
        mediaType: media.mediaType,
        objectKey: media.objectKey,
        order: media.order,
        thumbnailUrl: media.thumbnailUrl,
        url: media.url,
        width: media.width,
      }));

    if (identifiers.articleId) {
      formData.set('articleId', identifiers.articleId);
    }

    if (identifiers.hikingId) {
      formData.set('hikingId', identifiers.hikingId);
    }

    formData.set('body', values.body);
    formData.set('existingMedia', JSON.stringify(existingMedia));

    for (const media of values.media) {
      if (!media.file) {
        continue;
      }

      formData.append('media', media.file);
      formData.append('mediaOrders', String(media.order));
      formData.append('mediaTypes', media.mediaType);
      formData.append('mediaDurationMs', String(media.durationMs ?? ''));
      formData.append('mediaWidths', String(media.width ?? ''));
      formData.append('mediaHeights', String(media.height ?? ''));
      formData.append('mediaMetadata', JSON.stringify(media.originalMetadata ?? null));

      if (media.thumbnailFile) {
        formData.append(`mediaThumbnail-${media.order}`, media.thumbnailFile);
      }
    }

    return formData;
  };

  const createHiking = (values: HikingFormValues) => {
    runAction(() => createHikingAction(createHikingFormData(values)), {
      errorKey: 'hiking-new',
      loadingLabel: '산행 저장 중',
      onSuccess: () => setActiveHikingForm(null),
    });
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    const formData = createHikingFormData(values);
    formData.set('hikingId', hikingId);

    runAction(() => updateHikingAction(formData), {
      errorKey: `hiking-edit-${hikingId}`,
      loadingLabel: '산행 저장 중',
      onSuccess: () => setActiveHikingForm(null),
    });
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = initialArticles.some(
      (article) => article.hikingId === hiking.id && article.deletedAt === null,
    );

    if (hasArticles) {
      setError(`hiking-${hiking.id}`, '게시글이 있는 산행은 삭제할 수 없습니다.');
      return;
    }

    setConfirmState({
      body: `${hiking.mountainName} 산행 기록을 삭제합니다.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('hikingId', hiking.id);
        runAction(() => deleteHikingAction(formData), {
          errorKey: `hiking-${hiking.id}`,
          onSuccess: () => setConfirmState(null),
        });
      },
      title: '산행 삭제',
    });
  };

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-new-${hikingId}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(() => createArticleAction(createArticleFormData(values, { hikingId })), {
      errorKey: `article-new-${hikingId}`,
      loadingLabel: '게시글 저장 중',
      onSuccess: () => setActiveArticleForm(null),
    });
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(() => updateArticleAction(createArticleFormData(values, { articleId })), {
      errorKey: `article-edit-${articleId}`,
      loadingLabel: '게시글 저장 중',
      onSuccess: () => setActiveArticleForm(null),
    });
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('articleId', article.id);
        runAction(() => deleteArticleAction(formData), {
          errorKey: `article-${article.id}`,
          onSuccess: () => setConfirmState(null),
        });
      },
      title: '게시글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    const formData = new FormData();
    formData.set('articleId', articleId);
    formData.set('body', body);

    if (parentCommentId) {
      formData.set('parentCommentId', parentCommentId);
    }

    runAction(() => createCommentAction(formData), {
      errorKey: `comment-new-${articleId}`,
      onSuccess: () => {
        if (parentCommentId === null) {
          setCommentFormResetKeyByArticleId((currentKeys) => ({
            ...currentKeys,
            [articleId]: (currentKeys[articleId] ?? 0) + 1,
          }));
        }

        setReplyingCommentId(null);
      },
    });
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const formData = new FormData();
    formData.set('commentId', commentId);
    formData.set('body', body);

    runAction(() => updateCommentAction(formData), {
      errorKey: `comment-edit-${commentId}`,
      onSuccess: () => setEditingCommentId(null),
    });
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('commentId', comment.id);
        runAction(() => deleteCommentAction(formData), {
          errorKey: `comment-${comment.id}`,
          onSuccess: () => setConfirmState(null),
        });
      },
      title: '댓글 삭제',
    });
  };

  const toggleArticleLike = (articleId: ArticleId) => {
    const likePendingKey = `article-${articleId}` as LikePendingKey;
    const formData = new FormData();
    formData.set('articleId', articleId);

    setLikePending(likePendingKey, true);
    runAction(() => toggleArticleLikeAction(formData), {
      errorKey: `article-${articleId}`,
      onSettled: () => setLikePending(likePendingKey, false),
    });
  };

  const toggleCommentLike = (commentId: CommentId) => {
    const likePendingKey = `comment-${commentId}` as LikePendingKey;
    const formData = new FormData();
    formData.set('commentId', commentId);

    setLikePending(likePendingKey, true);
    runAction(() => toggleCommentLikeAction(formData), {
      errorKey: `comment-${commentId}`,
      onSettled: () => setLikePending(likePendingKey, false),
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

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 px-1.5 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 게시글 피드">
          <section
            className={`grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
            box-="round"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Command>{'echo "hello, hiking!"'}</Command>
              <ActionButton onClick={() => setActiveHikingForm({ type: 'create' })}>
                산행 등록
              </ActionButton>
            </div>
          </section>

          {groups.map((group, groupIndex) => (
            <section
              className={gridStackClassName}
              key={`${group.hiking.id}-${groupIndex}`}
              aria-labelledby={`hiking-${group.hiking.id}`}
            >
              <HikingHeader
                canManageHiking={group.hiking.authorUserId === currentUser.id}
                error={errorByKey[`hiking-${group.hiking.id}`]}
                hiking={group.hiking}
                onAddArticle={() =>
                  setActiveArticleForm({ hikingId: group.hiking.id, type: 'create' })
                }
                onDelete={() => requestDeleteHiking(group.hiking)}
                onEdit={() => setActiveHikingForm({ hikingId: group.hiking.id, type: 'edit' })}
              />
              <div className={gridStackClassName}>
                {group.articles.length > 0 ? (
                  group.articles.map((article) => (
                    <ArticlePanel
                      article={article}
                      articleDetailHref={`/article/${article.id}`}
                      canEdit={article.authorUserId === currentUser.id}
                      comments={getArticleComments(commentsByArticleId, article.id)}
                      commentFormResetKey={commentFormResetKeyByArticleId[article.id] ?? 0}
                      currentUserId={currentUser.id}
                      editingCommentId={editingCommentId}
                      errorByKey={errorByKey}
                      key={article.id}
                      onCreateComment={createComment}
                      onDeleteArticle={() => requestDeleteArticle(article)}
                      onDeleteComment={requestDeleteComment}
                      onEditArticle={() =>
                        setActiveArticleForm({ articleId: article.id, type: 'edit' })
                      }
                      onEditComment={setEditingCommentId}
                      onReplyComment={setReplyingCommentId}
                      onSubmitCommentEdit={updateComment}
                      onToggleArticleLike={toggleArticleLike}
                      onToggleCommentLike={toggleCommentLike}
                      articleLikePending={pendingLikeByKey[`article-${article.id}`] === true}
                      isCommentLikePending={(commentId) =>
                        pendingLikeByKey[`comment-${commentId}`] === true
                      }
                      replyingCommentId={replyingCommentId}
                    />
                  ))
                ) : (
                  <div className={`bg-[var(--surface0)] !p-4 ${boxBorderClassName}`} box-="round">
                    <Command>articles.empty {group.hiking.id}</Command>
                    <p className="m-0 text-[var(--subtext0)]">아직 이 산행에 게시글이 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>

        <StatusPanel
          articleCount={visibleArticleCount}
          commentCount={visibleCommentCount}
          currentAuthorName={currentAuthorName}
          groupCount={groups.length}
          hikingCount={initialHikings.length}
        />
      </div>
      <FeedFooter
        articleCount={visibleArticleCount}
        commentCount={visibleCommentCount}
        hikingCount={initialHikings.length}
      />
      <ConfirmDialog
        confirmState={confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
      />
      <HikingFormDialog
        error={activeHikingFormKey ? errorByKey[activeHikingFormKey] : undefined}
        formKey={activeHikingFormKey ?? 'hiking-form'}
        hiking={activeHiking}
        onCancel={closeActiveHikingForm}
        onOpenChange={(open) => {
          if (!open) {
            closeActiveHikingForm();
          }
        }}
        onSubmit={(values) => {
          if (activeHikingForm?.type === 'create') {
            createHiking(values);
            return;
          }

          if (activeHikingForm?.type === 'edit') {
            updateHiking(activeHikingForm.hikingId, values);
          }
        }}
        open={hikingFormDialogOpen}
        submitting={isPending && loadingLabel !== null}
        title={activeHikingFormTitle}
      />
      <ArticleFormDialog
        article={activeArticle}
        error={activeArticleFormKey ? errorByKey[activeArticleFormKey] : undefined}
        formKey={activeArticleFormKey ?? 'article-form'}
        onCancel={closeActiveArticleForm}
        onOpenChange={(open) => {
          if (!open) {
            closeActiveArticleForm();
          }
        }}
        onSubmit={(values) => {
          if (activeArticleForm?.type === 'create') {
            createArticle(activeArticleForm.hikingId, values);
            return;
          }

          if (activeArticleForm?.type === 'edit') {
            updateArticle(activeArticleForm.articleId, values);
          }
        }}
        open={articleFormDialogOpen}
        submitting={isPending && loadingLabel !== null}
        title={activeArticleFormTitle}
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
