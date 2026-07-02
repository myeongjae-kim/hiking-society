'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { ArticleForm } from '@/app/article/components/ArticleForm';
import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { ArticlePanel } from '@/app/article/components/ArticlePanel';
import { getVisibleCommentCount } from '@/app/comment/components/commentUtils';
import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { boxBorderClassName, gridStackClassName } from '@/app/common/components/styles';
import { FeedFooter } from '@/app/feed/components/FeedFooter';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { StatusPanel } from '@/app/feed/components/StatusPanel';
import { HikingForm } from '@/app/hiking/components/HikingForm';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import { HikingHeader } from '@/app/hiking/components/HikingHeader';
import type { Article, ArticleId } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import {
  createArticle as createArticleAction,
  createComment as createCommentAction,
  createHiking as createHikingAction,
  deleteArticle as deleteArticleAction,
  deleteComment as deleteCommentAction,
  deleteHiking as deleteHikingAction,
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
  currentUser: AuthenticatedUser;
  hikings: readonly Hiking[];
};

export function FeedCrudClient({
  articles: initialArticles,
  comments: initialComments,
  currentUser,
  hikings: initialHikings,
}: FeedCrudClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const [newHikingOpen, setNewHikingOpen] = useState(false);
  const [editingHikingId, setEditingHikingId] = useState<HikingId | null>(null);
  const [articleFormHikingId, setArticleFormHikingId] = useState<HikingId | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<ArticleId | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [commentFormResetKeyByArticleId, setCommentFormResetKeyByArticleId] = useState<
    Record<string, number>
  >({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

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
    options: { errorKey: string; onSuccess?: () => void },
  ) => {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setError(options.errorKey, result.error ?? '요청을 처리하지 못했습니다.');
        return;
      }

      options.onSuccess?.();
      setError(options.errorKey, null);
      router.refresh();
    });
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
    const existingPhotos = values.photos
      .filter((photo) => !photo.file)
      .map((photo) => ({
        byteSize: photo.byteSize,
        contentType: photo.contentType,
        objectKey: photo.objectKey,
        order: photo.order,
        url: photo.url,
      }));

    if (identifiers.articleId) {
      formData.set('articleId', identifiers.articleId);
    }

    if (identifiers.hikingId) {
      formData.set('hikingId', identifiers.hikingId);
    }

    formData.set('body', values.body);
    formData.set('existingPhotos', JSON.stringify(existingPhotos));

    for (const photo of values.photos) {
      if (!photo.file) {
        continue;
      }

      formData.append('photos', photo.file);
      formData.append('photoOrders', String(photo.order));
    }

    return formData;
  };

  const createHiking = (values: HikingFormValues) => {
    runAction(() => createHikingAction(createHikingFormData(values)), {
      errorKey: 'hiking-new',
      onSuccess: () => setNewHikingOpen(false),
    });
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    const formData = createHikingFormData(values);
    formData.set('hikingId', hikingId);

    runAction(() => updateHikingAction(formData), {
      errorKey: `hiking-edit-${hikingId}`,
      onSuccess: () => setEditingHikingId(null),
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
    if (values.photos.length === 0) {
      setError(`article-new-${hikingId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    runAction(() => createArticleAction(createArticleFormData(values, { hikingId })), {
      errorKey: `article-new-${hikingId}`,
      onSuccess: () => setArticleFormHikingId(null),
    });
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.photos.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    runAction(() => updateArticleAction(createArticleFormData(values, { articleId })), {
      errorKey: `article-edit-${articleId}`,
      onSuccess: () => setEditingArticleId(null),
    });
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '게시글은 피드에서 숨겨지고 삭제 시각만 남습니다.',
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
      body: '댓글은 대화 맥락이 필요하면 자리표시자로 남습니다.',
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

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar currentAuthorName={currentAuthorName} user={currentUser} />

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 게시글 피드">
          <section
            className={`grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
            box-="round"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Command>feed.crud --db</Command>
              <ActionButton onClick={() => setNewHikingOpen((open) => !open)}>
                산행 등록
              </ActionButton>
            </div>
            {newHikingOpen ? (
              <HikingForm
                error={errorByKey['hiking-new']}
                onCancel={() => {
                  setNewHikingOpen(false);
                  setError('hiking-new', null);
                }}
                onSubmit={createHiking}
              />
            ) : null}
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
                onAddArticle={() => setArticleFormHikingId(group.hiking.id)}
                onDelete={() => requestDeleteHiking(group.hiking)}
                onEdit={() => setEditingHikingId(group.hiking.id)}
              />
              {editingHikingId === group.hiking.id ? (
                <HikingForm
                  error={errorByKey[`hiking-edit-${group.hiking.id}`]}
                  hiking={group.hiking}
                  onCancel={() => {
                    setEditingHikingId(null);
                    setError(`hiking-edit-${group.hiking.id}`, null);
                  }}
                  onSubmit={(values) => updateHiking(group.hiking.id, values)}
                />
              ) : null}
              {articleFormHikingId === group.hiking.id ? (
                <ArticleForm
                  error={errorByKey[`article-new-${group.hiking.id}`]}
                  onCancel={() => {
                    setArticleFormHikingId(null);
                    setError(`article-new-${group.hiking.id}`, null);
                  }}
                  onSubmit={(values) => createArticle(group.hiking.id, values)}
                />
              ) : null}
              <div className={gridStackClassName}>
                {group.articles.length > 0 ? (
                  group.articles.map((article) => (
                    <ArticlePanel
                      article={article}
                      canEdit={article.authorUserId === currentUser.id}
                      comments={getArticleComments(commentsByArticleId, article.id)}
                      commentFormResetKey={commentFormResetKeyByArticleId[article.id] ?? 0}
                      currentUserId={currentUser.id}
                      editingArticleId={editingArticleId}
                      editingCommentId={editingCommentId}
                      errorByKey={errorByKey}
                      key={article.id}
                      onCancelArticleEdit={() => setEditingArticleId(null)}
                      onCreateComment={createComment}
                      onDeleteArticle={() => requestDeleteArticle(article)}
                      onDeleteComment={requestDeleteComment}
                      onEditArticle={() => setEditingArticleId(article.id)}
                      onEditComment={setEditingCommentId}
                      onReplyComment={setReplyingCommentId}
                      onSubmitArticleEdit={(values) => updateArticle(article.id, values)}
                      onSubmitCommentEdit={updateComment}
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
    </main>
  );
}
