'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { boxBorderClassName } from '@/app/common/components/styles';
import {
  createComment as createCommentAction,
  deleteArticle as deleteArticleAction,
  deleteComment as deleteCommentAction,
  toggleArticleLike as toggleArticleLikeAction,
  toggleCommentLike as toggleCommentLikeAction,
  updateArticle as updateArticleAction,
  updateComment as updateCommentAction,
} from '@/app/feed/actions';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { getAuthorName } from '@/app/feed/utils/feed-crud-utils';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import { ArticleFormDialog } from './ArticleFormDialog';
import type { ArticleFormValues } from './articleFormTypes';
import { ArticlePanel } from './ArticlePanel';

type ArticleDetailClientProps = {
  article: Article;
  comments: readonly Comment[];
  currentUser: AuthenticatedUser;
  highlightedCommentId: CommentId | null;
};

type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

export function ArticleDetailClient({
  article,
  comments,
  currentUser,
  highlightedCommentId,
}: ArticleDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingArticle, setEditingArticle] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKey, setCommentFormResetKey] = useState(0);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [pendingLikeByKey, setPendingLikeByKey] = useState<Record<string, boolean>>({});
  const currentAuthorName = getAuthorName(currentUser);

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
    setLoadingLabel(options.loadingLabel ?? null);

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

  const createArticleFormData = (values: ArticleFormValues) => {
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

    formData.set('articleId', article.id);
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

      if (media.thumbnailFile) {
        formData.append(`mediaThumbnail-${media.order}`, media.thumbnailFile);
      }
    }

    return formData;
  };

  const updateArticle = (values: ArticleFormValues) => {
    if (values.media.length === 0) {
      setError(`article-edit-${article.id}`, '게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
      return;
    }

    runAction(() => updateArticleAction(createArticleFormData(values)), {
      errorKey: `article-edit-${article.id}`,
      loadingLabel: '게시글 저장 중',
      onSuccess: () => setEditingArticle(false),
    });
  };

  const requestDeleteArticle = () => {
    setConfirmState({
      body: '정말 삭제할까요?',
      confirmLabel: '삭제',
      onConfirm: () => {
        const formData = new FormData();
        formData.set('articleId', article.id);
        runAction(() => deleteArticleAction(formData), {
          errorKey: `article-${article.id}`,
          onSuccess: () => {
            setConfirmState(null);
            router.push('/feed');
          },
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
          setCommentFormResetKey((currentKey) => currentKey + 1);
        }

        setReplyingCommentId(null);
      },
    });
  };

  const updateComment = (commentId: CommentId, body: string) => {
    const formData = new FormData();
    formData.set('articleId', article.id);
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
        formData.set('articleId', article.id);
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
    formData.set('articleId', article.id);
    formData.set('commentId', commentId);

    setLikePending(likePendingKey, true);
    runAction(() => toggleCommentLikeAction(formData), {
      errorKey: `comment-${commentId}`,
      onSettled: () => setLikePending(likePendingKey, false),
    });
  };

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar currentAuthorName={currentAuthorName} user={currentUser} />
      <div className="mx-auto grid w-[min(100%,62rem)] gap-4 px-1.5 py-4 sm:px-4 lg:p-5">
        <section
          className={`flex flex-wrap items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
          box-="round"
        >
          <Command>article.detail {article.id}</Command>
          <ActionButton onClick={() => router.push('/feed')}>피드로 이동</ActionButton>
        </section>

        <ArticlePanel
          article={article}
          articleLikePending={pendingLikeByKey[`article-${article.id}`] === true}
          canEdit={article.authorUserId === currentUser.id}
          comments={comments}
          commentFormResetKey={commentFormResetKey}
          currentUserId={currentUser.id}
          editingCommentId={editingCommentId}
          errorByKey={errorByKey}
          highlightedCommentId={highlightedCommentId}
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
        article={article}
        error={errorByKey[`article-edit-${article.id}`]}
        formKey={`article-edit-${article.id}`}
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
        submitting={isPending && loadingLabel !== null}
        title="게시글 수정"
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={isPending && loadingLabel !== null} />
    </main>
  );
}
