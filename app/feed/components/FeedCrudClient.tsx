'use client';

import { useMemo, useState } from 'react';

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
import type { IsoDateString, Latitude, Longitude, Timezone } from '@/core/common/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';

import {
  getArticleComments,
  getAuthorName,
  getCommentsByArticleId,
  getFeedGroups,
  isOwn,
  makeDateTime,
  nowIso,
} from '../utils/feed-crud-utils';

type FeedCrudClientProps = {
  articles: readonly Article[];
  comments: readonly Comment[];
  currentUser: AuthenticatedUser;
  hikings: readonly Hiking[];
};

const thumbnailUrl = '/thumbnail.webp';

export function FeedCrudClient({
  articles: initialArticles,
  comments: initialComments,
  currentUser,
  hikings: initialHikings,
}: FeedCrudClientProps) {
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const [articles, setArticles] = useState<Article[]>(() => [...initialArticles]);
  const [comments, setComments] = useState<Comment[]>(() => [...initialComments]);
  const [hikings, setHikings] = useState<Hiking[]>(() => [...initialHikings]);
  const [newHikingOpen, setNewHikingOpen] = useState(false);
  const [editingHikingId, setEditingHikingId] = useState<HikingId | null>(null);
  const [articleFormHikingId, setArticleFormHikingId] = useState<HikingId | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<ArticleId | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const groups = useMemo(() => getFeedGroups(hikings, articles), [articles, hikings]);
  const commentsByArticleId = useMemo(() => getCommentsByArticleId(comments), [comments]);
  const visibleArticleCount = articles.filter((article) => article.deletedAt === null).length;
  const visibleCommentCount = getVisibleCommentCount(comments);

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

  const createHiking = (values: HikingFormValues) => {
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('hiking-new', '위도와 경도는 숫자로 입력해야 합니다.');
      return;
    }

    const createdAt = nowIso();
    const hiking: Hiking = {
      authorName: currentAuthorName,
      completedAt: makeDateTime(values.hikingDate, values.completedTime, values.timezone),
      createdAt,
      hikingDate: values.hikingDate as IsoDateString,
      id: `hiking-local-${crypto.randomUUID()}` as HikingId,
      latitude: latitude as Latitude,
      longitude: longitude as Longitude,
      mountainName: values.mountainName,
      participantsCsv: values.participantsCsv,
      restaurantAddress: values.restaurantAddress.trim() || null,
      startedAt: makeDateTime(values.hikingDate, values.startedTime, values.timezone),
      timezone: values.timezone as Timezone,
      updatedAt: createdAt,
    };

    setHikings((currentHikings) => [hiking, ...currentHikings]);
    setNewHikingOpen(false);
    setError('hiking-new', null);
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(`hiking-edit-${hikingId}`, '위도와 경도는 숫자로 입력해야 합니다.');
      return;
    }

    setHikings((currentHikings) =>
      currentHikings.map((hiking) =>
        hiking.id === hikingId
          ? {
              ...hiking,
              completedAt: makeDateTime(values.hikingDate, values.completedTime, values.timezone),
              hikingDate: values.hikingDate as IsoDateString,
              latitude: latitude as Latitude,
              longitude: longitude as Longitude,
              mountainName: values.mountainName,
              participantsCsv: values.participantsCsv,
              restaurantAddress: values.restaurantAddress.trim() || null,
              startedAt: makeDateTime(values.hikingDate, values.startedTime, values.timezone),
              timezone: values.timezone as Timezone,
              updatedAt: nowIso(),
            }
          : hiking,
      ),
    );
    setEditingHikingId(null);
    setError(`hiking-edit-${hikingId}`, null);
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = articles.some(
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
        setHikings((currentHikings) => currentHikings.filter((item) => item.id !== hiking.id));
        setConfirmState(null);
      },
      title: '산행 삭제',
    });
  };

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.photos.length === 0) {
      setError(`article-new-${hikingId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    const createdAt = nowIso();
    const article: Article = {
      authorName: currentAuthorName,
      body: values.body,
      createdAt,
      deletedAt: null,
      edited: false,
      hikingId,
      id: `article-local-${crypto.randomUUID()}` as ArticleId,
      photos:
        values.photos.length > 0
          ? [values.photos[0], ...values.photos.slice(1)]
          : [{ order: 1, url: thumbnailUrl }],
      updatedAt: createdAt,
    };

    setArticles((currentArticles) => [article, ...currentArticles]);
    setArticleFormHikingId(null);
    setError(`article-new-${hikingId}`, null);
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.photos.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    setArticles((currentArticles) =>
      currentArticles.map((article) =>
        article.id === articleId
          ? {
              ...article,
              body: values.body,
              edited: true,
              photos:
                values.photos.length > 0
                  ? [values.photos[0], ...values.photos.slice(1)]
                  : article.photos,
              updatedAt: nowIso(),
            }
          : article,
      ),
    );
    setEditingArticleId(null);
    setError(`article-edit-${articleId}`, null);
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '게시글은 피드에서 숨겨지고 삭제 시각만 남습니다.',
      confirmLabel: '삭제',
      onConfirm: () => {
        setArticles((currentArticles) =>
          currentArticles.map((item) =>
            item.id === article.id ? { ...item, deletedAt: nowIso() } : item,
          ),
        );
        setConfirmState(null);
      },
      title: '게시글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    const createdAt = nowIso();
    const comment = {
      articleId,
      authorName: currentAuthorName,
      body,
      createdAt,
      deletedAt: null,
      id: `comment-local-${crypto.randomUUID()}` as CommentId,
      parentCommentId,
      updatedAt: createdAt,
    } as Comment;

    setComments((currentComments) => [...currentComments, comment]);
    setReplyingCommentId(null);
    setError(`comment-new-${articleId}`, null);
  };

  const updateComment = (commentId: CommentId, body: string) => {
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === commentId ? { ...comment, body, updatedAt: nowIso() } : comment,
      ),
    );
    setEditingCommentId(null);
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '댓글은 대화 맥락이 필요하면 자리표시자로 남습니다.',
      confirmLabel: '삭제',
      onConfirm: () => {
        setComments((currentComments) =>
          currentComments.map((item) =>
            item.id === comment.id ? { ...item, deletedAt: nowIso(), body: '삭제된 댓글' } : item,
          ),
        );
        setConfirmState(null);
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
              <Command>feed.crud --mock</Command>
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
                canManageHiking={isOwn(group.hiking.authorName, currentAuthorName)}
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
                      canEdit={isOwn(article.authorName, currentAuthorName)}
                      comments={getArticleComments(commentsByArticleId, article.id)}
                      currentAuthorName={currentAuthorName}
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
          hikingCount={hikings.length}
        />
      </div>
      <FeedFooter
        articleCount={visibleArticleCount}
        commentCount={visibleCommentCount}
        hikingCount={hikings.length}
      />
      <ConfirmDialog
        confirmState={confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
      />
    </main>
  );
}
